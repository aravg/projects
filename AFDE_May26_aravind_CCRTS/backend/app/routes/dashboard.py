from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from .. import models, auth
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    base = db.query(models.Complaint)
    if current_user.role == "customer":
        base = base.filter(models.Complaint.customer_id == current_user.id)
    elif current_user.role == "agent":
        base = base.filter(models.Complaint.assigned_to == current_user.id)

    total = base.count()
    open_count = base.filter(models.Complaint.status == "open").count()
    assigned = base.filter(models.Complaint.status == "assigned").count()
    in_progress = base.filter(models.Complaint.status == "in_progress").count()
    resolved = base.filter(models.Complaint.status == "resolved").count()
    closed = base.filter(models.Complaint.status == "closed").count()
    escalated = base.filter(models.Complaint.status == "escalated").count()

    now = datetime.utcnow()
    sla_breaches = base.filter(
        models.Complaint.sla_deadline < now,
        models.Complaint.status.notin_(["resolved", "closed"])
    ).count()

    by_priority = {}
    for priority in ["low", "medium", "high", "critical"]:
        by_priority[priority] = base.filter(models.Complaint.priority == priority).count()

    by_category = []
    cats = db.query(models.Category).all()
    for cat in cats:
        count = base.filter(models.Complaint.category_id == cat.id).count()
        by_category.append({"name": cat.name, "count": count})

    return {
        "total": total,
        "open": open_count,
        "assigned": assigned,
        "in_progress": in_progress,
        "resolved": resolved,
        "closed": closed,
        "escalated": escalated,
        "sla_breaches": sla_breaches,
        "by_priority": by_priority,
        "by_category": by_category
    }
