from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
import models, schemas, crud
from database import engine, get_db
from routers import books, borrowers, transactions

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Library Management System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

@app.get("/app", include_in_schema=False)
def serve_frontend():
    return FileResponse(FRONTEND_DIR / "index.html")

app.include_router(books.router)
app.include_router(borrowers.router)
app.include_router(transactions.router)

@app.get("/")
def root():
    return {"message": "Library Management System API", "version": "1.0.0"}

@app.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)

@app.get("/search", response_model=List[schemas.BookResponse])
def search_books(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    author: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.search_books(db, query=q or "", category=category, author=author)
