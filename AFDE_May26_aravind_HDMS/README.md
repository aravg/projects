# Helpdesk Ticket Management System (HDMS)

A full-stack web application for managing IT support tickets — built with React, FastAPI, and SQLite.

---

## Project Overview

Organizations rely on IT support teams to resolve employee issues like VPN failures, software requests, and password resets. This system provides a centralized, web-based platform to:

- Create and track support tickets
- Manage ticket status through a workflow
- Search and filter tickets by keyword, category, status, or priority
- Maintain historical support records

---

## Features

- **Dashboard** — Stats overview with resolution rate, recent tickets
- **Create Ticket** — Form with employee info, category, priority, and description
- **Ticket Listing** — Filterable/searchable table of all tickets
- **Ticket Detail** — Full view with inline edit, quick status progression, resolution notes
- **CRUD Operations** — Full Create, Read, Update, Delete for tickets
- **Search & Filter** — Keyword search + category/status/priority filters
- **Responsive Design** — Works on desktop and tablet screens

---

## Technology Stack

| Layer       | Technology            |
|-------------|----------------------|
| Frontend    | React 18 + Vite      |
| Styling     | Tailwind CSS         |
| HTTP Client | Axios                |
| Routing     | React Router v6      |
| Backend     | Python FastAPI       |
| Database    | SQLite + SQLAlchemy  |
| Validation  | Pydantic v2          |
| API Testing | Postman / Swagger UI |

---

## Project Structure

```
HDMS/
├── backend/
│   ├── main.py          # FastAPI app + CORS + routes
│   ├── database.py      # SQLAlchemy engine & session
│   ├── models.py        # ORM models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── crud.py          # Database operations
│   ├── routers/
│   │   └── tickets.py   # Ticket API endpoints
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/  # Sidebar, StatusBadge, PriorityBadge, StatsCard
│   │   ├── pages/       # Dashboard, CreateTicket, TicketList, TicketDetail
│   │   ├── services/    # ticketService.js (API calls)
│   │   ├── App.jsx
│   │   ├── api.js       # Axios instance
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── database/
│   └── schema.sql       # SQLite schema + sample data
├── screenshots/
├── docs/
└── README.md
```

---

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`
Swagger docs: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Database Setup

The SQLite database (`helpdesk.db`) is automatically created when the backend starts.

To load sample data:
```bash
sqlite3 backend/helpdesk.db < database/schema.sql
```

---

## API Documentation

Base URL: `http://localhost:8000`

| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | `/tickets/`         | Get all tickets          |
| GET    | `/tickets/stats`    | Get ticket statistics    |
| GET    | `/tickets/{id}`     | Get ticket by ID         |
| POST   | `/tickets/`         | Create new ticket        |
| PUT    | `/tickets/{id}`     | Update ticket            |
| DELETE | `/tickets/{id}`     | Delete ticket            |
| GET    | `/search`           | Search/filter tickets    |

### Create Ticket — Request Body

```json
{
  "employee_name": "John Smith",
  "department": "IT",
  "issue_category": "VPN Issue",
  "description": "Cannot connect to VPN from home network.",
  "priority": "High"
}
```

### Search Tickets — Query Parameters

```
GET /search?keyword=vpn&status=Open&priority=High&category=VPN Issue
```

### Ticket Response

```json
{
  "ticket_id": 1,
  "employee_name": "John Smith",
  "department": "IT",
  "issue_category": "VPN Issue",
  "description": "Cannot connect to VPN from home network.",
  "priority": "High",
  "status": "Open",
  "resolution_notes": null,
  "created_at": "2026-05-21T10:30:00",
  "updated_at": null
}
```

---

## Ticket Categories

- VPN Issue
- Password Reset
- Software Installation
- Laptop Issue
- Email Access
- Network Connectivity
- Hardware Request
- Other

## Priority Levels

| Priority | Description          |
|----------|---------------------|
| Low      | Non-urgent           |
| Medium   | Standard priority    |
| High     | Needs quick attention|
| Critical | Immediate action     |

## Status Workflow

`Open` → `In Progress` → `Resolved` → `Closed`

---

## Evaluation Criteria Coverage

| Criteria                  | Coverage |
|---------------------------|----------|
| Frontend Development      | React + Tailwind, 4 pages, components |
| Backend API Development   | FastAPI, 7 endpoints, REST standards |
| Database Integration      | SQLite + SQLAlchemy ORM |
| CRUD Functionality        | Full Create/Read/Update/Delete |
| Search/Filtering Features | Keyword + category + status + priority |
| Code Quality & Structure  | Modular, layered architecture |
| Documentation             | README + API docs + schema |
