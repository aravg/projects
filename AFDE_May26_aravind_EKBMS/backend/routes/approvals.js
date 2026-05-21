const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/pending', authenticate, authorize('reviewer', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const articles = db.prepare(`
      SELECT a.*,
        u.name as author_name, u.email as author_email,
        c.name as category_name, c.color as category_color
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'pending_approval'
      ORDER BY a.created_at ASC
    `).all();

    const articlesWithTags = articles.map(article => {
      const tags = db.prepare(`
        SELECT t.id, t.name FROM tags t
        JOIN article_tags at2 ON t.id = at2.tag_id
        WHERE at2.article_id = ?
      `).all(article.id);
      return { ...article, tags };
    });

    res.json({ success: true, data: articlesWithTags });
  } catch (err) {
    console.error('Get pending error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:articleId/approve', authenticate, authorize('reviewer', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (article.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Article is not pending approval' });
    }

    db.prepare('UPDATE articles SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run('approved', req.params.articleId);

    db.prepare('INSERT INTO approval_history (id, article_id, reviewer_id, action, comments) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), req.params.articleId, req.user.id, 'approved', req.body.comments || null
    );

    db.prepare('INSERT INTO notifications (id, user_id, message, type, article_id) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), article.author_id,
      `Your article "${article.title}" has been approved and published!`,
      'success', article.id
    );

    db.prepare('DELETE FROM notifications WHERE article_id = ? AND user_id != ? AND type = ?').run(
      req.params.articleId, article.author_id, 'info'
    );

    res.json({ success: true, message: 'Article approved successfully' });
  } catch (err) {
    console.error('Approve article error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:articleId/reject', authenticate, authorize('reviewer', 'admin'), (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const db = getDb();
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (article.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Article is not pending approval' });
    }

    db.prepare('UPDATE articles SET status = ?, rejection_reason = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
      'rejected', reason.trim(), req.params.articleId
    );

    db.prepare('INSERT INTO approval_history (id, article_id, reviewer_id, action, comments) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), req.params.articleId, req.user.id, 'rejected', reason.trim()
    );

    db.prepare('INSERT INTO notifications (id, user_id, message, type, article_id) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), article.author_id,
      `Your article "${article.title}" was rejected. Reason: ${reason.trim()}`,
      'error', article.id
    );

    res.json({ success: true, message: 'Article rejected' });
  } catch (err) {
    console.error('Reject article error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/history', authenticate, authorize('reviewer', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const history = db.prepare(`
      SELECT ah.*,
        a.title as article_title, a.status as current_status,
        u.name as reviewer_name, u.email as reviewer_email,
        au.name as author_name
      FROM approval_history ah
      JOIN articles a ON ah.article_id = a.id
      JOIN users u ON ah.reviewer_id = u.id
      JOIN users au ON a.author_id = au.id
      ORDER BY ah.created_at DESC
      LIMIT 100
    `).all();
    res.json({ success: true, data: history });
  } catch (err) {
    console.error('Get approval history error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
