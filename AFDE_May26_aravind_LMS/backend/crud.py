from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
import models, schemas
from datetime import datetime

def get_books(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Book).offset(skip).limit(limit).all()

def get_book(db: Session, book_id: int):
    return db.query(models.Book).filter(models.Book.book_id == book_id).first()

def create_book(db: Session, book: schemas.BookCreate):
    db_book = models.Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

def update_book(db: Session, book_id: int, book: schemas.BookUpdate):
    db_book = db.query(models.Book).filter(models.Book.book_id == book_id).first()
    if not db_book:
        return None
    update_data = book.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_book, key, value)
    db.commit()
    db.refresh(db_book)
    return db_book

def delete_book(db: Session, book_id: int):
    db_book = db.query(models.Book).filter(models.Book.book_id == book_id).first()
    if not db_book:
        return None
    db.delete(db_book)
    db.commit()
    return db_book

def get_borrowers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Borrower).offset(skip).limit(limit).all()

def get_borrower(db: Session, borrower_id: int):
    return db.query(models.Borrower).filter(models.Borrower.borrower_id == borrower_id).first()

def create_borrower(db: Session, borrower: schemas.BorrowerCreate):
    db_borrower = models.Borrower(**borrower.model_dump())
    db.add(db_borrower)
    db.commit()
    db.refresh(db_borrower)
    return db_borrower

def update_borrower(db: Session, borrower_id: int, borrower: schemas.BorrowerUpdate):
    db_borrower = db.query(models.Borrower).filter(models.Borrower.borrower_id == borrower_id).first()
    if not db_borrower:
        return None
    update_data = borrower.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_borrower, key, value)
    db.commit()
    db.refresh(db_borrower)
    return db_borrower

def delete_borrower(db: Session, borrower_id: int):
    db_borrower = db.query(models.Borrower).filter(models.Borrower.borrower_id == borrower_id).first()
    if not db_borrower:
        return None
    db.delete(db_borrower)
    db.commit()
    return db_borrower

def get_transactions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Transaction).offset(skip).limit(limit).all()

def borrow_book(db: Session, borrow_req: schemas.BorrowRequest):
    book = db.query(models.Book).filter(models.Book.book_id == borrow_req.book_id).first()
    if not book or book.availability_status != "available":
        return None, "Book not available"
    borrower = db.query(models.Borrower).filter(models.Borrower.borrower_id == borrow_req.borrower_id).first()
    if not borrower:
        return None, "Borrower not found"
    transaction = models.Transaction(
        book_id=borrow_req.book_id,
        borrower_id=borrow_req.borrower_id,
        borrow_date=datetime.utcnow()
    )
    book.availability_status = "borrowed"
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction, None

def return_book(db: Session, return_req: schemas.ReturnRequest):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.transaction_id == return_req.transaction_id,
        models.Transaction.return_date == None
    ).first()
    if not transaction:
        return None, "Active transaction not found"
    transaction.return_date = datetime.utcnow()
    book = db.query(models.Book).filter(models.Book.book_id == transaction.book_id).first()
    if book:
        book.availability_status = "available"
    db.commit()
    db.refresh(transaction)
    return transaction, None

def search_books(db: Session, query: str, category: str = None, author: str = None):
    q = db.query(models.Book)
    if query:
        q = q.filter(or_(
            models.Book.title.ilike(f"%{query}%"),
            models.Book.author.ilike(f"%{query}%"),
            models.Book.category.ilike(f"%{query}%"),
            models.Book.isbn.ilike(f"%{query}%")
        ))
    if category:
        q = q.filter(models.Book.category.ilike(f"%{category}%"))
    if author:
        q = q.filter(models.Book.author.ilike(f"%{author}%"))
    return q.all()

def get_dashboard_stats(db: Session):
    total_books = db.query(models.Book).count()
    available_books = db.query(models.Book).filter(models.Book.availability_status == "available").count()
    borrowed_books = db.query(models.Book).filter(models.Book.availability_status == "borrowed").count()
    total_borrowers = db.query(models.Borrower).count()
    recent_transactions = db.query(models.Transaction).options(
        joinedload(models.Transaction.book),
        joinedload(models.Transaction.borrower)
    ).order_by(models.Transaction.transaction_id.desc()).limit(5).all()

    txn_list = []
    for tx in recent_transactions:
        txn_list.append({
            "transaction_id": tx.transaction_id,
            "book_id": tx.book_id,
            "borrower_id": tx.borrower_id,
            "borrow_date": tx.borrow_date,
            "return_date": tx.return_date,
            "book": {
                "book_id": tx.book.book_id,
                "title": tx.book.title,
                "author": tx.book.author,
                "category": tx.book.category,
                "isbn": tx.book.isbn,
                "availability_status": tx.book.availability_status,
            } if tx.book else None,
            "borrower": {
                "borrower_id": tx.borrower.borrower_id,
                "borrower_name": tx.borrower.borrower_name,
                "email": tx.borrower.email,
                "phone": tx.borrower.phone,
            } if tx.borrower else None,
        })

    return {
        "total_books": total_books,
        "available_books": available_books,
        "borrowed_books": borrowed_books,
        "total_borrowers": total_borrowers,
        "recent_transactions": txn_list,
    }
