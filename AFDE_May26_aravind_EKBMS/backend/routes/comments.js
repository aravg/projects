const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/:articleId', (req, res) => {
  try {
    const db = getDb();
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.article_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.articleId);
    res.json({ success: true, data: comments });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:articleId', authenticate, (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const db = getDb();
    const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.articleId);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO comments (id, article_id, user_id, content) VALUES (?, ?, ?, ?)').run(
      id, req.params.articleId, req.user.id, content.trim()
    );

    const comment = db.prepare(`
      SELECT c.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);

    res.status(201).json({ success: true, data: comment, message: 'Comment added successfully' });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
