const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const DATASETS_PATH = path.join(__dirname, '..', '..', 'datasets');

// GET /api/etl/runs — ETL run history (admin only)
router.get('/runs', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const runs = db.prepare(
      'SELECT * FROM etl_runs ORDER BY started_at DESC LIMIT 30'
    ).all();
    res.json({ success: true, data: runs });
  } catch (err) {
    console.error('ETL runs error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/etl/trigger — Run the in-process ETL pipeline (admin only)
router.post('/trigger', authenticate, authorize('admin'), (req, res) => {
  const db = getDb();
  const runId = uuidv4();
  const startedAt = new Date().toISOString();

  // Record run start immediately
  try {
    db.prepare(
      "INSERT INTO etl_runs (id, source_file, status, started_at) VALUES (?, ?, 'running', ?)"
    ).run(runId, 'knowledge_articles.csv', startedAt);
  } catch (initErr) {
    return res.status(500).json({ success: false, message: 'Failed to initialise ETL run: ' + initErr.message });
  }

  try {
    // ── EXTRACT ────────────────────────────────────────────────────────────
    const csvPath = path.join(DATASETS_PATH, 'knowledge_articles.csv');
    if (!fs.existsSync(csvPath)) {
      db.prepare("UPDATE etl_runs SET status='failed', error_message=?, completed_at=? WHERE id=?")
        .run('knowledge_articles.csv not found in datasets/ folder', new Date().toISOString(), runId);
      return res.status(400).json({ success: false, message: 'knowledge_articles.csv not found in datasets/ folder' });
    }

    const rawCsv = fs.readFileSync(csvPath, 'utf-8');
    const lines = rawCsv.split('\n').map(l => l.trim()).filter(Boolean);
    const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/^"|"$/g, '').trim());

    const rows = lines.slice(1).map(line => {
      const values = parseCsvLine(line);
      const row = {};
      headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
      return row;
    });

    const extracted = rows.length;
    db.prepare('UPDATE etl_runs SET records_extracted=? WHERE id=?').run(extracted, runId);

    // ── TRANSFORM + LOAD ───────────────────────────────────────────────────
    // Build lookup maps
    const categories = db.prepare('SELECT id, name FROM categories').all();
    const catMap = {};
    categories.forEach(c => { catMap[c.name.toLowerCase()] = c.id; });

    const existingTags = db.prepare('SELECT id, name FROM tags').all();
    const tagMap = {};
    existingTags.forEach(t => { tagMap[t.name.toLowerCase()] = t.id; });

    const users = db.prepare('SELECT id, email FROM users').all();
    const userMap = {};
    users.forEach(u => { userMap[u.email.toLowerCase()] = u.id; });
    const defaultAuthorId = userMap['author@ekbms.com'] || (users[0] && users[0].id);

    let transformed = 0;
    let loaded = 0;
    const errors = [];

    const CATEGORY_ALIASES = {
      'hr': 'hr policies', 'human resources': 'hr policies',
      'it': 'it support', 'information technology': 'it support',
      'infra': 'infrastructure',
      'training': 'training materials', 'learning': 'training materials',
      'financial': 'finance', 'accounting': 'finance',
      'ops': 'operations', 'operational': 'operations',
    };
    const VALID_STATUSES = new Set(['draft', 'pending_approval', 'approved', 'rejected', 'archived']);

    for (const row of rows) {
      try {
        const title = (row.title || '').trim();
        const category = (row.category || '').trim();
        if (!title || !category) { errors.push(`Skipped: missing title or category`); continue; }

        // Resolve category
        const catKey = category.toLowerCase();
        const resolvedCatKey = CATEGORY_ALIASES[catKey] || catKey;
        const categoryId = catMap[resolvedCatKey] || catMap[catKey] || null;

        // Resolve author
        const authorEmail = (row.author_email || '').toLowerCase().trim();
        const authorId = userMap[authorEmail] || defaultAuthorId;
        if (!authorId) { errors.push(`No author for "${title}"`); continue; }

        // Check duplicate
        const dup = db.prepare('SELECT id FROM articles WHERE LOWER(title) = LOWER(?)').get(title);
        if (dup) { errors.push(`Duplicate skipped: "${title}"`); continue; }

        transformed++;

        const articleId = uuidv4();
        const summary = (row.summary || title).trim();
        const content = `# ${title}\n\n${summary}`;
        const status = VALID_STATUSES.has((row.status || '').toLowerCase())
          ? row.status.toLowerCase() : 'approved';
        const views = Math.max(0, parseInt(row.views, 10) || 0);
        const createdAt = row.created_date
          ? new Date(row.created_date).toISOString()
          : new Date().toISOString();

        db.prepare(
          'INSERT INTO articles (id, title, content, summary, category_id, author_id, status, view_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(articleId, title, content, summary, categoryId, authorId, status, views, createdAt, createdAt);

        // Tags
        if (row.tags) {
          for (const rawTag of row.tags.split(',')) {
            const tagName = rawTag.trim().toLowerCase();
            if (!tagName) continue;
            let tagId = tagMap[tagName];
            if (!tagId) {
              tagId = uuidv4();
              db.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)').run(tagId, tagName);
              tagMap[tagName] = tagId;
            }
            db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)').run(articleId, tagId);
          }
        }

        loaded++;
      } catch (rowErr) {
        errors.push(`Error on "${row.title || '?'}": ${rowErr.message}`);
      }
    }

    // Finalise run record
    const errorMsg = errors.length > 0 ? errors.slice(0, 5).join('; ') : null;
    db.prepare(
      "UPDATE etl_runs SET status='completed', records_transformed=?, records_loaded=?, error_message=?, completed_at=? WHERE id=?"
    ).run(transformed, loaded, errorMsg, new Date().toISOString(), runId);

    return res.json({
      success: true,
      data: { runId, extracted, transformed, loaded, errors: errors.slice(0, 10) }
    });

  } catch (err) {
    console.error('ETL trigger error:', err);
    try {
      db.prepare("UPDATE etl_runs SET status='failed', error_message=?, completed_at=? WHERE id=?")
        .run(err.message, new Date().toISOString(), runId);
    } catch (_) {}
    return res.status(500).json({ success: false, message: 'ETL pipeline failed: ' + err.message });
  }
});

// ── CSV parser that handles quoted fields correctly ────────────────────────
function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

module.exports = router;
