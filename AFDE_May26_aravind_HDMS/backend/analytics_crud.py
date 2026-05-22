from sqlalchemy import func
from sqlalchemy.orm import Session
from models import ReportingTicket


def get_analytics_summary(db: Session) -> dict:
    total = db.query(ReportingTicket).count()
    resolved = (
        db.query(ReportingTicket)
        .filter(ReportingTicket.status.in_(["Resolved", "Closed"]))
        .count()
    )
    avg_resolution = (
        db.query(func.avg(ReportingTicket.resolution_days))
        .filter(ReportingTicket.resolution_days.isnot(None))
        .scalar()
    )
    return {
        "total_imported": total,
        "resolved_count": resolved,
        "avg_resolution_days": round(float(avg_resolution), 1) if avg_resolution else 0.0,
    }


def get_category_distribution(db: Session) -> list[dict]:
    rows = (
        db.query(ReportingTicket.issue_category, func.count().label("count"))
        .group_by(ReportingTicket.issue_category)
        .order_by(func.count().desc())
        .all()
    )
    return [{"category": r[0], "count": r[1]} for r in rows]


def get_priority_distribution(db: Session) -> list[dict]:
    order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    rows = (
        db.query(ReportingTicket.priority, func.count().label("count"))
        .group_by(ReportingTicket.priority)
        .all()
    )
    result = [{"priority": r[0], "count": r[1]} for r in rows]
    result.sort(key=lambda x: order.get(x["priority"], 99))
    return result


def get_department_counts(db: Session) -> list[dict]:
    rows = (
        db.query(ReportingTicket.department, func.count().label("count"))
        .group_by(ReportingTicket.department)
        .order_by(func.count().desc())
        .all()
    )
    return [{"department": r[0], "count": r[1]} for r in rows]


def get_resolution_trends(db: Session) -> list[dict]:
    rows = (
        db.query(
            func.strftime("%Y-%m", ReportingTicket.created_at).label("month"),
            func.avg(ReportingTicket.resolution_days).label("avg_days"),
            func.count().label("ticket_count"),
        )
        .filter(ReportingTicket.resolution_days.isnot(None))
        .group_by(func.strftime("%Y-%m", ReportingTicket.created_at))
        .order_by("month")
        .all()
    )
    return [
        {
            "month": r[0],
            "avg_resolution_days": round(float(r[1]), 1) if r[1] else 0.0,
            "ticket_count": r[2],
        }
        for r in rows
    ]
