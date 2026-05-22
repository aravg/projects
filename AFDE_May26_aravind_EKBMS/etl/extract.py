"""
ETL Pipeline - Extract Stage
Reads article datasets from CSV or JSON files in the datasets/ folder.
"""

import os
import json
import pandas as pd

DATASETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'datasets')


def extract_csv(filename='knowledge_articles.csv'):
    """Extract article data from a CSV file."""
    filepath = os.path.join(DATASETS_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found: {filepath}")

    df = pd.read_csv(filepath, dtype=str, keep_default_na=False)
    print(f"[EXTRACT] Read {len(df)} records from {filename}")
    return df


def extract_json(filename='knowledge_articles.json'):
    """Extract article data from a JSON file."""
    filepath = os.path.join(DATASETS_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found: {filepath}")

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    df = pd.DataFrame(data if isinstance(data, list) else data.get('articles', []))
    df = df.astype(str).replace('nan', '')
    print(f"[EXTRACT] Read {len(df)} records from {filename}")
    return df


def extract(filename=None):
    """Auto-detect format and extract from the given file (default: knowledge_articles.csv)."""
    if filename is None:
        filename = 'knowledge_articles.csv'

    if filename.endswith('.json'):
        return extract_json(filename)
    return extract_csv(filename)
