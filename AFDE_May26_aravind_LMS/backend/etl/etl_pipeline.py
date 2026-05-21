"""
ETL Pipeline runner for Library Management System Phase 2.

Stages:
  1. Extract  – read books.csv, borrowers.csv, transactions.csv from datasets/
  2. Transform – clean nulls/duplicates, validate refs, compute analytics aggregations
  3. Load     – write aggregated results to analytics tables in library.db

Run standalone:
    cd backend
    python etl/etl_pipeline.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etl.extract import extract_all
from etl.transform import transform_all
from etl.load import load_analytics
from database import SessionLocal, engine
import models


def run_etl() -> dict:
    print("[ETL] Starting pipeline...")
    models.Base.metadata.create_all(bind=engine)

    print("[ETL] Stage 1: Extracting from CSV datasets...")
    raw = extract_all()
    print(f"       books={len(raw['books'])}, borrowers={len(raw['borrowers'])}, transactions={len(raw['transactions'])}")

    print("[ETL] Stage 2: Transforming data...")
    transformed = transform_all(raw)
    print(f"       most_borrowed={len(transformed['most_borrowed'])}")
    print(f"       categories={len(transformed['category_borrowing'])}")
    print(f"       monthly_periods={len(transformed['monthly_trends'])}")
    print(f"       overdue={len(transformed['overdue'])}")

    print("[ETL] Stage 3: Loading analytics tables...")
    db = SessionLocal()
    try:
        result = load_analytics(transformed, db)
    finally:
        db.close()

    print("[ETL] Pipeline completed successfully.")
    print(f"       {result}")
    return result


if __name__ == "__main__":
    run_etl()
