const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
let sqlDb = null;

function saveToFile() {
  if (sqlDb) {
    const data = sqlDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

// Compatibility wrapper that mimics the better-sqlite3 synchronous API
const dbWrapper = {
  pragma() {},

  exec(sql) {
    sqlDb.exec(sql);
    saveToFile();
  },

  prepare(sql) {
    return {
      run(...args) {
        const stmt = sqlDb.prepare(sql);
        stmt.run(args.length > 0 ? args : []);
        stmt.free();
        saveToFile();
        return { changes: sqlDb.getRowsModified() };
      },
      get(...args) {
        const stmt = sqlDb.prepare(sql);
        if (args.length > 0) stmt.bind(args);
        let row;
        if (stmt.step()) {
          row = stmt.getAsObject();
        }
        stmt.free();
        return row;
      },
      all(...args) {
        const stmt = sqlDb.prepare(sql);
        if (args.length > 0) stmt.bind(args);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
      }
    };
  }
};

function getDb() {
  return dbWrapper;
}

async function initializeDatabase() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  createTables();

  const result = dbWrapper.prepare('SELECT COUNT(*) as count FROM users').get();
  if (!result || result.count === 0) {
    seedDatabase();
  }

  console.log('Database initialized successfully');
}

function createTables() {
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee' CHECK(role IN ('admin','author','reviewer','employee')),
      department TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parent_id TEXT,
      color TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT NOT NULL DEFAULT 'Folder',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      category_id TEXT,
      author_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_approval','approved','rejected','archived')),
      view_count INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      rejection_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS article_tags (
      article_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (article_id, tag_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(article_id, user_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(article_id, user_id),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS approval_history (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('approved','rejected')),
      comments TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS search_logs (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      user_id TEXT,
      results_count INTEGER NOT NULL DEFAULT 0,
      searched_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      is_read INTEGER NOT NULL DEFAULT 0,
      article_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
    );
  `);
  saveToFile();
}

function seedDatabase() {
  const adminId = uuidv4();
  const authorId = uuidv4();
  const reviewerId = uuidv4();
  const employeeId = uuidv4();

  const adminPass = bcrypt.hashSync('admin123', 10);
  const authorPass = bcrypt.hashSync('author123', 10);
  const reviewerPass = bcrypt.hashSync('reviewer123', 10);
  const employeePass = bcrypt.hashSync('employee123', 10);

  const insertUser = dbWrapper.prepare(
    'INSERT INTO users (id, name, email, password, role, department) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertUser.run(adminId, 'Admin User', 'admin@ekbms.com', adminPass, 'admin', 'IT');
  insertUser.run(authorId, 'John Author', 'author@ekbms.com', authorPass, 'author', 'Engineering');
  insertUser.run(reviewerId, 'Jane Reviewer', 'reviewer@ekbms.com', reviewerPass, 'reviewer', 'Quality');
  insertUser.run(employeeId, 'Bob Employee', 'employee@ekbms.com', employeePass, 'employee', 'Operations');

  const catHrId = uuidv4();
  const catItId = uuidv4();
  const catInfraId = uuidv4();
  const catTrainId = uuidv4();
  const catFinId = uuidv4();
  const catOpsId = uuidv4();

  const insertCat = dbWrapper.prepare(
    'INSERT INTO categories (id, name, description, color, icon) VALUES (?, ?, ?, ?, ?)'
  );
  insertCat.run(catHrId, 'HR Policies', 'Human Resources policies and procedures', '#f59e0b', 'Users');
  insertCat.run(catItId, 'IT Support', 'IT help desk and support documentation', '#6366f1', 'Monitor');
  insertCat.run(catInfraId, 'Infrastructure', 'Network and infrastructure guides', '#10b981', 'Server');
  insertCat.run(catTrainId, 'Training Materials', 'Employee training and onboarding', '#3b82f6', 'BookOpen');
  insertCat.run(catFinId, 'Finance', 'Financial procedures and guidelines', '#8b5cf6', 'DollarSign');
  insertCat.run(catOpsId, 'Operations', 'Operational procedures and workflows', '#ef4444', 'Settings');

  const tagNames = ['policy', 'technical', 'onboarding', 'security', 'network', 'finance', 'training', 'process'];
  const tagIds = {};
  const insertTag = dbWrapper.prepare('INSERT INTO tags (id, name) VALUES (?, ?)');
  tagNames.forEach(name => {
    const id = uuidv4();
    tagIds[name] = id;
    insertTag.run(id, name);
  });

  const articles = [
    {
      id: uuidv4(),
      title: 'Employee Onboarding Guide 2024',
      content: `# Employee Onboarding Guide 2024\n\nWelcome to our organization! This comprehensive guide will help you get started with everything you need to know as a new employee.\n\n## Week 1: Getting Started\n\n### Day 1 - Orientation\n- Meet your team and manager\n- Set up your workstation and accounts\n- Review company policies and culture\n- Complete mandatory compliance training\n\n### Day 2-3 - System Setup\n- Configure email and collaboration tools\n- Get access to required systems\n- Review your job description and goals\n\n## Key Resources\n\n- **HR Portal**: Access all HR-related forms and policies\n- **IT Help Desk**: Contact for technical support\n- **Benefits Portal**: Manage your benefits enrollment\n\n## First 90 Days Goals\n\n1. Complete all mandatory training by Day 30\n2. Establish relationships with key team members by Day 45\n3. Take ownership of first project by Day 60\n4. Present initial contributions in team meeting by Day 90`,
      summary: 'Comprehensive guide for new employees covering the first 90 days, system setup, key contacts, and integration milestones.',
      category_id: catTrainId,
      author_id: authorId,
      status: 'approved',
      view_count: 245,
      is_featured: 1,
      tags: ['onboarding', 'training', 'process']
    },
    {
      id: uuidv4(),
      title: 'IT Security Policy and Best Practices',
      content: `# IT Security Policy and Best Practices\n\n## Overview\n\nThis document outlines our organization's IT security policies that all employees must follow.\n\n## Password Requirements\n\n- Minimum 12 characters\n- Must include uppercase, lowercase, numbers, and special characters\n- Change every 90 days\n- Never reuse last 10 passwords\n\n## Multi-Factor Authentication\n\nMFA is mandatory for:\n- Email and collaboration tools\n- VPN access\n- Cloud services\n\n## Data Classification\n\n### Confidential\n- Customer personal information\n- Financial records\n- Intellectual property\n\n## Incident Response\n\nIf you suspect a security incident:\n1. Do not shut down your computer\n2. Disconnect from network if possible\n3. Call IT Security immediately: ext. 5555\n4. Document what you observed`,
      summary: 'Comprehensive IT security policy covering password requirements, MFA, data classification, and incident response procedures.',
      category_id: catItId,
      author_id: authorId,
      status: 'approved',
      view_count: 189,
      is_featured: 1,
      tags: ['security', 'policy', 'technical']
    },
    {
      id: uuidv4(),
      title: 'Network Infrastructure Overview',
      content: `# Network Infrastructure Overview\n\n## Architecture\n\nOur network infrastructure is designed for high availability, security, and performance.\n\n## Core Components\n\n### Data Center\n- Primary: Building A, Floor 2\n- Backup: Building C, Floor 1\n- Recovery Time Objective: 4 hours\n\n## IP Addressing\n\n| Segment | Network | Purpose |\n|---------|---------|----------|\n| Corporate | 10.0.0.0/8 | Internal users |\n| DMZ | 172.16.0.0/12 | Public-facing services |\n\n## VPN Configuration\n\n### Remote Access VPN\n- Protocol: IKEv2/IPSec\n- Authentication: Certificate + MFA\n- Connect at: vpn.company.com`,
      summary: 'Overview of company network infrastructure including topology, IP addressing, VPN configuration, and monitoring systems.',
      category_id: catInfraId,
      author_id: authorId,
      status: 'approved',
      view_count: 134,
      is_featured: 0,
      tags: ['network', 'technical', 'security']
    },
    {
      id: uuidv4(),
      title: 'Expense Reimbursement Policy',
      content: `# Expense Reimbursement Policy\n\n## Purpose\n\nThis policy outlines the procedures for submitting and receiving reimbursement for business expenses.\n\n## Eligible Expenses\n\n### Travel\n- Economy class flights for trips under 6 hours\n- Hotel accommodations up to $200/night\n- Rental car at economy rate\n\n### Meals\n- Breakfast: Up to $20\n- Lunch: Up to $30\n- Dinner: Up to $60\n\n## Submission Process\n\n1. Collect all receipts (required for expenses over $25)\n2. Submit within 30 days of expense\n3. Use Expense Report form in HR portal\n4. Get manager approval for amounts over $500`,
      summary: 'Policy for business expense reimbursement including eligible expenses, submission procedures, approval workflows, and payment timelines.',
      category_id: catFinId,
      author_id: authorId,
      status: 'approved',
      view_count: 98,
      is_featured: 0,
      tags: ['finance', 'policy', 'process']
    },
    {
      id: uuidv4(),
      title: 'Remote Work Guidelines',
      content: `# Remote Work Guidelines\n\n## Overview\n\nThis guide establishes expectations and best practices for employees working remotely.\n\n## Work Hours and Availability\n\n- Maintain regular business hours (9 AM - 5 PM local time)\n- Be available on messaging platforms during core hours\n- Respond to messages within 2 hours during business hours\n\n## Home Office Setup\n\n### Required Equipment\n- Reliable internet (minimum 25 Mbps)\n- Dedicated workspace\n- Webcam for video calls\n\n## Security Requirements\n\n1. Always use VPN when accessing company resources\n2. Secure your home WiFi network\n3. Never work from public WiFi without VPN`,
      summary: 'Guidelines for remote work including eligibility, work hours, home office setup requirements, and security requirements.',
      category_id: catHrId,
      author_id: authorId,
      status: 'pending_approval',
      view_count: 67,
      is_featured: 0,
      rejection_reason: null,
      tags: ['policy', 'process']
    },
    {
      id: uuidv4(),
      title: 'Software Development Lifecycle (SDLC) Process',
      content: `# Software Development Lifecycle Process\n\n## Overview\n\nThis document describes our standard SDLC process for all software development projects.\n\n## Phases\n\n### 1. Planning\n- Business requirements gathering\n- Feasibility assessment\n- Resource planning\n\n### 2. Development\n- Sprint planning (2-week sprints)\n- Daily standups\n- Code reviews (minimum 2 reviewers)\n- Unit testing (80% coverage minimum)\n\n### 3. Testing\n- Unit testing\n- Integration testing\n- User acceptance testing`,
      summary: 'Standard SDLC process covering all phases from planning through maintenance, including quality gates.',
      category_id: catItId,
      author_id: authorId,
      status: 'draft',
      view_count: 45,
      is_featured: 0,
      rejection_reason: null,
      tags: ['technical', 'process']
    },
    {
      id: uuidv4(),
      title: 'Annual Performance Review Process',
      content: `# Annual Performance Review Process\n\n## Overview\n\nThe annual performance review is a critical process for employee development.\n\n## Rating Scale\n\n1. **Exceptional (5)**: Significantly exceeds all expectations\n2. **Exceeds Expectations (4)**: Consistently exceeds expectations\n3. **Meets Expectations (3)**: Fully meets all expectations\n4. **Needs Improvement (2)**: Partially meets expectations\n5. **Unsatisfactory (1)**: Does not meet expectations\n\n## Outcome\n\nPerformance ratings affect:\n- Merit increase eligibility\n- Bonus calculations\n- Promotion consideration`,
      summary: 'Annual performance review process including timeline, rating scale, and how results affect compensation and development.',
      category_id: catHrId,
      author_id: authorId,
      status: 'approved',
      view_count: 156,
      is_featured: 0,
      rejection_reason: null,
      tags: ['policy', 'process', 'training']
    },
    {
      id: uuidv4(),
      title: 'Cloud Infrastructure Migration Guide',
      content: `# Cloud Infrastructure Migration Guide\n\n## Executive Summary\n\nThis guide provides a roadmap for migrating our on-premises infrastructure to AWS cloud services.\n\n## Migration Strategy: 6 R's\n\n1. **Rehost** (Lift and Shift)\n2. **Replatform**: Minor optimization during migration\n3. **Repurchase**: Switch to SaaS alternative\n4. **Refactor**: Re-architect for cloud-native\n\n## Key AWS Services\n\n| Current | AWS Service |\n|---------|-------------|\n| Physical servers | EC2 |\n| Storage | S3, EBS |\n| Database | RDS, DynamoDB |`,
      summary: 'Comprehensive guide for migrating on-premises infrastructure to AWS, covering migration strategies and key services.',
      category_id: catInfraId,
      author_id: authorId,
      status: 'rejected',
      view_count: 78,
      is_featured: 0,
      rejection_reason: 'Needs additional review from the cloud architecture team before publication.',
      tags: ['technical', 'network', 'security']
    }
  ];

  const insertArticle = dbWrapper.prepare(
    'INSERT INTO articles (id, title, content, summary, category_id, author_id, status, view_count, is_featured, rejection_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertArticleTag = dbWrapper.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)');
  const insertComment = dbWrapper.prepare('INSERT INTO comments (id, article_id, user_id, content) VALUES (?, ?, ?, ?)');
  const insertRating = dbWrapper.prepare('INSERT INTO ratings (id, article_id, user_id, rating) VALUES (?, ?, ?, ?)');
  const insertBookmark = dbWrapper.prepare('INSERT INTO bookmarks (id, article_id, user_id) VALUES (?, ?, ?)');
  const insertApproval = dbWrapper.prepare(
    'INSERT INTO approval_history (id, article_id, reviewer_id, action, comments) VALUES (?, ?, ?, ?, ?)'
  );
  const insertNotification = dbWrapper.prepare(
    'INSERT INTO notifications (id, user_id, message, type, article_id) VALUES (?, ?, ?, ?, ?)'
  );

  articles.forEach((article, index) => {
    insertArticle.run(
      article.id, article.title, article.content, article.summary,
      article.category_id, article.author_id, article.status,
      article.view_count, article.is_featured, article.rejection_reason || null
    );

    article.tags.forEach(tagName => {
      if (tagIds[tagName]) {
        insertArticleTag.run(article.id, tagIds[tagName]);
      }
    });

    if (article.status === 'approved' || article.status === 'rejected') {
      const sampleComments = [
        'Very helpful documentation! Clear and well-organized.',
        'This guide helped me understand the process much better.',
        'Excellent resource. Should be reviewed quarterly to stay current.'
      ];
      [adminId, employeeId, reviewerId].forEach((userId, i) => {
        insertComment.run(uuidv4(), article.id, userId, sampleComments[i]);
      });

      try { insertRating.run(uuidv4(), article.id, adminId, 5); } catch (e) {}
      try { insertRating.run(uuidv4(), article.id, employeeId, 4); } catch (e) {}
      try { insertRating.run(uuidv4(), article.id, reviewerId, 4); } catch (e) {}

      if (index % 2 === 0) {
        try { insertBookmark.run(uuidv4(), article.id, employeeId); } catch (e) {}
        try { insertBookmark.run(uuidv4(), article.id, adminId); } catch (e) {}
      }

      if (article.status === 'approved') {
        insertApproval.run(uuidv4(), article.id, reviewerId, 'approved', 'Well-written and accurate. Approved for publication.');
        insertNotification.run(uuidv4(), authorId, `Your article "${article.title}" has been approved.`, 'success', article.id);
      } else if (article.status === 'rejected') {
        insertApproval.run(uuidv4(), article.id, reviewerId, 'rejected', article.rejection_reason);
        insertNotification.run(uuidv4(), authorId, `Your article "${article.title}" was rejected.`, 'error', article.id);
      }
    } else if (article.status === 'pending_approval') {
      insertNotification.run(uuidv4(), reviewerId, `Article "${article.title}" awaits your review.`, 'info', article.id);
    }
  });

  const searchQueries = ['security policy', 'onboarding', 'expense', 'remote work', 'IT support', 'network', 'training'];
  const insertSearch = dbWrapper.prepare('INSERT INTO search_logs (id, query, user_id, results_count) VALUES (?, ?, ?, ?)');
  searchQueries.forEach(q => {
    insertSearch.run(uuidv4(), q, employeeId, Math.floor(Math.random() * 10) + 1);
    insertSearch.run(uuidv4(), q, adminId, Math.floor(Math.random() * 10) + 1);
  });

  console.log('Database seeded successfully');
}

module.exports = { getDb, initializeDatabase };
