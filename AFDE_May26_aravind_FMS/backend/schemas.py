from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List


class FeedbackCreate(BaseModel):
    participant_name: str = Field(..., min_length=1, max_length=100)
    program_name: str = Field(..., min_length=1, max_length=200)
    rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None

    @validator("participant_name", "program_name")
    def not_blank(cls, v):
        if not v.strip():
            raise ValueError("Field cannot be blank")
        return v.strip()


class FeedbackUpdate(BaseModel):
    participant_name: Optional[str] = Field(None, min_length=1, max_length=100)
    program_name: Optional[str] = Field(None, min_length=1, max_length=200)
    rating: Optional[int] = Field(None, ge=1, le=5)
    comments: Optional[str] = None


class FeedbackResponse(BaseModel):
    feedback_id: int
    participant_name: str
    program_name: str
    rating: int
    comments: Optional[str]
    submitted_at: datetime

    class Config:
        from_attributes = True


class FeedbackStats(BaseModel):
    total_count: int
    average_rating: float
    recent_feedback: List[FeedbackResponse]


# ─── ETL Schemas ──────────────────────────────────────────────────────────────

class ETLJobResponse(BaseModel):
    job_id: int
    filename: str
    status: str
    total_records: int
    valid_records: int
    duplicate_records: int
    invalid_records: int
    loaded_records: int
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ETLJobSummary(BaseModel):
    job_id: int
    filename: str
    status: str
    total_records: int
    loaded_records: int
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyticsByProgram(BaseModel):
    program_name: str
    total_responses: int
    avg_rating: float
    rating_1_count: int
    rating_2_count: int
    rating_3_count: int
    rating_4_count: int
    rating_5_count: int


class OverallAnalytics(BaseModel):
    total_feedback: int
    average_rating: float
    total_programs: int
    total_etl_jobs: int
    rating_distribution: dict
