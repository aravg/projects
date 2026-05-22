import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from etl.pipeline import run_pipeline, DATASET_PATH

router = APIRouter(prefix="/etl", tags=["etl"])


@router.get("/dataset-info")
def dataset_info():
    exists = os.path.isfile(DATASET_PATH)
    info = {"exists": exists, "path": DATASET_PATH}
    if exists:
        info["size_bytes"] = os.path.getsize(DATASET_PATH)
        with open(DATASET_PATH, "r") as f:
            info["row_count_raw"] = sum(1 for _ in f) - 1  # subtract header
    return info


@router.post("/run")
def run_etl(db: Session = Depends(get_db)):
    if not os.path.isfile(DATASET_PATH):
        raise HTTPException(
            status_code=404,
            detail=f"Dataset not found at {DATASET_PATH}. Ensure datasets/tickets_historical.csv exists.",
        )
    try:
        result = run_pipeline(db)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
