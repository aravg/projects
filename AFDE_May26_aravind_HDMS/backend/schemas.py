from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


class TicketCreate(BaseModel):
    employee_name: str = Field(..., min_length=1, max_length=100)
    department: str = Field(..., min_length=1, max_length=100)
    issue_category: str = Field(..., min_length=1)
    description: str = Field(..., min_length=5)
    priority: str = "Medium"


class TicketUpdate(BaseModel):
    employee_name: Optional[str] = None
    department: Optional[str] = None
    issue_category: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    resolution_notes: Optional[str] = None


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ticket_id: int
    employee_name: str
    department: str
    issue_category: str
    description: str
    priority: str
    status: str
    resolution_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
