# Enterprise Knowledge Base Management System (EKBMS)

**AFDE_May26_aravind_EKBMS** — Phase 1 + Phase 2 Capstone Project

A centralized web-based platform to help organizations create, manage, organize, and distribute knowledge resources across departments and teams — now extended with an ETL pipeline for bulk article imports and enhanced analytics.

---

## Features

### Phase 1 — Core Knowledge Base
- **Authentication & Authorization** — JWT-based login, registration, role-based access (Admin, Author, Reviewer, Employee)
- **Knowledge Article Management** — Full CRUD, draft/publish workflow, rich content, article lifecycle (Draft → Pending → Approved/Rejected)
- **Approval Workflow** — Submit for review, approve/reject with comments, approval history
- **Category & Tag Management** — Hierarchical categories, multi-tag support
- **Advanced Search** — Full-text search with filters (category, tag, author, sort)
- **File Management** — Upload/download attachments (PDF, DOC, PPT, XLS, PNG, JPG)
- **Collaboration** — Comments, star ratings, bookmarks
- **Dashboard & Analytics** — Stats, most viewed articles, category charts, search trends
- **User Management** — Admin user CRUD, role and status management
- **Notifications** — In-app notifications for approvals and rejections

### Phase 2 — ETL Pipeline & Enhanced Analytics
- **CSV/JSON Dataset Import** — Python ETL pipeline with explicit Extract → Transform → Load stages
- **In-app ETL Trigger** — Run the pipeline directly from the Admin dashboard without touching the CLI
- **ETL Run History** — Full audit trail: source file, record counts (extracted / transformed / loaded), status, duration, and error messages
- **Author Activity Analytics** — Per-author leaderboard with article counts, total views, approval rates, and average ratings
- **Enhanced Reports Page** — Tabbed layout: Overview (all Phase 1 charts) + Author Activity tab
- **102 Pre-built Knowledge Articles** in `datasets/knowledge_articles.csv` ready to import

---

## Technology Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Recharts, Lucide |
| Backend  | Node.js, Express.js, sql.js (SQLite — pure JavaScript) |
| ETL      | Python 3, Pandas |
| Auth     | JWT (jsonwebtoken), bcryptjs |
| Charts   | Recharts |
| Toasts   | React Hot Toast |
| File Upload | Multer |

---

## Prerequisites

- Node.js v16+ (tested on v24)
- npm v8+
- Python 3.9+ with pip *(only required for the offline Python ETL)*

---

## Setup Instructions

### 1. Clone / Download the project

```bash
cd AFDE_May26_aravind_EKBMS
```

### 2. Backend Setup

```bash
cd backend
npm install
npm start
```

Backend runs on **http://localhost:3001**

The database (`database.sqlite`) is created automatically on first run with seed data.

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## ETL Pipeline (Phase 2)

### Workflow

```
datasets/knowledge_articles.csv  (or .json)
          │
          ▼
    [EXTRACT]   — reads file using pandas (CSV or JSON)
          │
          ▼
    [TRANSFORM] — strips whitespace · normalises categories & tags
                  validates required fields · removes title duplicates
                  generates content from title+summary if absent
          │
          ▼
    [LOAD]      — inserts articles + tags into SQLite
                  records run audit in etl_runs table
```

### Option A — In-app trigger (recommended, no CLI needed)

1. Start the backend and frontend (see Setup above)
2. Log in as **admin**
3. Click **ETL Management** in the left sidebar
4. Click **Run ETL Import**
5. The pipeline processes `datasets/knowledge_articles.csv` and loads it live — no restart required

### Option B — Offline Python ETL

Run this when the Node.js server is **stopped** (Python writes directly to `backend/database.sqlite`):

```bash
cd etl
pip install -r requirements.txt
python etl_pipeline.py                     # default: knowledge_articles.csv
python etl_pipeline.py my_articles.json   # custom JSON file
```

Restart the backend after running so sql.js picks up the updated database file.

### Dataset Format

Place CSV or JSON files inside the `datasets/` folder.

**Required CSV columns:**

| Column         | Required | Notes |
|----------------|----------|-------|
| `title`        | ✅        | Must be unique across the database |
| `summary`      |           | Short description |
| `category`     | ✅        | Case-insensitive match against DB categories |
| `tags`         |           | Comma-separated inside quotes: `"policy,security"` |
| `views`        |           | Integer (defaults to 0) |
| `author_email` |           | Must match an existing user (defaults to `author@ekbms.com`) |
| `status`       |           | `approved` · `draft` · `pending_approval` · `rejected` · `archived` |
| `created_date` |           | ISO date, e.g. `2024-03-15` |

**Supported categories:** `HR Policies` · `IT Support` · `Infrastructure` · `Training Materials` · `Finance` · `Operations`

---

## Default Login Credentials

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@ekbms.com        | admin123    |
| Author   | author@ekbms.com       | author123   |
| Reviewer | reviewer@ekbms.com     | reviewer123 |
| Employee | employee@ekbms.com     | employee123 |

> Quick-login buttons are available on the login page.

---

## Project Structure

```
AFDE_May26_aravind_EKBMS/
├── datasets/                       # ← Phase 2
│   └── knowledge_articles.csv      # 102 pre-built articles
│
├── etl/                            # ← Phase 2 Python ETL
│   ├── extract.py                  # Stage 1: read CSV/JSON
│   ├── transform.py                # Stage 2: clean & normalise
│   ├── load.py                     # Stage 3: write to SQLite
│   ├── etl_pipeline.py             # Orchestrator (CLI entry point)
│   └── requirements.txt            # pandas
│
├── frontend/                       # React + Vite SPA
│   └── src/
│       ├── components/             # Layout, Sidebar, Navbar, etc.
│       ├── pages/
│       │   ├── ETLManagement.jsx   # ← Phase 2: ETL dashboard
│       │   ├── Reports.jsx         # Enhanced: Overview + Author Activity tabs
│       │   └── ...                 # all other pages unchanged
│       └── services/api.js         # etlAPI + analyticsAPI.getAuthorActivity
│
├── backend/                        # Node.js + Express API
│   ├── config/database.js          # SQLite init (now includes etl_runs table)
│   ├── middleware/auth.js          # JWT middleware
│   ├── routes/
│   │   ├── analytics.js            # + GET /author-activity  ← Phase 2
│   │   ├── etl.js                  # ← Phase 2: trigger + history
│   │   └── ...                     # all other routes unchanged
│   ├── uploads/
│   └── package.json
│
├── database/
│   └── schema.sql
└── README.md
```

---

## API Overview

| Module         | Base Path              | Notes |
|----------------|------------------------|-------|
| Authentication | `/api/auth`            | |
| Articles       | `/api/articles`        | |
| Categories     | `/api/categories`      | |
| Tags           | `/api/tags`            | |
| Search         | `/api/search`          | |
| Comments       | `/api/comments`        | |
| Files          | `/api/files`           | |
| Approvals      | `/api/approvals`       | |
| Users          | `/api/users`           | |
| Analytics      | `/api/analytics`       | Includes `GET /author-activity` *(Phase 2)* |
| Notifications  | `/api/notifications`   | |
| ETL            | `/api/etl`             | `POST /trigger` · `GET /runs` *(Phase 2, admin only)* |

---

## UI Screens

| Screen           | Path              | Access |
|------------------|-------------------|--------|
| Login            | `/login`          | Public |
| Register         | `/register`       | Public |
| Dashboard        | `/dashboard`      | All roles |
| Articles         | `/articles`       | All roles |
| Article Detail   | `/articles/:id`   | All roles |
| Create Article   | `/articles/create`| Author, Admin |
| Edit Article     | `/articles/:id/edit` | Author, Admin |
| Categories       | `/categories`     | All roles |
| Search           | `/search`         | All roles |
| Approval Queue   | `/approvals`      | Reviewer, Admin |
| User Management  | `/users`          | Admin |
| Reports          | `/reports`        | Admin |
| ETL Management   | `/etl`            | Admin *(Phase 2)* |
| Profile          | `/profile`        | All roles |

---

## Screenshots

> Add screenshots to the `/screenshots` folder.

Recommended screenshots:
- Login page
- Dashboard
- Articles list
- Article detail
- Create article form
- Approval queue
- Search results
- Reports — Overview tab
- Reports — Author Activity tab *(Phase 2)*
- ETL Management — Run History *(Phase 2)*
- ETL pipeline execution output *(Phase 2)*

---

## Evaluation Criteria Coverage

| Criteria                         | Phase 1 | Phase 2 |
|----------------------------------|---------|---------|
| Frontend Development             | ✅ React + Tailwind responsive UI | ✅ ETL Management page, Author Activity tab |
| Backend API Development          | ✅ RESTful Express APIs | ✅ ETL trigger + history + author-activity APIs |
| Database Integration             | ✅ SQLite with full schema | ✅ etl_runs audit table |
| CRUD Functionality               | ✅ All entities | ✅ ETL run records |
| Search / Filtering               | ✅ Full-text + filters | ✅ Enhanced analytics |
| ETL with Pandas                  | —       | ✅ extract.py · transform.py · load.py |
| CSV/JSON Dataset Input           | —       | ✅ 102-article dataset |
| ETL Audit Trail                  | —       | ✅ etl_runs table + dashboard |
| Analytics from ETL Output        | —       | ✅ Author Activity leaderboard |
| Code Quality & Structure         | ✅ Modular, layered | ✅ Same conventions extended |
| Documentation                    | ✅ README | ✅ ETL workflow documented |

---

## License

Capstone Project — AFDE Batch May 2026
