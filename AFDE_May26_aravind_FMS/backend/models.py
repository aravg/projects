from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    participant_name = Column(String(100), nullable=False)
    program_name = Column(String(200), nullable=False)
    rating = Column(Integer, nullable=False)
    comments = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


class ETLJob(Base):
    __tablename__ = "etl_jobs"

    job_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    total_records = Column(Integer, default=0)
    valid_records = Column(Integer, default=0)
    duplicate_records = Column(Integer, default=0)
    invalid_records = Column(Integer, default=0)
    loaded_records = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)


class FeedbackAnalytics(Base):
    __tablename__ = "feedback_analytics"

    analytics_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    job_id = Column(Integer, ForeignKey("etl_jobs.job_id"), nullable=False)
    program_name = Column(String(200), nullable=False)
    avg_rating = Column(Float, nullable=False)
    total_responses = Column(Integer, nullable=False)
    rating_1_count = Column(Integer, default=0)
    rating_2_count = Column(Integer, default=0)
    rating_3_count = Column(Integer, default=0)
    rating_4_count = Column(Integer, default=0)
    rating_5_count = Column(Integer, default=0)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
