# Feedback Management System (FMS)

A centralized web-based system to collect, manage, search, and analyze feedback from participants, employees, or customers — extended in Phase 2 with a full ETL pipeline for CSV/Excel imports.

## Tech Stack

| Layer    | Technology           |
|----------|----------------------|
| Frontend | React 18 (CDN/SPA)   |
| Backend  | Python FastAPI       |
| Database | SQLite               |
| ETL      | Python + Pandas      |
| API Test | Postman / Swagger UI |

---

## Features

### Phase 1 — Core Feedback Management
- Submit feedback with participant name, program, rating (1–5), and comments
- View all feedback in a searchable, filterable table
- Dashboard showing total count, average rating, and recent submissions
- Full CRUD: Create, Read, Update, Delete feedback
- Search by keyword, rating, or program/event name
- Responsive UI — works on desktop and mobile

### Phase 2 — ETL Pipeline & Analytics
- Upload CSV or Excel files to import bulk feedback data
- **Extract** — reads `.csv`, `.xlsx`, `.xls` files with flexible column name mapping
- **Transform** — validates ratings (1–5), removes within-file duplicates, standardizes text (title case names, trim whitespace), drops rows with missing required fields
- **Load** — inserts cleaned records into the feedback table; computes per-program analytics stored in a reporting table
- ETL job history with status, record counts, and timestamps
- Analytics dashboard: overall stats + per-program rating breakdown with visual bars
- Downloadable analytics report (CSV)
- Sample dataset with 130+ rows (includes intentional dirty data to demonstrate cleaning)

---

## Project Structure

```
AFDE_May26_aravind_FMS/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy engine & session
│   ├── models.py            # ORM models (Feedback, ETLJob, FeedbackAnalytics)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── crud.py              # Database operations (Phase 1)
│   ├── etl_service.py       # ETL Extract / Transform / Load logic
│   ├── routers/
│   │   ├── feedback.py      # Feedback CRUD routes
│   │   └── etl.py           # ETL pipeline & analytics routes
│   └── requirements.txt
├── datasets/
│   └── feedback_sample.csv  # 130-row sample dataset (use for ETL import)
├── frontend/
│   ├── index.html           # Single-page app entry
│   ├── style.css            # All styles
│   └── src/
│       └── App.js           # React components (runs via Babel CDN)
├── database/
│   └── schema.sql           # SQL schema reference
├── screenshots/
├── README.md
└── requirements.txt
```

---

## Setup & Installation

### Prerequisites
- Python 3.9+

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The API will be available at: `http://127.0.0.1:8000`  
Interactive docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

No build step required. Open `frontend/index.html` directly in a browser, or serve it:

```bash
cd frontend
python -m http.server 3000
# Then open http://localhost:3000
```

---

## ETL Workflow

```
datasets/feedback_sample.csv
        │
        ▼  EXTRACT
   Read CSV/Excel into DataFrame
        │
        ▼  TRANSFORM
   • Flexible column mapping (aliases supported)
   • Strip whitespace / title-case participant names
   • Validate ratings: must be integer 1–5
   • Remove within-file duplicates (same name + program + rating)
   • Drop rows with missing participant_name or program_name
        │
        ▼  LOAD
   • Insert cleaned records → feedback table
   • Compute per-program stats → feedback_analytics table
   • Record job metadata → etl_jobs table
        │
        ▼
   Analytics APIs + Downloadable Report
```

### Supported Column Names

The ETL service accepts common column name variants:

| Canonical Field    | Accepted Aliases |
|--------------------|-----------------|
| participant_name   | participant, name, attendee, student, employee |
| program_name       | program, event, course, training, workshop |
| rating             | score, stars, grade, feedback_score |
| comments           | comment, feedback, notes, review |
| submitted_date     | date, submitted_at, submission_date |

---

## API Endpoints

### Phase 1 — Feedback CRUD

| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | /feedback           | List all feedback        |
| GET    | /feedback/{id}      | Get feedback by ID       |
| POST   | /feedback           | Submit new feedback      |
| PUT    | /feedback/{id}      | Update existing feedback |
| DELETE | /feedback/{id}      | Delete feedback          |
| GET    | /feedback/stats     | Dashboard stats          |
| GET    | /search             | Search & filter          |

### Phase 2 — ETL & Analytics

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| POST   | /etl/upload                 | Upload CSV/Excel and run ETL         |
| GET    | /etl/jobs                   | List all ETL job history             |
| GET    | /etl/jobs/{id}              | Get specific ETL job details         |
| GET    | /etl/analytics              | Overall analytics summary            |
| GET    | /etl/analytics/by-program   | Per-program analytics breakdown      |
| GET    | /etl/report/download        | Download analytics as CSV            |

### Example: Run ETL via API

```bash
curl -X POST http://127.0.0.1:8000/etl/upload \
  -F "file=@datasets/feedback_sample.csv"
```

**Response 201:**
```json
{
  "job_id": 1,
  "filename": "feedback_sample.csv",
  "status": "completed",
  "total_records": 135,
  "valid_records": 115,
  "duplicate_records": 10,
  "invalid_records": 10,
  "loaded_records": 115,
  "completed_at": "2026-05-22T10:30:00"
}
```

---

## Rating Scale

| Rating | Label     |
|--------|-----------|
| 1      | Poor      |
| 2      | Fair      |
| 3      | Good      |
| 4      | Very Good |
| 5      | Excellent |

---

## Database

SQLite database file `feedback.db` is auto-created inside `backend/` on first run.

**Tables:**
- `feedback` — all submitted and ETL-imported feedback records
- `etl_jobs` — ETL pipeline execution history (status, record counts, timestamps)
- `feedback_analytics` — per-program analytics computed from each ETL run

---

## Sample Dataset

`datasets/feedback_sample.csv` contains 130+ rows with:
- 10 training programs, ~12 responses each
- Intentional dirty data: duplicate rows, out-of-range ratings (0, 6), non-numeric ratings ("N/A"), and rows with missing required fields
- Demonstrates the full Extract → Transform → Load cleaning pipeline

---

## GitHub Repository Naming

Follows the convention:
```
AFDE_May26_Aravind_FMS
```
