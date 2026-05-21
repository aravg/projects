from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    ticket_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    issue_category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(50), nullable=False, default="Medium")
    status = Column(String(50), nullable=False, default="Open")
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True)
