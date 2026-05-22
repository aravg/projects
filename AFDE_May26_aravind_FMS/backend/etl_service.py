import pandas as pd
from io import BytesIO
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from models import Feedback, ETLJob, FeedbackAnalytics

# Flexible column name aliases so uploads with varied headers still work
COLUMN_ALIASES = {
    "participant_name": ["participant_name", "participant", "name", "attendee", "attendee_name", "student", "employee"],
    "program_name": ["program_name", "program", "event", "event_name", "course", "training", "workshop"],
    "rating": ["rating", "score", "stars", "grade", "feedback_score"],
    "comments": ["comments", "comment", "feedback", "notes", "review", "remarks"],
    "submitted_date": ["submitted_date", "submitted_at", "date", "submission_date"],
}


def _resolve_columns(df: pd.DataFrame) -> dict:
    cols_lower = {c.lower().strip(): c for c in df.columns}
    resolved = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in cols_lower:
                resolved[canonical] = cols_lower[alias]
                break
    return resolved


# ─── Extract ──────────────────────────────────────────────────────────────────

def extract(file_bytes: bytes, filename: str) -> pd.DataFrame:
    if filename.lower().endswith(".csv"):
        return pd.read_csv(BytesIO(file_bytes))
    return pd.read_excel(BytesIO(file_bytes))


# ─── Transform ────────────────────────────────────────────────────────────────

def transform(df: pd.DataFrame):
    col_map = _resolve_columns(df)

    missing = [f for f in ["participant_name", "program_name", "rating"] if f not in col_map]
    if missing:
        raise ValueError(
            f"Required columns not found: {missing}. "
            f"Expected one of {COLUMN_ALIASES}. Got: {list(df.columns)}"
        )

    rename = {v: k for k, v in col_map.items()}
    df = df.rename(columns=rename)

    total_records = len(df)

    keep = [c for c in ["participant_name", "program_name", "rating", "comments"] if c in df.columns]
    df = df[keep].copy()

    # Drop rows where required fields are NaN/null before any string conversion
    df = df.dropna(subset=["participant_name", "program_name"])

    # Standardize text fields
    df["participant_name"] = df["participant_name"].astype(str).str.strip().str.title()
    df["program_name"] = df["program_name"].astype(str).str.strip()

    # Drop rows where required fields are empty strings after stripping
    df = df[df["participant_name"].str.len() > 0]
    df = df[df["program_name"].str.len() > 0]

    if "comments" in df.columns:
        df["comments"] = df["comments"].apply(
            lambda x: str(x).strip() if isinstance(x, str) and str(x).strip() not in ("", "nan", "NaN") else None
        )
    else:
        df["comments"] = None

    # Validate ratings — must be integer 1-5
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce")
    invalid_mask = df["rating"].isna() | ~df["rating"].between(1, 5, inclusive="both")
    invalid_count = int(invalid_mask.sum())
    df = df[~invalid_mask].copy()
    df["rating"] = df["rating"].astype(int)

    after_validation = len(df)

    # Remove within-file duplicates (same participant + program + rating)
    df_deduped = df.drop_duplicates(subset=["participant_name", "program_name", "rating"])
    duplicate_count = len(df) - len(df_deduped)
    df = df_deduped.reset_index(drop=True)

    stats = {
        "total_records": total_records,
        "valid_records": len(df),
        "duplicate_records": duplicate_count,
        "invalid_records": invalid_count + (total_records - after_validation - invalid_count),
    }
    return df, stats


# ─── Load ─────────────────────────────────────────────────────────────────────

def load(db: Session, job_id: int, df: pd.DataFrame) -> int:
    records = []
    for _, row in df.iterrows():
        comments = row.get("comments")
        if not isinstance(comments, str) or not comments.strip():
            comments = None
        records.append(Feedback(
            participant_name=row["participant_name"],
            program_name=row["program_name"],
            rating=int(row["rating"]),
            comments=comments,
        ))
    db.add_all(records)
    db.flush()

    # Compute per-program analytics for this ETL job
    for program, group in df.groupby("program_name"):
        counts = group["rating"].value_counts()
        db.add(FeedbackAnalytics(
            job_id=job_id,
            program_name=str(program),
            avg_rating=round(float(group["rating"].mean()), 2),
            total_responses=len(group),
            rating_1_count=int(counts.get(1, 0)),
            rating_2_count=int(counts.get(2, 0)),
            rating_3_count=int(counts.get(3, 0)),
            rating_4_count=int(counts.get(4, 0)),
            rating_5_count=int(counts.get(5, 0)),
        ))

    db.commit()
    return len(records)


# ─── Orchestrator ─────────────────────────────────────────────────────────────

def run_etl(db: Session, file_bytes: bytes, filename: str) -> dict:
    job = ETLJob(filename=filename, status="running")
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        df = extract(file_bytes, filename)
        clean_df, stats = transform(df)
        loaded = load(db, job.job_id, clean_df)

        job.status = "completed"
        job.total_records = stats["total_records"]
        job.valid_records = stats["valid_records"]
        job.duplicate_records = stats["duplicate_records"]
        job.invalid_records = stats["invalid_records"]
        job.loaded_records = loaded
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(job)

    except Exception as exc:
        job.status = "failed"
        job.error_message = str(exc)
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(job)
        raise

    return {
        "job_id": job.job_id,
        "filename": job.filename,
        "status": job.status,
        "total_records": job.total_records,
        "valid_records": job.valid_records,
        "duplicate_records": job.duplicate_records,
        "invalid_records": job.invalid_records,
        "loaded_records": job.loaded_records,
        "error_message": job.error_message,
        "created_at": job.created_at,
        "completed_at": job.completed_at,
    }
