const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const tags = db.prepare(`
      SELECT t.*, COUNT(at2.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at2 ON t.id = at2.tag_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `).all();
    res.json({ success: true, data: tags });
  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', authenticate, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tag name is required' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(name.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ success: false, message: 'Tag already exists' });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(id, name.toLowerCase().trim());
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: tag, message: 'Tag created successfully' });
  } catch (err) {
    console.error('Create tag error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id);
    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (err) {
    console.error('Delete tag error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
