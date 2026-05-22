import pandas as pd


VALID_CATEGORIES = {
    "VPN Issue", "Password Reset", "Software Installation",
    "Laptop Issue", "Email Access", "Network Connectivity", "Hardware Request", "Other",
}
VALID_PRIORITIES = {"Low", "Medium", "High", "Critical"}
VALID_STATUSES = {"Open", "In Progress", "Resolved", "Closed"}

STATUS_ALIASES = {
    "in progress": "In Progress",
    "inprogress": "In Progress",
    "resolved": "Resolved",
    "closed": "Closed",
    "open": "Open",
}


def transform(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    original_count = len(df)

    # Drop fully duplicate rows
    df = df.drop_duplicates()
    after_dedup = len(df)

    # Strip and normalise text fields
    for col in ("employee_name", "department", "issue_category", "description", "priority", "status"):
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    df["employee_name"] = df["employee_name"].str.title()
    # Don't title-case department — values like "IT" and "HR" must stay uppercase

    # Normalise status (case-insensitive aliases)
    df["status"] = df["status"].apply(
        lambda s: STATUS_ALIASES.get(s.lower(), s) if isinstance(s, str) else "Open"
    )
    df["status"] = df["status"].apply(lambda s: s if s in VALID_STATUSES else "Open")

    # Normalise priority
    df["priority"] = df["priority"].str.capitalize()
    df["priority"] = df["priority"].apply(lambda p: p if p in VALID_PRIORITIES else "Medium")

    # Normalise category
    df["issue_category"] = df["issue_category"].apply(
        lambda c: c if c in VALID_CATEGORIES else "Other"
    )

    # Parse timestamps
    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
    df = df.dropna(subset=["created_at"])

    # Compute resolution_days for completed tickets
    if "resolved_at" in df.columns:
        df["resolved_at"] = pd.to_datetime(df["resolved_at"], errors="coerce")
        df["resolution_days"] = (df["resolved_at"] - df["created_at"]).dt.days
        # Clear resolution_days for tickets not yet resolved
        df.loc[~df["status"].isin(["Resolved", "Closed"]), "resolution_days"] = None
    else:
        df["resolution_days"] = None

    # Drop rows missing required fields after cleaning
    df = df.dropna(subset=["employee_name", "department", "issue_category", "description"])
    df = df[df["employee_name"] != "Nan"]

    final_count = len(df)

    stats = {
        "original": original_count,
        "duplicates_removed": original_count - after_dedup,
        "invalid_rows_dropped": after_dedup - final_count,
        "final": final_count,
    }
    return df.reset_index(drop=True), stats
