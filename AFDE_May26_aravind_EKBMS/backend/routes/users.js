const express = require('express');
const { getDb } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDb();
    const { search, role } = req.query;
    let conditions = [];
    let params = [];

    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ? OR department LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const users = db.prepare(`
      SELECT id, name, email, role, department, is_active, created_at
      FROM users ${whereClause}
      ORDER BY created_at DESC
    `).all(...params);

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id/role', authenticate, authorize('admin'), (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'author', 'reviewer', 'employee'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
    const updated = db.prepare('SELECT id, name, email, role, department, is_active, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated, message: 'User role updated successfully' });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/:id/status', authenticate, authorize('admin'), (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot change your own status' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id, is_active FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newStatus = user.is_active ? 0 : 1;
    db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(newStatus, req.params.id);
    const updated = db.prepare('SELECT id, name, email, role, department, is_active, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated, message: `User ${newStatus ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const db = getDb();
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
