# AFDE_May26_aravind_CCRTS
## Customer Complaint & Resolution Tracking System

A full-stack enterprise web application for managing, monitoring, and resolving customer complaints with role-based access control, SLA tracking, and real-time analytics.

---

## Project Overview

The CCRTS centralizes complaint handling operations, enabling organizations to:
- Register and track complaints with auto-generated IDs
- Assign complaints to support agents
- Monitor SLA deadlines with auto-breach detection
- Escalate unresolved complaints
- Analyze trends via dashboards and reports

---

## Features Implemented

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
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Charts | Recharts |
| HTTP Client | Axios |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| Backend | FastAPI (Python 3.10+) |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite |
| Authentication | JWT (python-jose), bcrypt (passlib) |
| API Docs | Swagger UI (auto-generated) |

---

## Project Structure

```
AFDE_May26_aravind_CCRTS/
├── frontend/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Route-level page components
│       ├── context/        # React context (AuthContext)
│       └── services/       # Axios API service
├── backend/
│   └── app/
│       ├── routes/         # FastAPI route handlers
│       ├── models.py       # SQLAlchemy ORM models
│       ├── schemas.py      # Pydantic request/response schemas
│       ├── auth.py         # JWT authentication utilities
│       ├── seed.py         # Demo data seeder
│       └── main.py         # FastAPI app entry point
├── database/
│   └── schema.sql          # SQL schema for reference
├── screenshots/            # UI screenshots
├── docs/                   # Additional documentation
├── start-all.bat           # One-click startup script
├── .gitignore
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

### Access
- **Frontend App**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation (Swagger)**: http://localhost:8000/docs

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

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List complaint categories |
| POST | `/api/feedback/{complaint_id}` | Submit feedback |
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/{id}/read` | Mark notification read |
| PUT | `/api/notifications/read-all` | Mark all read |

### Example Request: Create Complaint
```json
POST /api/complaints
Authorization: Bearer <token>
{
  "title": "Invoice amount incorrect",
  "description": "My monthly invoice shows incorrect charges.",
  "category_id": 1,
  "priority": "high"
}
```

### Example Response
```json
{
  "id": 1,
  "complaint_number": "CMP-2024-00001",
  "title": "Invoice amount incorrect",
  "priority": "high",
  "status": "open",
  "sla_deadline": "2024-01-15T10:00:00",
  "is_escalated": false,
  "customer": { "id": 5, "name": "John Doe", "email": "customer@ccrts.com" },
  "agent": null,
  "category": { "id": 1, "name": "Billing Issues" },
  "history": [...]
}
```

---

## Database Schema

See `database/schema.sql` for the full schema. Key tables:

- **users** — All system users with roles
- **categories** — Complaint categories (7 pre-seeded)
- **complaints** — Core complaint records with SLA tracking
- **complaint_history** — Full audit trail
- **feedback** — Customer satisfaction ratings
- **notifications** — In-app notification system

---

## Evaluation Criteria Coverage

| Criteria | Status |
|----------|--------|
| Frontend Development | ✅ React + Tailwind, responsive design |
| Backend API Development | ✅ FastAPI REST APIs with proper HTTP methods |
| Database Integration | ✅ SQLAlchemy ORM + SQLite |
| CRUD Functionality | ✅ Full CRUD for complaints and users |
| Search/Filtering Features | ✅ Status, priority, keyword search |
| Code Quality & Structure | ✅ Modular architecture, layered design |
| Documentation | ✅ README, API docs, schema |

---

## Author
**Aravind G** | Batch: AFDE_May26 | Project: CCRTS
