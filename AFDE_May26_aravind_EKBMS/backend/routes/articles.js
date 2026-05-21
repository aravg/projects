const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const { status, category, author, sort = 'created_at', page = 1, limit = 10, featured } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    } else if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'reviewer')) {
      if (req.user && req.user.role === 'author') {
        conditions.push('(a.status = ? OR a.author_id = ?)');
        params.push('approved', req.user.id);
      } else {
        conditions.push('a.status = ?');
        params.push('approved');
      }
    }

    if (category) {
      conditions.push('a.category_id = ?');
      params.push(category);
    }
    if (author) {
      conditions.push('a.author_id = ?');
      params.push(author);
    }
    if (featured === 'true') {
      conditions.push('a.is_featured = 1');
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const sortColumn = sort === 'popular' ? 'a.view_count' : 'a.created_at';

    const countQuery = `SELECT COUNT(*) as total FROM articles a ${whereClause}`;
    const totalResult = db.prepare(countQuery).get(...params);
    const total = totalResult.total;

    const query = `
      SELECT a.*,
        u.name as author_name, u.email as author_email,
        c.name as category_name, c.color as category_color,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as rating_count,
        COUNT(DISTINCT cm.id) as comment_count
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN ratings r ON a.id = r.article_id
      LEFT JOIN comments cm ON a.id = cm.article_id
      ${whereClause}
      GROUP BY a.id
      ORDER BY ${sortColumn} DESC
      LIMIT ? OFFSET ?
    `;

    const articles = db.prepare(query).all(...params, parseInt(limit), offset);

    const articlesWithTags = articles.map(article => {
      const tags = db.prepare(`
        SELECT t.id, t.name FROM tags t
        JOIN article_tags at2 ON t.id = at2.tag_id
        WHERE at2.article_id = ?
      `).all(article.id);
      return { ...article, tags };
    });

    res.json({
      success: true,
      data: {
        articles: articlesWithTags,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (err) {
    console.error('Get articles error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', authenticate, authorize('author', 'admin'), (req, res) => {
  try {
    const { title, content, summary, category_id, tags = [], is_featured = false } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const db = getDb();
    const id = uuidv4();
    db.prepare(
      'INSERT INTO articles (id, title, content, summary, category_id, author_id, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, title, content, summary || null, category_id || null, req.user.id, is_featured ? 1 : 0);

    if (tags.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)');
      tags.forEach(tagId => insertTag.run(id, tagId));
    }

    const article = db.prepare(`
      SELECT a.*, u.name as author_name, c.name as category_name, c.color as category_color
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).get(id);

    const articleTags = db.prepare(`
      SELECT t.id, t.name FROM tags t
      JOIN article_tags at2 ON t.id = at2.tag_id
      WHERE at2.article_id = ?
    `).all(id);

    res.status(201).json({ success: true, data: { ...article, tags: articleTags }, message: 'Article created successfully' });
  } catch (err) {
    console.error('Create article error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const article = db.prepare(`
      SELECT a.*,
        u.name as author_name, u.email as author_email,
        c.name as category_name, c.color as category_color,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as rating_count,
        COUNT(DISTINCT cm.id) as comment_count
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN ratings r ON a.id = r.article_id
      LEFT JOIN comments cm ON a.id = cm.article_id
      WHERE a.id = ?
      GROUP BY a.id
    `).get(req.params.id);

    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (article.status !== 'approved') {
      if (!req.user) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (req.user.role !== 'admin' && req.user.role !== 'reviewer' && req.user.id !== article.author_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

    const tags = db.prepare(`
      SELECT t.id, t.name FROM tags t
      JOIN article_tags at2 ON t.id = at2.tag_id
      WHERE at2.article_id = ?
    `).all(req.params.id);

    const attachments = db.prepare('SELECT * FROM attachments WHERE article_id = ?').all(req.params.id);

    let isBookmarked = false;
    let userRating = null;
    if (req.user) {
      const bookmark = db.prepare('SELECT id FROM bookmarks WHERE article_id = ? AND user_id = ?').get(req.params.id, req.user.id);
      isBookmarked = !!bookmark;
      const rating = db.prepare('SELECT rating FROM ratings WHERE article_id = ? AND user_id = ?').get(req.params.id, req.user.id);
      userRating = rating ? rating.rating : null;
    }

    res.json({
      success: true,
      data: { ...article, view_count: article.view_count + 1, tags, attachments, isBookmarked, userRating }
    });
  } catch (err) {
    console.error('Get article error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (req.user.role !== 'admin' && article.author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { title, content, summary, category_id, tags = [], is_featured, status } = req.body;
    const newTitle = title || article.title;
    const newContent = content || article.content;
    const newSummary = summary !== undefined ? summary : article.summary;
    const newCategoryId = category_id !== undefined ? category_id : article.category_id;
    const newIsFeatured = is_featured !== undefined ? (is_featured ? 1 : 0) : article.is_featured;
    const newStatus = (req.user.role === 'admin' && status) ? status : article.status;

    db.prepare(
      'UPDATE articles SET title = ?, content = ?, summary = ?, category_id = ?, is_featured = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(newTitle, newContent, newSummary, newCategoryId, newIsFeatured, newStatus, req.params.id);

    db.prepare('DELETE FROM article_tags WHERE article_id = ?').run(req.params.id);
    if (tags.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)');
      tags.forEach(tagId => insertTag.run(req.params.id, tagId));
    }

    const updated = db.prepare(`
      SELECT a.*, u.name as author_name, c.name as category_name, c.color as category_color
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).get(req.params.id);

    const updatedTags = db.prepare(`
      SELECT t.id, t.name FROM tags t
      JOIN article_tags at2 ON t.id = at2.tag_id
      WHERE at2.article_id = ?
    `).all(req.params.id);

    res.json({ success: true, data: { ...updated, tags: updatedTags }, message: 'Article updated successfully' });
  } catch (err) {
    console.error('Update article error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (req.user.role !== 'admin' && article.author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    console.error('Delete article error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:id/submit', authenticate, authorize('author', 'admin'), (req, res) => {
  try {
    const db = getDb();
    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    if (req.user.role !== 'admin' && article.author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (article.status !== 'draft' && article.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only draft or rejected articles can be submitted' });
    }

    db.prepare('UPDATE articles SET status = ?, rejection_reason = NULL, updated_at = datetime(\'now\') WHERE id = ?').run('pending_approval', req.params.id);

    const reviewers = db.prepare('SELECT id FROM users WHERE role IN (\'reviewer\', \'admin\') AND is_active = 1').all();
    const insertNotification = db.prepare('INSERT INTO notifications (id, user_id, message, type, article_id) VALUES (?, ?, ?, ?, ?)');
    reviewers.forEach(reviewer => {
      insertNotification.run(uuidv4(), reviewer.id, `Article "${article.title}" has been submitted for review.`, 'info', article.id);
    });

    res.json({ success: true, message: 'Article submitted for approval' });
  } catch (err) {
    console.error('Submit article error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:id/bookmark', authenticate, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM bookmarks WHERE article_id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE article_id = ? AND user_id = ?').run(req.params.id, req.user.id);
      res.json({ success: true, data: { bookmarked: false }, message: 'Bookmark removed' });
    } else {
      db.prepare('INSERT INTO bookmarks (id, article_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.id, req.user.id);
      res.json({ success: true, data: { bookmarked: true }, message: 'Article bookmarked' });
    }
  } catch (err) {
    console.error('Bookmark error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id/bookmarks', authenticate, (req, res) => {
  try {
    const db = getDb();
    const bookmark = db.prepare('SELECT id FROM bookmarks WHERE article_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    res.json({ success: true, data: { bookmarked: !!bookmark } });
  } catch (err) {
    console.error('Get bookmark error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/:id/rate', authenticate, (req, res) => {
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM ratings WHERE article_id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (existing) {
      db.prepare('UPDATE ratings SET rating = ? WHERE article_id = ? AND user_id = ?').run(rating, req.params.id, req.user.id);
    } else {
      db.prepare('INSERT INTO ratings (id, article_id, user_id, rating) VALUES (?, ?, ?, ?)').run(uuidv4(), req.params.id, req.user.id, rating);
    }

    const result = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM ratings WHERE article_id = ?').get(req.params.id);
    res.json({ success: true, data: { avgRating: result.avg, ratingCount: result.count }, message: 'Rating submitted' });
  } catch (err) {
    console.error('Rate article error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id/ratings', (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM ratings WHERE article_id = ?').get(req.params.id);
    res.json({ success: true, data: { avgRating: result.avg || 0, ratingCount: result.count } });
  } catch (err) {
    console.error('Get ratings error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
