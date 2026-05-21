# AFDE_May26_aravind_CCRTS
## Customer Complaint & Resolution Tracking System

A full-stack enterprise web application for managing, monitoring, and resolving customer complaints with role-based access control, SLA tracking, real-time analytics, and an ETL-powered analytics pipeline.

---

## Project Overview

The CCRTS centralizes complaint handling operations, enabling organizations to:
- Register and track complaints with auto-generated IDs
- Assign complaints to support agents
- Monitor SLA deadlines with auto-breach detection
- Escalate unresolved complaints
- Analyze trends via dashboards and reports
- **[Phase 2]** Run ETL pipelines to import bulk complaint datasets and generate advanced analytics

---

## Phase 2 – ETL Pipeline & Analytics

### Overview

Phase 2 extends the platform with a full **Extract → Transform → Load (ETL)** pipeline built with **Python + Pandas**. It reads complaint data from a CSV dataset, applies data cleaning and enrichment transformations, and loads the results into dedicated analytics tables in the database. A new **ETL Analytics Dashboard** in the frontend displays all generated insights.

---

### ETL Workflow

```
datasets/complaints_dataset.csv
            │
            ▼
    ┌───────────────┐
    │   EXTRACT     │  Read CSV / Excel using pandas.read_csv / read_excel
    │               │  Validate file existence and column structure
    └──────┬────────┘
           │  raw DataFrame (210 records)
           ▼
    ┌───────────────┐
    │  TRANSFORM    │  1. Normalise priority / status (lowercase, strip)
    │               │  2. Parse created_at and resolved_at as datetime
    │               │  3. Map SLA hour limits per priority
    │               │     critical=4h · high=24h · medium=48h · low=72h
    │               │  4. Calculate resolution_time_hours
    │               │  5. Derive is_sla_breached flag
    │               │  6. Validate customer_rating (1–5 range)
    │               │  7. Aggregate 4 analytics DataFrames:
    │               │     · SLA analytics (category × priority)
    │               │     · Category analytics (KPIs per category)
    │               │     · Agent performance analytics
    │               │     · Monthly resolution trend analytics
    └──────┬────────┘
           │  5 cleaned DataFrames
           ▼
    ┌───────────────┐
    │    LOAD       │  Write to SQLite via pandas.to_sql (if_exists='replace')
    │               │  Tables: complaint_analytics, sla_analytics,
    │               │          category_analytics,
    │               │          agent_performance_analytics,
    │               │          resolution_trend_analytics
    │               │  Log run metadata → etl_run_log table
    └───────────────┘
```

### Running the ETL Pipeline

**Option 1 – Command line (recommended for first run):**
```bash
# Install ETL dependencies
pip install pandas openpyxl

# Run from project root (after starting the backend at least once to init the DB)
python etl/etl_pipeline.py

# Custom paths
python etl/etl_pipeline.py --dataset datasets/complaints_dataset.csv --db backend/ccrts.db
```

**Option 2 – From the frontend** (Admin / Supervisor role):
1. Log in as `admin@ccrts.com` or `supervisor@ccrts.com`
2. Click **ETL Analytics** in the sidebar
3. Click **Run ETL Pipeline** button

---

### Dataset

| Property | Value |
|----------|-------|
| File | `datasets/complaints_dataset.csv` |
| Records | 210 complaint records |
| Date range | Jan 2024 – Apr 2025 (16 months) |
| Generator | `datasets/generate_dataset.py` |

**Dataset columns:**

| Column | Description |
|--------|-------------|
| complaint_id | Unique numeric ID |
| complaint_number | Formatted ID (CMP-2024-XXXXX) |
| customer_name / email | Customer details |
| category | Billing Issues, Service Disruption, Product Defects, Technical Problems, Delivery Delays, Account Issues, Customer Service |
| priority | low / medium / high / critical |
| status | open / assigned / in_progress / escalated / resolved / closed |
| title / description | Complaint text |
| created_at | Submission timestamp |
| resolved_at | Resolution timestamp (blank if unresolved) |
| assigned_agent | Assigned support agent name |
| customer_rating | 1–5 star post-resolution rating |
| region | North / South / East / West / Central |

To regenerate the dataset:
```bash
python datasets/generate_dataset.py
```

---

### Analytics Tables (ETL Output)

| Table | Description |
|-------|-------------|
| `etl_run_log` | ETL execution history (status, record counts, duration) |
| `complaint_analytics` | Cleaned per-complaint records with derived SLA fields |
| `sla_analytics` | SLA breach counts grouped by category and priority |
| `category_analytics` | Per-category KPIs (totals, resolution rate, avg rating) |
| `agent_performance_analytics` | Per-agent resolution rate, SLA compliance, avg rating |
| `resolution_trend_analytics` | Monthly complaint volume and resolution trends |

---

### Analytics APIs (Phase 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/etl-status` | Last ETL run status and record count |
| GET | `/api/analytics/sla-breaches` | SLA breach breakdown by priority and category |
| GET | `/api/analytics/category-analysis` | Per-category complaint KPIs |
| GET | `/api/analytics/agent-performance` | Per-agent performance metrics |
| GET | `/api/analytics/resolution-trends` | Monthly resolution trend data |
| POST | `/api/analytics/run-etl` | Trigger ETL pipeline (admin/supervisor only) |

---

### ETL Analytics Dashboard

Accessible at `/etl-analytics` (Admin, Supervisor, Quality Team roles).

**Dashboard sections:**
- **ETL Status Card** — Last run time, status, records loaded, duration
- **KPI Row** — Total records, SLA breaches, SLA compliant count, avg resolution rate
- **SLA Breach by Priority** — Stacked bar chart (compliant vs. breached per priority)
- **Complaints by Category** — Pie chart distribution
- **Monthly Resolution Trends** — Line chart (Total / Resolved / SLA Breaches per month)
- **SLA Breach Rate by Category** — Horizontal bar chart
- **Agent Performance Table** — Assigned, resolved, resolution rate, rating per agent
- **Category Analytics Summary** — Full KPI table per category

---

## Phase 1 Features

- **User Authentication** — JWT-based login/register with role-based access
- **Role Management** — Admin, Supervisor, Support Agent, Customer, Quality Team
- **Complaint Registration** — Auto-generated complaint numbers, category, priority
- **Complaint Workflow** — Status transitions: Open → Assigned → In Progress → Resolved → Closed
- **SLA Tracking** — Auto-calculated deadlines per priority (Critical: 4h, High: 24h, Medium: 48h, Low: 72h)
- **Escalation Management** — Escalate complaints with reason, supervisor dashboard
- **Activity Timeline** — Full audit trail of all status changes and comments
- **Dashboard Analytics** — Charts for status, priority, and category breakdowns
- **Notification System** — In-app notifications for assignment and status updates
- **Feedback System** — Customer satisfaction ratings post-resolution
- **User Management** — Admin panel to manage users and roles
- **Search & Filtering** — Filter by status, priority, keyword search

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v7 |
| Charts | Recharts |
| HTTP Client | Axios |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Backend | FastAPI (Python 3.10+) |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite |
| Authentication | JWT (python-jose), bcrypt (passlib) |
| **ETL** | **Python, Pandas, csv (stdlib)** |
| API Docs | Swagger UI (auto-generated) |

---

## Project Structure

```
AFDE_May26_aravind_CCRTS/
├── datasets/
│   ├── complaints_dataset.csv      # 210-record complaint dataset (ETL input)
│   └── generate_dataset.py         # Dataset generation script
├── etl/
│   ├── etl_pipeline.py             # Main ETL script (Extract→Transform→Load)
│   ├── requirements.txt            # ETL dependencies (pandas, openpyxl)
│   └── etl.log                     # ETL execution log (auto-generated)
├── frontend/
│   └── src/
│       ├── components/             # Reusable UI components (Sidebar, Layout…)
│       ├── pages/
│       │   ├── ETLDashboard.jsx    # [Phase 2] ETL analytics dashboard
│       │   └── …                   # All Phase 1 pages
│       ├── context/                # React context (AuthContext)
│       └── services/               # Axios API service
├── backend/
│   └── app/
│       ├── routes/
│       │   ├── analytics.py        # [Phase 2] Analytics & ETL API endpoints
│       │   └── …                   # Phase 1 routes
│       ├── models.py               # SQLAlchemy ORM (Phase 1 + 6 ETL tables)
│       ├── schemas.py              # Pydantic schemas (Phase 1 + analytics)
│       ├── auth.py                 # JWT authentication
│       ├── seed.py                 # Demo data seeder
│       └── main.py                 # FastAPI app entry point
├── database/
│   └── schema.sql                  # SQL schema reference
├── screenshots/                    # UI screenshots
├── start-all.bat                   # One-click startup script
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Quick Start (Windows)
```bash
# Double-click start-all.bat OR run from terminal:
start-all.bat
```
This launches both backend (port 8000) and frontend (port 5173).

### Backend Setup (Manual)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup (Manual)
```bash
cd frontend
npm install
npm run dev
```

### ETL Setup
```bash
# Install ETL dependencies (one-time)
pip install pandas openpyxl

# Run the ETL pipeline (backend must be started first to initialise the DB)
python etl/etl_pipeline.py
```

### Access
- **Frontend App**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs
- **ETL Analytics Dashboard**: http://localhost:5173/etl-analytics *(admin/supervisor login required)*

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ccrts.com | admin123 |
| Supervisor | supervisor@ccrts.com | super123 |
| Support Agent | agent1@ccrts.com | agent123 |
| Support Agent | agent2@ccrts.com | agent123 |
| Customer | customer@ccrts.com | cust123 |
| Customer | alice@ccrts.com | cust123 |

---

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user profile |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/complaints` | List complaints (filtered) |
| POST | `/api/complaints` | Create new complaint |
| GET | `/api/complaints/{id}` | Get complaint details |
| PUT | `/api/complaints/{id}` | Update complaint |
| POST | `/api/complaints/{id}/assign` | Assign to agent |
| POST | `/api/complaints/{id}/escalate` | Escalate complaint |
| POST | `/api/complaints/{id}/status` | Update status with comment |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/agents` | List active agents |
| PUT | `/api/users/{id}` | Update user role/status |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get analytics summary |

### Analytics (Phase 2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/etl-status` | Last ETL run details |
| GET | `/api/analytics/sla-breaches` | SLA breach analytics |
| GET | `/api/analytics/category-analysis` | Category-level KPIs |
| GET | `/api/analytics/agent-performance` | Agent performance metrics |
| GET | `/api/analytics/resolution-trends` | Monthly trends |
| POST | `/api/analytics/run-etl` | Trigger ETL pipeline |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List complaint categories |
| POST | `/api/feedback/{complaint_id}` | Submit feedback |
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/{id}/read` | Mark notification read |
| PUT | `/api/notifications/read-all` | Mark all read |

---

## Database Schema

See `database/schema.sql` for the full Phase 1 schema. Phase 2 adds:

| Table | Purpose |
|-------|---------|
| `etl_run_log` | ETL pipeline execution history |
| `complaint_analytics` | ETL-processed complaint records |
| `sla_analytics` | SLA breach data by category/priority |
| `category_analytics` | Category KPI aggregations |
| `agent_performance_analytics` | Per-agent performance data |
| `resolution_trend_analytics` | Monthly trend aggregations |

---

## Evaluation Criteria Coverage

| Criteria | Status |
|----------|--------|
| Frontend Development | ✅ React + Tailwind, responsive design |
| Backend API Development | ✅ FastAPI REST APIs with proper HTTP methods |
| Database Integration | ✅ SQLAlchemy ORM + SQLite |
| CRUD Functionality | ✅ Full CRUD for complaints and users |
| Search/Filtering Features | ✅ Status, priority, keyword search |
| **ETL Pipeline** | ✅ Python + Pandas, CSV input, 3-stage pipeline |
| **Dataset (200+ records)** | ✅ 210 records in datasets/complaints_dataset.csv |
| **ETL Stages (E→T→L)** | ✅ Extract, Transform (SLA calc, normalization), Load |
| **Analytics Tables** | ✅ 6 reporting tables populated by ETL |
| **Analytics Dashboard** | ✅ SLA, category, trend, agent charts |
| **Updated APIs** | ✅ 6 new /api/analytics/* endpoints |
| Code Quality & Structure | ✅ Modular architecture, layered design |
| Documentation | ✅ README with ETL workflow, API docs, schema |

---

## Author
**Aravind G** | Batch: AFDE_May26 | Project: CCRTS
