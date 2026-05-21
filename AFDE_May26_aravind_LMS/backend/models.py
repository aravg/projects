from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Book(Base):
    __tablename__ = "books"
    book_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    category = Column(String, nullable=False)
    isbn = Column(String, unique=True, nullable=False)
    availability_status = Column(String, default="available")
    transactions = relationship("Transaction", back_populates="book")

class Borrower(Base):
    __tablename__ = "borrowers"
    borrower_id = Column(Integer, primary_key=True, index=True)
    borrower_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)
    transactions = relationship("Transaction", back_populates="borrower")

class Transaction(Base):
    __tablename__ = "transactions"
    transaction_id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.book_id"), nullable=False)
    borrower_id = Column(Integer, ForeignKey("borrowers.borrower_id"), nullable=False)
    borrow_date = Column(DateTime, server_default=func.now())
    return_date = Column(DateTime, nullable=True)
    book = relationship("Book", back_populates="transactions")
    borrower = relationship("Borrower", back_populates="transactions")


class AnalyticsMostBorrowed(Base):
    __tablename__ = "analytics_most_borrowed"
    id = Column(Integer, primary_key=True, index=True)
    book_title = Column(String, nullable=False)
    author = Column(String)
    category = Column(String)
    isbn = Column(String)
    borrow_count = Column(Integer, default=0)
    etl_run_at = Column(DateTime)


class AnalyticsCategoryBorrowing(Base):
    __tablename__ = "analytics_category_borrowing"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)
    borrow_count = Column(Integer, default=0)
    etl_run_at = Column(DateTime)


class AnalyticsMonthlyTrend(Base):
    __tablename__ = "analytics_monthly_trends"
    id = Column(Integer, primary_key=True, index=True)
    year_month = Column(String, nullable=False)
    borrow_count = Column(Integer, default=0)
    etl_run_at = Column(DateTime)


class AnalyticsOverdue(Base):
    __tablename__ = "analytics_overdue"
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer)
    book_title = Column(String)
    borrower_name = Column(String)
    borrower_email = Column(String)
    borrow_date = Column(String)
    days_overdue = Column(Integer, default=0)
    etl_run_at = Column(DateTime)
