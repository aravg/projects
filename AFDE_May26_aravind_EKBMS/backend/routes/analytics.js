const express = require('express');
const { getDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', authenticate, (req, res) => {
  try {
    const db = getDb();

    const totalArticles = db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
    const approvedArticles = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'approved'").get().count;
    const pendingArticles = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'pending_approval'").get().count;
    const draftArticles = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'draft'").get().count;
    const rejectedArticles = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'rejected'").get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    const totalComments = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;

    const mostViewedArticles = db.prepare(`
      SELECT a.id, a.title, a.view_count, a.status,
        u.name as author_name,
        c.name as category_name, c.color as category_color,
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN ratings r ON a.id = r.article_id
      WHERE a.status = 'approved'
      GROUP BY a.id
      ORDER BY a.view_count DESC
      LIMIT 5
    `).all();

    const recentArticles = db.prepare(`
      SELECT a.id, a.title, a.status, a.created_at, a.view_count,
        u.name as author_name,
        c.name as category_name, c.color as category_color
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `).all();

    const categoryDistribution = db.prepare(`
      SELECT c.name, c.color, COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'approved'
      GROUP BY c.id
      ORDER BY article_count DESC
    `).all();

    const articlesByStatus = [
      { status: 'approved', count: approvedArticles, color: '#10b981' },
      { status: 'pending_approval', count: pendingArticles, color: '#f59e0b' },
      { status: 'draft', count: draftArticles, color: '#6b7280' },
      { status: 'rejected', count: rejectedArticles, color: '#ef4444' }
    ];

    res.json({
      success: true,
      data: {
        stats: { totalArticles, approvedArticles, pendingArticles, draftArticles, rejectedArticles, totalUsers, totalCategories, totalComments },
        mostViewedArticles,
        recentArticles,
        categoryDistribution,
        articlesByStatus
      }
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/search-trends', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const trends = db.prepare(`
      SELECT query, COUNT(*) as search_count, AVG(results_count) as avg_results
      FROM search_logs
      GROUP BY LOWER(query)
      ORDER BY search_count DESC
      LIMIT 10
    `).all();
    res.json({ success: true, data: trends });
  } catch (err) {
    console.error('Search trends error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/user-activity', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const recentUsers = db.prepare(`
      SELECT id, name, email, role, department, is_active, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    const usersByRole = db.prepare(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `).all();

    const recentComments = db.prepare(`
      SELECT c.content, c.created_at,
        u.name as user_name,
        a.title as article_title
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN articles a ON c.article_id = a.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `).all();

    res.json({ success: true, data: { recentUsers, usersByRole, recentComments } });
  } catch (err) {
    console.error('User activity error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/popular-categories', authenticate, (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT c.id, c.name, c.color, c.icon,
        COUNT(a.id) as article_count,
        SUM(COALESCE(a.view_count, 0)) as total_views
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'approved'
      GROUP BY c.id
      ORDER BY article_count DESC
    `).all();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('Popular categories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
