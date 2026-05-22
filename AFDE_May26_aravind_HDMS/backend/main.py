from typing import Optional, List
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import crud
from schemas import TicketResponse
from routers.tickets import router as tickets_router
from routers.analytics import router as analytics_router
from routers.etl import router as etl_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Helpdesk Ticket Management System",
    description="REST API for managing IT support tickets with ETL analytics",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets_router)
app.include_router(analytics_router)
app.include_router(etl_router)


@app.get("/")
def root():
    return {"message": "Helpdesk Ticket Management System API", "version": "2.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/search", response_model=List[TicketResponse])
def search_tickets(
    keyword: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return crud.search_tickets(
        db, keyword=keyword, category=category, status=status, priority=priority
    )
