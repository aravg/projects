# Library Management System (LMS)

A full-stack Library Management System capstone project built as part of the AFDE May 2026 program.

## Overview

This application provides a complete library management solution with features for managing books, borrowers, and borrow/return transactions through a modern web interface.

## Tech Stack

| Layer      | Technology              | Version  |
|------------|-------------------------|----------|
| Frontend   | React (Vite)            | 18.x     |
| Routing    | React Router DOM        | 6.x      |
| HTTP Client| Axios                   | 1.x      |
| Backend    | Python FastAPI          | 0.115.0  |
| ORM        | SQLAlchemy              | 2.0.36   |
| Validation | Pydantic                | 2.9.2    |
| Server     | Uvicorn                 | 0.32.0   |
| Database   | SQLite                  | Built-in |

## Features

- **Dashboard** - Live stats: total books, available books, borrowed books, total borrowers, recent transactions
- **Book Management** - Add, edit, delete, and search books with availability tracking
- **Borrower Management** - Register, update, and delete library members
- **Borrow/Return** - Issue books to borrowers and process returns; tracks active transactions
- **Advanced Search** - Search books by keyword, category, or author
- **REST API** - Full CRUD API with FastAPI and auto-generated Swagger docs at `/docs`

## Project Structure

```
AFDE_May26_aravind_LMS/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy engine and session
│   ├── models.py            # ORM models (Book, Borrower, Transaction)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── crud.py              # Database CRUD operations
│   ├── requirements.txt     # Python dependencies
│   └── routers/
│       ├── __init__.py
│       ├── books.py         # Book endpoints
│       ├── borrowers.py     # Borrower endpoints
│       └── transactions.py  # Borrow/Return endpoints
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       ├── services/
│       │   └── api.js       # Axios API service layer
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Books.jsx
│           ├── Borrowers.jsx
│           ├── BorrowReturn.jsx
│           └── Search.jsx
├── database/
│   └── schema.sql           # SQLite schema + sample data
├── docs/
├── screenshots/
├── .gitignore
└── README.md
```

## Setup & Running

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

5. API will be available at: `http://localhost:8000`
   - Swagger UI docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. App will be available at: `http://localhost:5173`

**Screenshots:**
**Dashboard screenshot:**
<img width="1864" height="861" alt="image (3)" src="https://github.com/user-attachments/assets/fa6443ff-cb10-4575-9750-315977dc74bc" />
**Book collections screenshot:**
<img width="1865" height="861" alt="image (4)" src="https://github.com/user-attachments/assets/c1f53e69-ab7a-4fda-9575-9eb6d2ad3164" />
**Borrow/return management:**
<img width="1826" height="868" alt="image (6)" src="https://github.com/user-attachments/assets/6a198e73-c1f1-46db-8215-3d2c5c929915" />
<img width="1873" height="689" alt="image (5)" src="https://github.com/user-attachments/assets/d3320dae-a86d-4f33-b179-e2771f06eb2e" />
**API testing:**
<img width="1750" height="842" alt="image (7)" src="https://github.com/user-attachments/assets/5318e120-59ca-4a3c-97bb-8f87d0c48970" />

## API Endpoints

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/`                   | API health check                   |
| GET    | `/dashboard`          | Dashboard statistics               |
| GET    | `/search`             | Search books (q, category, author) |
| GET    | `/books/`             | List all books                     |
| POST   | `/books/`             | Add a new book                     |
| GET    | `/books/{id}`         | Get book by ID                     |
| PUT    | `/books/{id}`         | Update book                        |
| DELETE | `/books/{id}`         | Delete book                        |
| GET    | `/borrowers/`         | List all borrowers                 |
| POST   | `/borrowers/`         | Register a new borrower            |
| PUT    | `/borrowers/{id}`     | Update borrower                    |
| DELETE | `/borrowers/{id}`     | Delete borrower                    |
| GET    | `/transactions`       | List all transactions              |
| POST   | `/borrow`             | Borrow a book                      |
| POST   | `/return`             | Return a book                      |

## Database Schema

The SQLite database (`library.db`) is auto-created on backend startup via SQLAlchemy. The `database/schema.sql` file contains the raw SQL schema and sample data for reference.

### Tables
- **books** - book_id, title, author, category, isbn, availability_status
- **borrowers** - borrower_id, borrower_name, email, phone
- **transactions** - transaction_id, book_id, borrower_id, borrow_date, return_date
