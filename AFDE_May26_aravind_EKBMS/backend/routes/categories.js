const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT c.*,
        COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'approved'
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const { name, description, parent_id, color, icon } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const db = getDb();
    const id = uuidv4();
    db.prepare(
      'INSERT INTO categories (id, name, description, parent_id, color, icon) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, description || null, parent_id || null, color || '#6366f1', icon || 'Folder');

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, parent_id, color, icon } = req.body;
    db.prepare(
      'UPDATE categories SET name = ?, description = ?, parent_id = ?, color = ?, icon = ? WHERE id = ?'
    ).run(
      name || category.name,
      description !== undefined ? description : category.description,
      parent_id !== undefined ? parent_id : category.parent_id,
      color || category.color,
      icon || category.icon,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated, message: 'Category updated successfully' });
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    db.prepare('UPDATE articles SET category_id = NULL WHERE category_id = ?').run(req.params.id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
