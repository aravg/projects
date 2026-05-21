const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const { q = '', category, tag, author, sort = 'relevance', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let conditions = ['a.status = ?'];
    let params = ['approved'];

    if (q) {
      conditions.push('(a.title LIKE ? OR a.content LIKE ? OR a.summary LIKE ?)');
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      conditions.push('a.category_id = ?');
      params.push(category);
    }

    if (tag) {
      conditions.push('EXISTS (SELECT 1 FROM article_tags at2 JOIN tags t ON at2.tag_id = t.id WHERE at2.article_id = a.id AND t.name = ?)');
      params.push(tag);
    }

    if (author) {
      conditions.push('a.author_id = ?');
      params.push(author);
    }

    const whereClause = 'WHERE ' + conditions.join(' AND ');

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM articles a ${whereClause}`).get(...params);
    const total = countResult.total;

    let orderBy = 'a.created_at DESC';
    if (sort === 'popular') orderBy = 'a.view_count DESC';
    else if (sort === 'rating') orderBy = 'avg_rating DESC';
    else if (sort === 'oldest') orderBy = 'a.created_at ASC';

    const articles = db.prepare(`
      SELECT a.*,
        u.name as author_name,
        c.name as category_name, c.color as category_color,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as rating_count
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN ratings r ON a.id = r.article_id
      ${whereClause}
      GROUP BY a.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    const articlesWithTags = articles.map(article => {
      const tags = db.prepare(`
        SELECT t.id, t.name FROM tags t
        JOIN article_tags at2 ON t.id = at2.tag_id
        WHERE at2.article_id = ?
      `).all(article.id);

      let highlight = {};
      if (q) {
        const qLower = q.toLowerCase();
        if (article.title && article.title.toLowerCase().includes(qLower)) {
          highlight.title = article.title;
        }
        if (article.summary && article.summary.toLowerCase().includes(qLower)) {
          const idx = article.summary.toLowerCase().indexOf(qLower);
          const start = Math.max(0, idx - 50);
          const end = Math.min(article.summary.length, idx + q.length + 100);
          highlight.summary = '...' + article.summary.substring(start, end) + '...';
        }
      }

      return { ...article, tags, highlight };
    });

    if (q) {
      db.prepare('INSERT INTO search_logs (id, query, user_id, results_count) VALUES (?, ?, ?, ?)').run(
        uuidv4(), q, req.user ? req.user.id : null, total
      );
    }

    res.json({
      success: true,
      data: {
        articles: articlesWithTags,
        query: q,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
