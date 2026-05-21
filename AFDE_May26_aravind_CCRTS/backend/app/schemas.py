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


# ── Phase 2: Analytics Schemas ────────────────────────────────────────────────

class ETLRunLogOut(BaseModel):
    id: Optional[int] = None
    run_at: Optional[str] = None
    status: str
    records_extracted: int = 0
    records_transformed: int = 0
    records_loaded: int = 0
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None

class ETLStatusOut(BaseModel):
    last_run: ETLRunLogOut
    total_analytics_records: int

class SLAPriorityItem(BaseModel):
    priority: str
    total: int
    breached: int
    compliant: int
    breach_rate: float

class SLACategoryItem(BaseModel):
    category: str
    total: int
    breached: int
    breach_rate: float

class SLASummary(BaseModel):
    total_complaints: int
    total_breached: int
    total_compliant: int
    overall_breach_rate: float

class SLABreachesOut(BaseModel):
    summary: SLASummary
    by_priority: List[SLAPriorityItem]
    by_category: List[SLACategoryItem]
    detailed: List[dict]

class CategoryItem(BaseModel):
    category: str
    total_complaints: int
    open_complaints: int
    resolved_complaints: int
    escalated_complaints: int
    resolution_rate: float
    avg_resolution_hours: Optional[float] = None
    avg_customer_rating: Optional[float] = None

class CategoryAnalysisOut(BaseModel):
    categories: List[CategoryItem]

class AgentItem(BaseModel):
    agent_name: str
    total_assigned: int
    total_resolved: int
    sla_met: int
    sla_breached: int
    resolution_rate: float
    avg_resolution_hours: Optional[float] = None
    avg_customer_rating: Optional[float] = None

class AgentPerformanceOut(BaseModel):
    agents: List[AgentItem]

class TrendItem(BaseModel):
    month: str
    total_complaints: int
    resolved_complaints: int
    sla_breaches: int
    resolution_rate: float
    avg_resolution_hours: Optional[float] = None

class ResolutionTrendsOut(BaseModel):
    trends: List[TrendItem]

class ETLRunResult(BaseModel):
    message: str
    records_extracted: int = 0
    records_transformed: int = 0
    records_loaded: int = 0
    duration_seconds: float = 0.0
