"""
ETL Pipeline - Transform Stage
Cleans, validates, and normalizes raw article data extracted from source files.
"""

import re
import pandas as pd

CATEGORY_MAP = {
    'hr policies': 'HR Policies',
    'hr policy': 'HR Policies',
    'hr': 'HR Policies',
    'human resources': 'HR Policies',
    'it support': 'IT Support',
    'it': 'IT Support',
    'information technology': 'IT Support',
    'infrastructure': 'Infrastructure',
    'infra': 'Infrastructure',
    'training materials': 'Training Materials',
    'training': 'Training Materials',
    'learning': 'Training Materials',
    'finance': 'Finance',
    'financial': 'Finance',
    'accounting': 'Finance',
    'operations': 'Operations',
    'ops': 'Operations',
    'operational': 'Operations',
}

VALID_STATUSES = {'draft', 'pending_approval', 'approved', 'rejected', 'archived'}

REQUIRED_COLUMNS = {'title', 'category'}


def transform(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and normalize article data. Returns a clean DataFrame ready for loading."""
    original_count = len(df)
    df = df.copy()

    # ── 1. Drop rows missing required fields ─────────────────────────────────
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            raise ValueError(f"Required column '{col}' missing from dataset")
    df = df[df['title'].str.strip() != '']
    df = df[df['category'].str.strip() != '']
    df = df.dropna(subset=list(REQUIRED_COLUMNS))

    # ── 2. Strip whitespace from all string columns ───────────────────────────
    for col in df.select_dtypes(include='object').columns:
        df[col] = df[col].str.strip()

    # ── 3. Normalize categories ───────────────────────────────────────────────
    df['category_normalized'] = df['category'].apply(_normalize_category)

    # ── 4. Normalize tags (comma-separated, lowercase, alphanumeric+hyphen) ──
    if 'tags' in df.columns:
        df['tags'] = df['tags'].fillna('').apply(_normalize_tags)
    else:
        df['tags'] = ''

    # ── 5. Normalize status ───────────────────────────────────────────────────
    if 'status' in df.columns:
        df['status'] = df['status'].str.lower().apply(
            lambda s: s if s in VALID_STATUSES else 'approved'
        )
    else:
        df['status'] = 'approved'

    # ── 6. Normalize view count ───────────────────────────────────────────────
    if 'views' in df.columns:
        df['views'] = pd.to_numeric(df['views'], errors='coerce').fillna(0).astype(int)
    else:
        df['views'] = 0

    # ── 7. Normalize author email ─────────────────────────────────────────────
    if 'author_email' in df.columns:
        df['author_email'] = df['author_email'].fillna('author@ekbms.com').str.lower()
    else:
        df['author_email'] = 'author@ekbms.com'

    # ── 8. Normalize dates ────────────────────────────────────────────────────
    if 'created_date' in df.columns:
        df['created_date'] = pd.to_datetime(df['created_date'], errors='coerce')
        now_str = pd.Timestamp.now().strftime('%Y-%m-%dT%H:%M:%S.000Z')
        df['created_date'] = df['created_date'].dt.strftime('%Y-%m-%dT%H:%M:%S.000Z').fillna(now_str)
    else:
        df['created_date'] = pd.Timestamp.now().strftime('%Y-%m-%dT%H:%M:%S.000Z')

    # ── 9. Generate content if not supplied ───────────────────────────────────
    if 'content' not in df.columns or df['content'].str.strip().eq('').all():
        df['content'] = '# ' + df['title'] + '\n\n' + df.get('summary', df['title'])
    else:
        mask = df['content'].str.strip() == ''
        df.loc[mask, 'content'] = (
            '# ' + df.loc[mask, 'title'] + '\n\n' + df.loc[mask, 'summary'].fillna('')
        )

    # ── 10. Fill optional summary ─────────────────────────────────────────────
    if 'summary' not in df.columns:
        df['summary'] = df['title']
    else:
        df['summary'] = df['summary'].fillna(df['title'])

    # ── 11. Remove exact title duplicates (keep first) ────────────────────────
    df = df.drop_duplicates(subset=['title'], keep='first')

    cleaned_count = len(df)
    print(f"[TRANSFORM] {cleaned_count} valid records (dropped {original_count - cleaned_count})")
    return df


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize_category(raw: str) -> str:
    key = raw.strip().lower()
    return CATEGORY_MAP.get(key, raw.strip())


def _normalize_tags(raw: str) -> str:
    if not raw or not raw.strip():
        return ''
    tags = [re.sub(r'[^a-z0-9\-]', '', t.strip().lower()) for t in raw.split(',')]
    return ','.join(t for t in tags if t)
