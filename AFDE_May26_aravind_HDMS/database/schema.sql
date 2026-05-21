-- Helpdesk Ticket Management System — SQLite Schema
-- Run: sqlite3 helpdesk.db < schema.sql

CREATE TABLE IF NOT EXISTS tickets (
    ticket_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name    VARCHAR(100) NOT NULL,
    department       VARCHAR(100) NOT NULL,
    issue_category   VARCHAR(100) NOT NULL,
    description      TEXT        NOT NULL,
    priority         VARCHAR(50) NOT NULL DEFAULT 'Medium',
    status           VARCHAR(50) NOT NULL DEFAULT 'Open',
    resolution_notes TEXT,
    created_at       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME
);

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_tickets_status    ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority  ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_category  ON tickets(issue_category);
CREATE INDEX IF NOT EXISTS idx_tickets_created   ON tickets(created_at DESC);

-- Sample data
INSERT INTO tickets (employee_name, department, issue_category, description, priority, status)
VALUES
  ('John Smith',   'IT',        'VPN Issue',           'Cannot connect to VPN from home. Getting "authentication failed" error since yesterday.', 'High',     'Open'),
  ('Sarah Connor', 'HR',        'Password Reset',      'Locked out of my account after too many failed login attempts. Need urgent reset.',        'Critical', 'In Progress'),
  ('Mike Johnson', 'Finance',   'Software Installation','Need Microsoft Office 365 installed on new laptop received last week.',                   'Medium',   'Open'),
  ('Emily Davis',  'Marketing', 'Email Access',        'Cannot send or receive emails since this morning. Outlook shows connection error.',        'High',     'Resolved'),
  ('Tom Wilson',   'Sales',     'Laptop Issue',        'Laptop running extremely slow, takes 10 minutes to boot. Might need RAM upgrade.',         'Low',      'Closed');
