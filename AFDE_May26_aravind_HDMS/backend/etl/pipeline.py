import os
from sqlalchemy.orm import Session
from .extract import extract
from .transform import transform
from .load import load

DATASET_PATH = os.path.normpath(
    os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "datasets",
        "tickets_historical.csv",
    )
)


def run_pipeline(db: Session, csv_path: str | None = None) -> dict:
    path = csv_path or DATASET_PATH

    raw_df, extract_meta = extract(path)
    clean_df, transform_meta = transform(raw_df)
    loaded_count = load(clean_df, db)

    return {
        "status": "success",
        "dataset_path": path,
        "extracted": extract_meta["row_count"],
        "duplicates_removed": transform_meta["duplicates_removed"],
        "invalid_rows_dropped": transform_meta["invalid_rows_dropped"],
        "loaded": loaded_count,
    }
