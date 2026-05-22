"""
ETL Pipeline - Load Stage
Inserts transformed articles into the EKBMS SQLite database.
Records each run in the etl_runs table for audit and dashboard visibility.
"""

import os
import uuid
import sqlite3
from datetime import datetime

import pandas as pd

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend', 'database.sqlite')


def load(df: pd.DataFrame, source_file: str = 'knowledge_articles.csv') -> dict:
    """Load a transformed DataFrame into the EKBMS database.

    Returns a dict with keys: run_id, extracted, transformed, loaded, errors.
    """
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(
            f"Database not found at {DB_PATH}.\n"
            "Start the backend server first so it can initialise the database, then re-run the ETL."
        )

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    run_id = str(uuid.uuid4())
    started_at = datetime.now().isoformat()
    records_extracted = len(df)
    records_transformed = 0
    records_loaded = 0
    errors = []

    try:
        # Record run start
        cur.execute(
            "INSERT INTO etl_runs (id, source_file, status, records_extracted, started_at) "
            "VALUES (?, ?, 'running', ?, ?)",
            (run_id, source_file, records_extracted, started_at)
        )
        conn.commit()

        # ── Build lookup maps ─────────────────────────────────────────────────
        cur.execute('SELECT id, name FROM categories')
        cat_map = {r['name'].lower(): r['id'] for r in cur.fetchall()}

        cur.execute('SELECT id, name FROM tags')
        tag_map = {r['name'].lower(): r['id'] for r in cur.fetchall()}

        cur.execute('SELECT id, email FROM users')
        user_map = {r['email'].lower(): r['id'] for r in cur.fetchall()}

        default_author_id = (
            user_map.get('author@ekbms.com')
            or (list(user_map.values())[0] if user_map else None)
        )

        # ── Process each row ──────────────────────────────────────────────────
        for _, row in df.iterrows():
            try:
                title = str(row['title']).strip()
                if not title:
                    continue

                # Skip duplicates already in the database
                cur.execute('SELECT id FROM articles WHERE LOWER(title) = LOWER(?)', (title,))
                if cur.fetchone():
                    errors.append(f'Duplicate skipped: "{title}"')
                    continue

                # Resolve category
                cat_name = str(row.get('category_normalized', row.get('category', ''))).strip()
                category_id = cat_map.get(cat_name.lower())

                # Resolve author
                author_email = str(row.get('author_email', '')).lower().strip()
                author_id = user_map.get(author_email, default_author_id)
                if not author_id:
                    errors.append(f'No matching author for "{title}" — skipped')
                    continue

                records_transformed += 1

                article_id = str(uuid.uuid4())
                content = str(row.get('content', f'# {title}'))
                summary = str(row.get('summary', title))
                status = str(row.get('status', 'approved'))
                views = int(row.get('views', 0))
                created_at = str(row.get('created_date', datetime.now().isoformat()))

                cur.execute(
                    '''INSERT INTO articles
                       (id, title, content, summary, category_id, author_id,
                        status, view_count, created_at, updated_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                    (article_id, title, content, summary,
                     category_id, author_id, status, views,
                     created_at, created_at)
                )

                # Insert tags
                tags_raw = str(row.get('tags', ''))
                for tag_name in (t for t in tags_raw.split(',') if t.strip()):
                    tag_key = tag_name.strip().lower()
                    tag_id = tag_map.get(tag_key)
                    if not tag_id:
                        tag_id = str(uuid.uuid4())
                        cur.execute(
                            'INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)',
                            (tag_id, tag_key)
                        )
                        tag_map[tag_key] = tag_id
                    cur.execute(
                        'INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
                        (article_id, tag_id)
                    )

                records_loaded += 1

            except Exception as row_err:
                errors.append(f'Error on "{row.get("title", "?")}": {row_err}')

        conn.commit()

        # ── Update run record ─────────────────────────────────────────────────
        error_msg = '; '.join(errors[:5]) if errors else None
        cur.execute(
            '''UPDATE etl_runs
               SET status = 'completed', records_transformed = ?,
                   records_loaded = ?, error_message = ?, completed_at = ?
               WHERE id = ?''',
            (records_transformed, records_loaded, error_msg, datetime.now().isoformat(), run_id)
        )
        conn.commit()

        print(
            f"[LOAD] Extracted: {records_extracted} | "
            f"Transformed: {records_transformed} | Loaded: {records_loaded}"
        )
        if errors:
            print(f"[LOAD] {len(errors)} record(s) skipped/errored")

        return {
            'run_id': run_id,
            'extracted': records_extracted,
            'transformed': records_transformed,
            'loaded': records_loaded,
            'errors': errors,
        }

    except Exception as exc:
        conn.rollback()
        try:
            cur.execute(
                "UPDATE etl_runs SET status = 'failed', error_message = ?, completed_at = ? WHERE id = ?",
                (str(exc), datetime.now().isoformat(), run_id)
            )
            conn.commit()
        except Exception:
            pass
        raise

    finally:
        conn.close()
