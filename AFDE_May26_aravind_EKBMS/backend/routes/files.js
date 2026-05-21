const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const allowedTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/upload/:articleId', authenticate, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit' });
      }
      return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const db = getDb();
      const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.articleId);
      if (!article) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, message: 'Article not found' });
      }

      if (req.user.role !== 'admin' && article.author_id !== req.user.id) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const id = uuidv4();
      db.prepare(
        'INSERT INTO attachments (id, article_id, filename, original_name, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, req.params.articleId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size);

      const attachment = db.prepare('SELECT * FROM attachments WHERE id = ?').get(id);
      res.status(201).json({ success: true, data: attachment, message: 'File uploaded successfully' });
    } catch (err2) {
      console.error('File upload error:', err2);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
});

router.get('/:articleId', (req, res) => {
  try {
    const db = getDb();
    const attachments = db.prepare('SELECT * FROM attachments WHERE article_id = ? ORDER BY uploaded_at DESC').all(req.params.articleId);
    res.json({ success: true, data: attachments });
  } catch (err) {
    console.error('Get files error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const attachment = db.prepare(`
      SELECT att.*, a.author_id
      FROM attachments att
      JOIN articles a ON att.article_id = a.id
      WHERE att.id = ?
    `).get(req.params.id);

    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    if (req.user.role !== 'admin' && attachment.author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const filePath = path.join(uploadsDir, attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (err) {
    console.error('Delete file error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
