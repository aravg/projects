import pandas as pd
from sqlalchemy.orm import Session
from models import ReportingTicket


def load(df: pd.DataFrame, db: Session) -> int:
    # Replace table contents on every ETL run
    db.query(ReportingTicket).delete()
    db.flush()

    records = []
    for _, row in df.iterrows():
        source_id = None
        if "ticket_id" in row and pd.notna(row["ticket_id"]):
            try:
                source_id = int(row["ticket_id"])
            except (ValueError, TypeError):
                pass

        res_days = None
        if "resolution_days" in row and pd.notna(row.get("resolution_days")):
            try:
                res_days = int(row["resolution_days"])
            except (ValueError, TypeError):
                pass

        records.append(
            ReportingTicket(
                source_ticket_id=source_id,
                employee_name=str(row["employee_name"]),
                department=str(row["department"]),
                issue_category=str(row["issue_category"]),
                description=str(row["description"]),
                priority=str(row["priority"]),
                status=str(row["status"]),
                created_at=row["created_at"].to_pydatetime() if pd.notna(row["created_at"]) else None,
                resolution_days=res_days,
            )
        )

    db.bulk_save_objects(records)
    db.commit()
    return len(records)
