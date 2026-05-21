import pandas as pd
from datetime import datetime


def transform_books(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=["book_id", "title", "author", "category", "isbn"])
    df = df.drop_duplicates(subset=["isbn"])
    df["title"] = df["title"].str.strip()
    df["author"] = df["author"].str.strip()
    df["category"] = df["category"].str.strip()
    return df.reset_index(drop=True)


def transform_borrowers(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=["borrower_id", "borrower_name", "email"])
    df = df.drop_duplicates(subset=["email"])
    df["borrower_name"] = df["borrower_name"].str.strip()
    df["email"] = df["email"].str.lower().str.strip()
    return df.reset_index(drop=True)


def transform_transactions(df: pd.DataFrame, books_df: pd.DataFrame, borrowers_df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=["transaction_id", "book_id", "borrower_id", "borrow_date"])
    df = df.drop_duplicates(subset=["transaction_id"])

    valid_book_ids = set(books_df["book_id"].tolist())
    valid_borrower_ids = set(borrowers_df["borrower_id"].tolist())
    df = df[df["book_id"].isin(valid_book_ids)]
    df = df[df["borrower_id"].isin(valid_borrower_ids)]

    today = pd.Timestamp(datetime.utcnow().date())
    df["is_overdue"] = df["return_date"].isna() & ((today - df["borrow_date"]).dt.days > 30)
    df["days_overdue"] = df.apply(
        lambda r: (today - r["borrow_date"]).days if pd.isna(r["return_date"]) else 0, axis=1
    )
    return df.reset_index(drop=True)


def compute_most_borrowed(transactions_df: pd.DataFrame, books_df: pd.DataFrame) -> pd.DataFrame:
    counts = transactions_df.groupby("book_id").size().reset_index(name="borrow_count")
    result = counts.merge(books_df[["book_id", "title", "author", "category", "isbn"]], on="book_id", how="left")
    return result.sort_values("borrow_count", ascending=False).reset_index(drop=True)


def compute_category_borrowing(transactions_df: pd.DataFrame, books_df: pd.DataFrame) -> pd.DataFrame:
    merged = transactions_df.merge(books_df[["book_id", "category"]], on="book_id", how="left")
    result = merged.groupby("category").size().reset_index(name="borrow_count")
    return result.sort_values("borrow_count", ascending=False).reset_index(drop=True)


def compute_monthly_trends(transactions_df: pd.DataFrame) -> pd.DataFrame:
    df = transactions_df.copy()
    df["year_month"] = df["borrow_date"].dt.to_period("M").astype(str)
    result = df.groupby("year_month").size().reset_index(name="borrow_count")
    return result.sort_values("year_month").reset_index(drop=True)


def compute_overdue(transactions_df: pd.DataFrame, books_df: pd.DataFrame, borrowers_df: pd.DataFrame) -> pd.DataFrame:
    overdue = transactions_df[transactions_df["is_overdue"]].copy()
    overdue = overdue.merge(books_df[["book_id", "title"]], on="book_id", how="left")
    overdue = overdue.merge(borrowers_df[["borrower_id", "borrower_name", "email"]], on="borrower_id", how="left")
    overdue = overdue.rename(columns={"title": "book_title", "email": "borrower_email"})
    overdue["borrow_date_str"] = overdue["borrow_date"].dt.strftime("%Y-%m-%d")
    return overdue[["transaction_id", "book_title", "borrower_name", "borrower_email", "borrow_date_str", "days_overdue"]].reset_index(drop=True)


def transform_all(raw: dict) -> dict:
    books = transform_books(raw["books"])
    borrowers = transform_borrowers(raw["borrowers"])
    transactions = transform_transactions(raw["transactions"], books, borrowers)
    return {
        "books": books,
        "borrowers": borrowers,
        "transactions": transactions,
        "most_borrowed": compute_most_borrowed(transactions, books),
        "category_borrowing": compute_category_borrowing(transactions, books),
        "monthly_trends": compute_monthly_trends(transactions),
        "overdue": compute_overdue(transactions, books, borrowers),
    }
