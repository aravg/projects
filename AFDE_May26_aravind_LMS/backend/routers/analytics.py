from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/most-borrowed", response_model=List[schemas.MostBorrowedResponse])
def get_most_borrowed(limit: int = 10, db: Session = Depends(get_db)):
    return db.query(models.AnalyticsMostBorrowed).order_by(
        models.AnalyticsMostBorrowed.borrow_count.desc()
    ).limit(limit).all()


@router.get("/category-borrowing", response_model=List[schemas.CategoryBorrowingResponse])
def get_category_borrowing(db: Session = Depends(get_db)):
    return db.query(models.AnalyticsCategoryBorrowing).order_by(
        models.AnalyticsCategoryBorrowing.borrow_count.desc()
    ).all()


@router.get("/monthly-trends", response_model=List[schemas.MonthlyTrendResponse])
def get_monthly_trends(db: Session = Depends(get_db)):
    return db.query(models.AnalyticsMonthlyTrend).order_by(
        models.AnalyticsMonthlyTrend.year_month
    ).all()


@router.get("/overdue", response_model=List[schemas.OverdueResponse])
def get_overdue(db: Session = Depends(get_db)):
    return db.query(models.AnalyticsOverdue).order_by(
        models.AnalyticsOverdue.days_overdue.desc()
    ).all()


@router.get("/status", response_model=schemas.ETLStatusResponse)
def get_etl_status(db: Session = Depends(get_db)):
    mb_count = db.query(models.AnalyticsMostBorrowed).count()
    cat_count = db.query(models.AnalyticsCategoryBorrowing).count()
    mt_count = db.query(models.AnalyticsMonthlyTrend).count()
    ov_count = db.query(models.AnalyticsOverdue).count()
    last = db.query(models.AnalyticsMostBorrowed).order_by(
        models.AnalyticsMostBorrowed.etl_run_at.desc()
    ).first()
    return schemas.ETLStatusResponse(
        etl_run=mb_count > 0,
        most_borrowed_count=mb_count,
        category_count=cat_count,
        monthly_trend_count=mt_count,
        overdue_count=ov_count,
        last_run_at=last.etl_run_at.isoformat() if last and last.etl_run_at else None,
    )


@router.post("/run-etl")
def trigger_etl(db: Session = Depends(get_db)):
    try:
        from etl.extract import extract_all
        from etl.transform import transform_all
        from etl.load import load_analytics
        raw = extract_all()
        transformed = transform_all(raw)
        result = load_analytics(transformed, db)
        return {"status": "success", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
