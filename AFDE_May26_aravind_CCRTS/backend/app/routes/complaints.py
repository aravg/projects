from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, timedelta
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

SLA_HOURS = {"low": 72, "medium": 48, "high": 24, "critical": 4}

def generate_complaint_number(db: Session):
    count = db.query(models.Complaint).count()
    return f"CMP-{datetime.now().year}-{str(count + 1).zfill(5)}"

def create_notification(db, user_id, title, message):
    notif = models.Notification(user_id=user_id, title=title, message=message)
    db.add(notif)

@router.get("", response_model=List[schemas.ComplaintOut])
def list_complaints(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Complaint).options(
        joinedload(models.Complaint.customer),
        joinedload(models.Complaint.agent),
        joinedload(models.Complaint.category),
        joinedload(models.Complaint.history).joinedload(models.ComplaintHistory.user),
    )
    if current_user.role == "customer":
        query = query.filter(models.Complaint.customer_id == current_user.id)
    elif current_user.role == "agent":
        query = query.filter(models.Complaint.assigned_to == current_user.id)
    if status:
        query = query.filter(models.Complaint.status == status)
    if priority:
        query = query.filter(models.Complaint.priority == priority)
    if category_id:
        query = query.filter(models.Complaint.category_id == category_id)
    if search:
        query = query.filter(or_(
            models.Complaint.title.ilike(f"%{search}%"),
            models.Complaint.complaint_number.ilike(f"%{search}%"),
            models.Complaint.description.ilike(f"%{search}%")
        ))
    return query.order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=schemas.ComplaintOut)
def create_complaint(
    data: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    hours = SLA_HOURS.get(data.priority, 48)
    complaint = models.Complaint(
        complaint_number=generate_complaint_number(db),
        customer_id=current_user.id,
        category_id=data.category_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        status="open",
        sla_deadline=datetime.utcnow() + timedelta(hours=hours)
    )
    db.add(complaint)
    db.flush()
    history = models.ComplaintHistory(
        complaint_id=complaint.id,
        updated_by=current_user.id,
        old_status=None,
        new_status="open",
        comment="Complaint registered"
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)
    return db.query(models.Complaint).options(
        joinedload(models.Complaint.customer),
        joinedload(models.Complaint.agent),
        joinedload(models.Complaint.category),
        joinedload(models.Complaint.history).joinedload(models.ComplaintHistory.user),
    ).filter(models.Complaint.id == complaint.id).first()

@router.get("/{complaint_id}", response_model=schemas.ComplaintOut)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    complaint = db.query(models.Complaint).options(
        joinedload(models.Complaint.customer),
        joinedload(models.Complaint.agent),
        joinedload(models.Complaint.category),
        joinedload(models.Complaint.history).joinedload(models.ComplaintHistory.user),
    ).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if current_user.role == "customer" and complaint.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return complaint

@router.put("/{complaint_id}", response_model=schemas.ComplaintOut)
def update_complaint(
    complaint_id: int,
    data: schemas.ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    old_status = complaint.status
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(complaint, key, value)
    new_status = update_data.get("status", old_status)
    if new_status != old_status:
        if new_status == "resolved":
            complaint.resolved_at = datetime.utcnow()
        history = models.ComplaintHistory(
            complaint_id=complaint.id,
            updated_by=current_user.id,
            old_status=old_status,
            new_status=new_status,
            comment=f"Status updated to {new_status}"
        )
        db.add(history)
        create_notification(db, complaint.customer_id, "Complaint Updated", f"Your complaint {complaint.complaint_number} status changed to {new_status}")
    db.commit()
    db.refresh(complaint)
    return db.query(models.Complaint).options(
        joinedload(models.Complaint.customer),
        joinedload(models.Complaint.agent),
        joinedload(models.Complaint.category),
        joinedload(models.Complaint.history).joinedload(models.ComplaintHistory.user),
    ).filter(models.Complaint.id == complaint_id).first()

@router.post("/{complaint_id}/assign", response_model=schemas.ComplaintOut)
def assign_complaint(
    complaint_id: int,
    data: schemas.AssignRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin", "supervisor"))
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Not found")
    agent = db.query(models.User).filter(models.User.id == data.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    old_status = complaint.status
    complaint.assigned_to = data.agent_id
    complaint.status = "assigned"
    history = models.ComplaintHistory(
        complaint_id=complaint.id,
        updated_by=current_user.id,
        old_status=old_status,
        new_status="assigned",
        comment=f"Assigned to {agent.name}"
    )
    db.add(history)
    create_notification(db, data.agent_id, "New Complaint Assigned", f"Complaint {complaint.complaint_number} has been assigned to you")
    db.commit()
    db.refresh(complaint)
    return db.query(models.Complaint).options(
        joinedload(models.Complaint.customer),
        joinedload(models.Complaint.agent),
        joinedload(models.Complaint.category),
        joinedload(models.Complaint.history).joinedload(models.ComplaintHistory.user),
    ).filter(models.Complaint.id == complaint_id).first()

@router.post("/{complaint_id}/escalate", response_model=schemas.ComplaintOut)
def escalate_complaint(
    complaint_id: int,
    data: schemas.EscalateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Not found")
    old_status = complaint.status
    complaint.status = "escalated"
    complaint.is_escalated = True
    history = models.ComplaintHistory(
        complaint_id=complaint.id,
        updated_by=current_user.id,
        old_status=old_status,
        new_status="escalated",
        comment=f"Escalated: {data.reason}"
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)
    return db.query(models.Complaint).options(
        joinedload(models.Complaint.customer),
        joinedload(models.Complaint.agent),
        joinedload(models.Complaint.category),
        joinedload(models.Complaint.history).joinedload(models.ComplaintHistory.user),
    ).filter(models.Complaint.id == complaint_id).first()

@router.post("/{complaint_id}/status", response_model=schemas.ComplaintOut)
def update_status(
    complaint_id: int,
    data: schemas.StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Not found")
    old_status = complaint.status
    complaint.status = data.status
    if data.status == "resolved":
        complaint.resolved_at = datetime.utcnow()
    history = models.ComplaintHistory(
        complaint_id=complaint.id,
        updated_by=current_user.id,
        old_status=old_status,
        new_status=data.status,
        comment=data.comment or f"Status changed to {data.status}"
    )
    db.add(history)
    create_notification(db, complaint.customer_id, "Complaint Status Updated", f"Complaint {complaint.complaint_number} is now {data.status}")
    db.commit()
    db.refresh(complaint)
    return db.query(models.Complaint).options(
        joinedload(models.Complaint.customer),
        joinedload(models.Complaint.agent),
        joinedload(models.Complaint.category),
        joinedload(models.Complaint.history).joinedload(models.ComplaintHistory.user),
    ).filter(models.Complaint.id == complaint_id).first()
