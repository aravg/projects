"""
EKBMS ETL Pipeline - Phase 2
Orchestrates the Extract → Transform → Load stages for bulk article import.

Usage:
    python etl_pipeline.py                         # uses knowledge_articles.csv
    python etl_pipeline.py my_articles.csv         # custom CSV file
    python etl_pipeline.py my_articles.json        # JSON file

Prerequisites:
    pip install -r requirements.txt
    The backend server must have been started at least once to initialise the database.
"""

import sys
import os

# Allow running from any directory
sys.path.insert(0, os.path.dirname(__file__))

from extract import extract
from transform import transform
from load import load


def run_pipeline(source_file: str = 'knowledge_articles.csv') -> dict:
    """Execute the full ETL pipeline and return a summary dict."""
    separator = '=' * 55
    print(separator)
    print('  EKBMS ETL Pipeline  —  Phase 2')
    print(separator)

    print('\n[STEP 1/3] EXTRACT')
    df_raw = extract(source_file)

    print('\n[STEP 2/3] TRANSFORM')
    df_clean = transform(df_raw)

    print('\n[STEP 3/3] LOAD')
    result = load(df_clean, source_file)

    print('\n' + separator)
    print('  ETL Pipeline Complete')
    print(f"  Source file   : {source_file}")
    print(f"  Extracted     : {result['extracted']:>6} records")
    print(f"  Transformed   : {result['transformed']:>6} records")
    print(f"  Loaded        : {result['loaded']:>6} records")
    skipped = result['extracted'] - result['loaded']
    print(f"  Skipped/Errors: {skipped:>6} records")
    print(separator)

    if result['errors']:
        print('\n  First 5 skip/error messages:')
        for msg in result['errors'][:5]:
            print(f"    • {msg}")

    return result


if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else 'knowledge_articles.csv'
    run_pipeline(src)
