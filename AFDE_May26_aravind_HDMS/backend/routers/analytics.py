from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import analytics_crud

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    return analytics_crud.get_analytics_summary(db)


@router.get("/category-distribution")
def get_category_distribution(db: Session = Depends(get_db)):
    return analytics_crud.get_category_distribution(db)


@router.get("/priority-distribution")
def get_priority_distribution(db: Session = Depends(get_db)):
    return analytics_crud.get_priority_distribution(db)


@router.get("/department-counts")
def get_department_counts(db: Session = Depends(get_db)):
    return analytics_crud.get_department_counts(db)


@router.get("/resolution-trends")
def get_resolution_trends(db: Session = Depends(get_db)):
    return analytics_crud.get_resolution_trends(db)
