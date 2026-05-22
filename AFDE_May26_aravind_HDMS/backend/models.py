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


class ReportingTicket(Base):
    """Cleaned, ETL-loaded records used exclusively for analytics queries."""

    __tablename__ = "reporting_tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source_ticket_id = Column(Integer, nullable=True, index=True)
    employee_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False, index=True)
    issue_category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)
    priority = Column(String(50), nullable=False, index=True)
    status = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime, nullable=True, index=True)
    resolution_days = Column(Integer, nullable=True)
