from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

@router.post("/{complaint_id}", response_model=schemas.FeedbackOut)
def submit_feedback(
    complaint_id: int,
    data: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    existing = db.query(models.Feedback).filter(models.Feedback.complaint_id == complaint_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Feedback already submitted")
    feedback = models.Feedback(
        complaint_id=complaint_id,
        customer_id=current_user.id,
        rating=data.rating,
        comments=data.comments
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
