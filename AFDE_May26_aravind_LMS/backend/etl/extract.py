import pandas as pd
from pathlib import Path

DATASETS_DIR = Path(__file__).parent.parent.parent / "datasets"


def extract_books() -> pd.DataFrame:
    return pd.read_csv(DATASETS_DIR / "books.csv")


def extract_borrowers() -> pd.DataFrame:
    return pd.read_csv(DATASETS_DIR / "borrowers.csv")


def extract_transactions() -> pd.DataFrame:
    return pd.read_csv(DATASETS_DIR / "transactions.csv", parse_dates=["borrow_date", "return_date"])


def extract_all() -> dict:
    return {
        "books": extract_books(),
        "borrowers": extract_borrowers(),
        "transactions": extract_transactions(),
    }
