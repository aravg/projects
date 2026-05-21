# Enterprise Knowledge Base Management System (EKBMS)

**AFDE_May26_aravind_EKBMS** — Phase 1 Capstone Project

A centralized web-based platform to help organizations create, manage, organize, and distribute knowledge resources across departments and teams.

---

## Features

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

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | SQLite (via sql.js — pure JavaScript) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | React Hot Toast |
| File Upload | Multer |

---

## Prerequisites

- Node.js v16+ (tested on v24)
- npm v8+

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

Backend runs on **http://localhost:5000**

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

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ekbms.com | admin123 |
| Author | author@ekbms.com | author123 |
| Reviewer | reviewer@ekbms.com | reviewer123 |
| Employee | employee@ekbms.com | employee123 |

> Quick-login buttons are available on the login page.

---

## Project Structure

```
AFDE_May26_aravind_EKBMS/
├── frontend/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Layout, Sidebar, Navbar, ArticleCard, StatCard
│   │   ├── pages/             # All page components
│   │   ├── contexts/          # AuthContext
│   │   └── services/          # Axios API client
│   └── package.json
│
├── backend/                   # Node.js + Express backend
│   ├── config/database.js     # SQLite init + seed data
│   ├── middleware/auth.js      # JWT middleware
│   ├── routes/                # All API route handlers
│   ├── uploads/               # File upload storage
│   └── package.json
│
├── database/
│   └── schema.sql             # Full database schema
│
├── docs/
│   └── API.md                 # API documentation
│
├── screenshots/               # Add UI screenshots here
└── README.md
```

---

## API Overview

| Module | Base Path |
|--------|-----------|
| Authentication | `/api/auth` |
| Articles | `/api/articles` |
| Categories | `/api/categories` |
| Tags | `/api/tags` |
| Search | `/api/search` |
| Comments | `/api/comments` |
| Files | `/api/files` |
| Approvals | `/api/approvals` |
| Users | `/api/users` |
| Analytics | `/api/analytics` |
| Notifications | `/api/notifications` |

Full API documentation: [docs/API.md](./docs/API.md)

---

## UI Screens

| Screen | Path | Access |
|--------|------|--------|
| Login | `/login` | Public |
| Register | `/register` | Public |
| Dashboard | `/dashboard` | All roles |
| Articles | `/articles` | All roles |
| Article Detail | `/articles/:id` | All roles |
| Create Article | `/articles/create` | Author, Admin |
| Edit Article | `/articles/:id/edit` | Author, Admin |
| Categories | `/categories` | All roles |
| Search | `/search` | All roles |
| Approval Queue | `/approvals` | Reviewer, Admin |
| User Management | `/users` | Admin |
| Reports | `/reports` | Admin |
| Profile | `/profile` | All roles |

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
- Reports/analytics
- User management

---

## Evaluation Criteria Coverage

| Criteria | Status |
|----------|--------|
| Frontend Development | ✅ React + Tailwind responsive UI |
| Backend API Development | ✅ RESTful Express APIs |
| Database Integration | ✅ SQLite with full schema |
| CRUD Functionality | ✅ All entities |
| Search/Filtering | ✅ Full-text + filters |
| Code Quality & Structure | ✅ Modular, layered architecture |
| Documentation | ✅ README + API docs |

---

## License

Capstone Project — AFDE Batch May 2026
