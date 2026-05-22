import io
import csv
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import ETLJob, Feedback
from schemas import AnalyticsByProgram, ETLJobResponse, ETLJobSummary, OverallAnalytics
import etl_service

router = APIRouter(prefix="/etl", tags=["etl"])

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


@router.post("/upload", response_model=ETLJobResponse, status_code=201)
async def upload_and_run_etl(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ext = ""
    if "." in (file.filename or ""):
        ext = "." + file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        result = etl_service.run_etl(db, contents, file.filename)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return result


@router.get("/jobs", response_model=List[ETLJobSummary])
def list_etl_jobs(db: Session = Depends(get_db)):
    return db.query(ETLJob).order_by(ETLJob.created_at.desc()).all()


@router.get("/jobs/{job_id}", response_model=ETLJobResponse)
def get_etl_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(ETLJob).filter(ETLJob.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="ETL job not found")
    return job


@router.get("/analytics", response_model=OverallAnalytics)
def get_overall_analytics(db: Session = Depends(get_db)):
    total = db.query(func.count(Feedback.feedback_id)).scalar() or 0
    avg = db.query(func.avg(Feedback.rating)).scalar() or 0.0
    programs = db.query(Feedback.program_name).distinct().count()
    total_jobs = db.query(func.count(ETLJob.job_id)).scalar() or 0

    rating_dist = {}
    for r in range(1, 6):
        rating_dist[f"rating_{r}"] = (
            db.query(func.count(Feedback.feedback_id))
            .filter(Feedback.rating == r)
            .scalar() or 0
        )

    return {
        "total_feedback": total,
        "average_rating": round(float(avg), 2),
        "total_programs": programs,
        "total_etl_jobs": total_jobs,
        "rating_distribution": rating_dist,
    }


@router.get("/analytics/by-program", response_model=List[AnalyticsByProgram])
def get_analytics_by_program(db: Session = Depends(get_db)):
    rows = db.query(Feedback.program_name, Feedback.rating).all()

    programs: dict = defaultdict(list)
    for row in rows:
        programs[row.program_name].append(row.rating)

    result = []
    for prog, ratings in programs.items():
        result.append({
            "program_name": prog,
            "total_responses": len(ratings),
            "avg_rating": round(sum(ratings) / len(ratings), 2),
            "rating_1_count": ratings.count(1),
            "rating_2_count": ratings.count(2),
            "rating_3_count": ratings.count(3),
            "rating_4_count": ratings.count(4),
            "rating_5_count": ratings.count(5),
        })

    return sorted(result, key=lambda x: x["avg_rating"], reverse=True)


@router.get("/report/download")
def download_report(db: Session = Depends(get_db)):
    rows = db.query(Feedback.program_name, Feedback.rating).all()

    programs: dict = defaultdict(list)
    for row in rows:
        programs[row.program_name].append(row.rating)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Program Name", "Total Responses", "Average Rating",
        "Rating 1", "Rating 2", "Rating 3", "Rating 4", "Rating 5",
    ])
    for prog in sorted(programs.keys()):
        ratings = programs[prog]
        writer.writerow([
            prog,
            len(ratings),
            round(sum(ratings) / len(ratings), 2),
            ratings.count(1),
            ratings.count(2),
            ratings.count(3),
            ratings.count(4),
            ratings.count(5),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=analytics_report.csv"},
    )
