import pandas as pd
from datetime import datetime
from sqlalchemy.orm import Session


def load_analytics(transformed: dict, db: Session):
    from models import (
        AnalyticsMostBorrowed,
        AnalyticsCategoryBorrowing,
        AnalyticsMonthlyTrend,
        AnalyticsOverdue,
    )

    now = datetime.utcnow()

    db.query(AnalyticsMostBorrowed).delete()
    for _, row in transformed["most_borrowed"].iterrows():
        db.add(AnalyticsMostBorrowed(
            book_title=row.get("title", ""),
            author=row.get("author", ""),
            category=row.get("category", ""),
            isbn=row.get("isbn", ""),
            borrow_count=int(row["borrow_count"]),
            etl_run_at=now,
        ))

    db.query(AnalyticsCategoryBorrowing).delete()
    for _, row in transformed["category_borrowing"].iterrows():
        db.add(AnalyticsCategoryBorrowing(
            category=row["category"],
            borrow_count=int(row["borrow_count"]),
            etl_run_at=now,
        ))

    db.query(AnalyticsMonthlyTrend).delete()
    for _, row in transformed["monthly_trends"].iterrows():
        db.add(AnalyticsMonthlyTrend(
            year_month=row["year_month"],
            borrow_count=int(row["borrow_count"]),
            etl_run_at=now,
        ))

    db.query(AnalyticsOverdue).delete()
    for _, row in transformed["overdue"].iterrows():
        db.add(AnalyticsOverdue(
            transaction_id=int(row["transaction_id"]),
            book_title=row.get("book_title", ""),
            borrower_name=row.get("borrower_name", ""),
            borrower_email=row.get("borrower_email", ""),
            borrow_date=row.get("borrow_date_str", ""),
            days_overdue=int(row.get("days_overdue", 0)),
            etl_run_at=now,
        ))

    db.commit()
    return {
        "most_borrowed_count": len(transformed["most_borrowed"]),
        "category_count": len(transformed["category_borrowing"]),
        "monthly_trend_count": len(transformed["monthly_trends"]),
        "overdue_count": len(transformed["overdue"]),
        "etl_run_at": now.isoformat(),
    }
