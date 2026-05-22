import pandas as pd


REQUIRED_COLUMNS = {
    "employee_name", "department", "issue_category",
    "description", "priority", "status", "created_at",
}


def extract(csv_path: str) -> tuple[pd.DataFrame, dict]:
    df = pd.read_csv(csv_path)

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing required columns: {missing}")

    return df, {"row_count": len(df), "columns": list(df.columns)}
