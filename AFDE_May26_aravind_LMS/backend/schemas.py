from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class BookBase(BaseModel):
    title: str
    author: str
    category: str
    isbn: str
    availability_status: str = "available"

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    isbn: Optional[str] = None
    availability_status: Optional[str] = None

class BookResponse(BookBase):
    book_id: int
    class Config:
        from_attributes = True

class BorrowerBase(BaseModel):
    borrower_name: str
    email: str
    phone: str

class BorrowerCreate(BorrowerBase):
    pass

class BorrowerUpdate(BaseModel):
    borrower_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class BorrowerResponse(BorrowerBase):
    borrower_id: int
    class Config:
        from_attributes = True

class BorrowRequest(BaseModel):
    book_id: int
    borrower_id: int

class ReturnRequest(BaseModel):
    transaction_id: int

class TransactionResponse(BaseModel):
    transaction_id: int
    book_id: int
    borrower_id: int
    borrow_date: datetime
    return_date: Optional[datetime] = None
    book: BookResponse
    borrower: BorrowerResponse
    class Config:
        from_attributes = True


class MostBorrowedResponse(BaseModel):
    id: int
    book_title: str
    author: Optional[str] = None
    category: Optional[str] = None
    isbn: Optional[str] = None
    borrow_count: int
    class Config:
        from_attributes = True


class CategoryBorrowingResponse(BaseModel):
    id: int
    category: str
    borrow_count: int
    class Config:
        from_attributes = True


class MonthlyTrendResponse(BaseModel):
    id: int
    year_month: str
    borrow_count: int
    class Config:
        from_attributes = True


class OverdueResponse(BaseModel):
    id: int
    transaction_id: int
    book_title: Optional[str] = None
    borrower_name: Optional[str] = None
    borrower_email: Optional[str] = None
    borrow_date: Optional[str] = None
    days_overdue: int
    class Config:
        from_attributes = True


class ETLStatusResponse(BaseModel):
    etl_run: bool
    most_borrowed_count: int
    category_count: int
    monthly_trend_count: int
    overdue_count: int
    last_run_at: Optional[str] = None
