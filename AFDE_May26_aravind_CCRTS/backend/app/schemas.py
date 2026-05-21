from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "customer"
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    model_config = {"from_attributes": True}

class ComplaintCreate(BaseModel):
    title: str
    description: str
    category_id: Optional[int] = None
    priority: str = "medium"

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None

class HistoryOut(BaseModel):
    id: int
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    updated_at: datetime
    user: Optional[UserOut] = None
    model_config = {"from_attributes": True}

class ComplaintOut(BaseModel):
    id: int
    complaint_number: str
    title: str
    description: str
    priority: str
    status: str
    is_escalated: bool
    resolution_notes: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    customer: Optional[UserOut] = None
    agent: Optional[UserOut] = None
    category: Optional[CategoryOut] = None
    history: List[HistoryOut] = []
    model_config = {"from_attributes": True}

class AssignRequest(BaseModel):
    agent_id: int

class EscalateRequest(BaseModel):
    reason: str

class StatusUpdateRequest(BaseModel):
    status: str
    comment: Optional[str] = None

class FeedbackCreate(BaseModel):
    rating: int
    comments: Optional[str] = None

class FeedbackOut(BaseModel):
    id: int
    rating: int
    comments: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}
