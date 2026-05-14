from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud, schemas
from database import get_db

router = APIRouter(tags=["Transactions"])

@router.post("/borrow", response_model=schemas.TransactionResponse, status_code=201)
def borrow_book(borrow_req: schemas.BorrowRequest, db: Session = Depends(get_db)):
    transaction, error = crud.borrow_book(db, borrow_req)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return transaction

@router.post("/return", response_model=schemas.TransactionResponse)
def return_book(return_req: schemas.ReturnRequest, db: Session = Depends(get_db)):
    transaction, error = crud.return_book(db, return_req)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return transaction

@router.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_transactions(db, skip=skip, limit=limit)
