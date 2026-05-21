from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=List[schemas.UserOut])
def list_users(
    role: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin", "supervisor"))
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.all()

@router.get("/agents", response_model=List[schemas.UserOut])
def list_agents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin", "supervisor"))
):
    return db.query(models.User).filter(models.User.role == "agent", models.User.is_active == True).all()

@router.put("/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    data: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin"))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user
