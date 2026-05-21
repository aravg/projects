"""
CCRTS ETL Pipeline - Phase 2
Extracts complaint data from CSV, transforms it with Pandas, and loads analytics
into the SQLite database used by the FastAPI backend.

Usage:
    python etl_pipeline.py
    python etl_pipeline.py --dataset path/to/dataset.csv --db path/to/ccrts.db
"""

import pandas as pd
import sqlite3
import os
import sys
import logging
import time
import argparse
from datetime import datetime

# ── Logging ──────────────────────────────────────────────────────────────────
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'etl.log')
_fmt = '%(asctime)s [%(levelname)s] %(message)s'
_stream_handler = logging.StreamHandler(sys.stdout)
_stream_handler.stream = open(sys.stdout.fileno(), mode='w', encoding='utf-8', buffering=1, closefd=False)
_stream_handler.setFormatter(logging.Formatter(_fmt))
logging.basicConfig(
    level=logging.INFO,
    format=_fmt,
    handlers=[
        _stream_handler,
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
    ]
)
logger = logging.getLogger('ccrts_etl')

# ── Default Paths ─────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_DATASET = os.path.join(_BASE, 'datasets', 'complaints_dataset.csv')
DEFAULT_DB      = os.path.join(_BASE, 'backend', 'ccrts.db')

SLA_HOURS = {'critical': 4, 'high': 24, 'medium': 48, 'low': 72}


# ══════════════════════════════════════════════════════════════════════════════
# EXTRACT
# ══════════════════════════════════════════════════════════════════════════════
def extract(filepath: str = DEFAULT_DATASET) -> pd.DataFrame:
    """Read raw complaint records from a CSV (or Excel) file."""
    logger.info("── EXTRACT ──────────────────────────────────────")
    logger.info(f"Source: {filepath}")

    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found: {filepath}")

    ext = os.path.splitext(filepath)[1].lower()
    if ext in ('.xlsx', '.xls'):
        df = pd.read_excel(filepath)
    else:
        df = pd.read_csv(filepath, encoding='utf-8')

    logger.info(f"Extracted {len(df):,} records | {len(df.columns)} columns")
    logger.info(f"Columns : {list(df.columns)}")
    return df


# ══════════════════════════════════════════════════════════════════════════════
# TRANSFORM
# ══════════════════════════════════════════════════════════════════════════════
def transform(df: pd.DataFrame):
    """
    Clean and enrich raw records, then derive four analytics DataFrames:
      - sla_analytics          (category × priority breakdown)
      - category_analytics     (per-category KPIs)
      - agent_analytics        (per-agent performance)
      - trend_analytics        (monthly complaint trends)
    """
    logger.info("── TRANSFORM ────────────────────────────────────")
    df = df.copy()

    # 1. Normalise text fields
    df['priority'] = df['priority'].astype(str).str.strip().str.lower()
    df['status']   = df['status'].astype(str).str.strip().str.lower().str.replace(' ', '_')
    df['category'] = df['category'].astype(str).str.strip()
    df['assigned_agent'] = df['assigned_agent'].fillna('Unassigned').replace('', 'Unassigned')
    df['region']   = df['region'].fillna('Unknown').replace('', 'Unknown')

    # 2. Validate priority
    valid = set(SLA_HOURS.keys())
    bad = ~df['priority'].isin(valid)
    if bad.any():
        logger.warning(f"  {bad.sum()} record(s) with unknown priority → defaulting to 'medium'")
        df.loc[bad, 'priority'] = 'medium'

    # 3. Parse dates
    df['created_at']  = pd.to_datetime(df['created_at'],  errors='coerce')
    df['resolved_at'] = pd.to_datetime(df['resolved_at'], errors='coerce')

    null_created = df['created_at'].isna().sum()
    if null_created:
        logger.warning(f"  Dropping {null_created} record(s) with unparseable created_at")
        df = df.dropna(subset=['created_at']).copy()

    # 4. SLA hour limits
    df['sla_hours_limit'] = df['priority'].map(SLA_HOURS)

    # 5. Resolution time (hours)
    resolved_mask = df['resolved_at'].notna()
    df['resolution_time_hours'] = None
    if resolved_mask.any():
        df.loc[resolved_mask, 'resolution_time_hours'] = (
            (df.loc[resolved_mask, 'resolved_at'] - df.loc[resolved_mask, 'created_at'])
            .dt.total_seconds() / 3600
        ).round(2)

    # 6. SLA breach flag
    def _sla_breached(row):
        if row['status'] in ('resolved', 'closed'):
            rt = row['resolution_time_hours']
            sl = row['sla_hours_limit']
            if rt is not None and sl is not None and not pd.isna(rt):
                return bool(rt > sl)
        return False

    df['is_sla_breached'] = df.apply(_sla_breached, axis=1)

    # 7. Customer rating: numeric, clamp to 1-5
    df['customer_rating'] = pd.to_numeric(df['customer_rating'], errors='coerce')
    df.loc[df['customer_rating'] < 1, 'customer_rating'] = pd.NA
    df.loc[df['customer_rating'] > 5, 'customer_rating'] = pd.NA

    # 8. Month column for trend grouping
    df['month'] = df['created_at'].dt.strftime('%Y-%m')

    logger.info(f"  Clean records  : {len(df):,}")
    logger.info(f"  SLA breaches   : {int(df['is_sla_breached'].sum())}")
    logger.info(f"  Resolved/Closed: {int(df['status'].isin(['resolved','closed']).sum())}")
    logger.info(f"  Categories     : {df['category'].nunique()}")

    # ── Analytics: SLA by category × priority ────────────────────────────────
    logger.info("  Building SLA analytics...")
    sla = df.groupby(['category', 'priority']).agg(
        total_complaints=('complaint_id', 'count'),
        sla_breached=('is_sla_breached', lambda x: int(x.sum())),
        avg_resolution_hours=('resolution_time_hours', 'mean'),
    ).reset_index()
    sla['sla_compliant'] = sla['total_complaints'] - sla['sla_breached']
    sla['breach_rate']   = (sla['sla_breached'] / sla['total_complaints'] * 100).round(2)
    sla['avg_resolution_hours'] = sla['avg_resolution_hours'].round(2)

    # ── Analytics: Category KPIs ──────────────────────────────────────────────
    logger.info("  Building category analytics...")
    cat = df.groupby('category').agg(
        total_complaints=('complaint_id', 'count'),
        open_complaints=('status', lambda x: int((x == 'open').sum())),
        resolved_complaints=('status', lambda x: int(x.isin(['resolved', 'closed']).sum())),
        escalated_complaints=('status', lambda x: int((x == 'escalated').sum())),
        avg_resolution_hours=('resolution_time_hours',
                              lambda x: round(float(x.mean()), 2) if x.notna().any() else None),
        avg_customer_rating=('customer_rating',
                             lambda x: round(float(x.mean()), 2) if x.notna().any() else None),
    ).reset_index()

    # ── Analytics: Agent performance ─────────────────────────────────────────
    logger.info("  Building agent performance analytics...")
    assigned = df[df['assigned_agent'] != 'Unassigned']
    if len(assigned):
        agt = assigned.groupby('assigned_agent').agg(
            total_assigned=('complaint_id', 'count'),
            total_resolved=('status', lambda x: int(x.isin(['resolved', 'closed']).sum())),
            sla_met=('is_sla_breached', lambda x: int((~x).sum())),
            sla_breached_count=('is_sla_breached', lambda x: int(x.sum())),
            avg_resolution_hours=('resolution_time_hours',
                                  lambda x: round(float(x.mean()), 2) if x.notna().any() else None),
            avg_customer_rating=('customer_rating',
                                 lambda x: round(float(x.mean()), 2) if x.notna().any() else None),
        ).reset_index()
        agt.columns = ['agent_name', 'total_assigned', 'total_resolved', 'sla_met',
                       'sla_breached', 'avg_resolution_hours', 'avg_customer_rating']
        agt['resolution_rate'] = (agt['total_resolved'] / agt['total_assigned'] * 100).round(2)
    else:
        agt = pd.DataFrame(columns=[
            'agent_name', 'total_assigned', 'total_resolved', 'sla_met',
            'sla_breached', 'avg_resolution_hours', 'avg_customer_rating', 'resolution_rate'
        ])

    # ── Analytics: Monthly resolution trends ─────────────────────────────────
    logger.info("  Building resolution trend analytics...")
    trn = df.groupby('month').agg(
        total_complaints=('complaint_id', 'count'),
        resolved_complaints=('status', lambda x: int(x.isin(['resolved', 'closed']).sum())),
        sla_breaches=('is_sla_breached', lambda x: int(x.sum())),
        avg_resolution_hours=('resolution_time_hours',
                              lambda x: round(float(x.mean()), 2) if x.notna().any() else None),
    ).reset_index().sort_values('month')
    trn['resolution_rate'] = (trn['resolved_complaints'] / trn['total_complaints'] * 100).round(2)

    logger.info("  All analytics DataFrames ready")
    return df, sla, cat, agt, trn


# ══════════════════════════════════════════════════════════════════════════════
# LOAD
# ══════════════════════════════════════════════════════════════════════════════
def load(df, sla, cat, agt, trn, db_path: str = DEFAULT_DB) -> int:
    """Write all transformed DataFrames into the SQLite analytics tables."""
    logger.info("── LOAD ─────────────────────────────────────────")
    logger.info(f"Target DB: {db_path}")

    if not os.path.exists(db_path):
        raise FileNotFoundError(
            f"Database not found at {db_path}.\n"
            "Start the backend first (start-all.bat) so the DB is initialised, then run ETL."
        )

    conn = sqlite3.connect(db_path)
    ts   = datetime.now().isoformat()

    def _reload(table: str, frame: pd.DataFrame):
        """Truncate the SQLAlchemy-managed table then append rows (preserves schema/id column)."""
        conn.execute(f"DELETE FROM {table}")
        frame.to_sql(table, conn, if_exists='append', index=False)
        logger.info(f"  {table:<35}: {len(frame):,} rows")

    try:
        # complaint_analytics
        cols = ['complaint_id', 'complaint_number', 'customer_name', 'category', 'priority',
                'status', 'sla_hours_limit', 'resolution_time_hours', 'is_sla_breached',
                'customer_rating', 'region', 'assigned_agent', 'created_at', 'resolved_at']
        avail = [c for c in cols if c in df.columns]
        cdf = df[avail].copy()
        cdf.rename(columns={'complaint_id': 'source_complaint_id'}, inplace=True)
        cdf['etl_loaded_at'] = ts
        for col in ('created_at', 'resolved_at'):
            if col in cdf.columns:
                cdf[col] = cdf[col].astype(str).replace('NaT', '')

        _reload('complaint_analytics',       cdf)
        _reload('sla_analytics',             sla.assign(etl_loaded_at=ts))
        _reload('category_analytics',        cat.assign(etl_loaded_at=ts))
        _reload('agent_performance_analytics', agt.assign(etl_loaded_at=ts))
        _reload('resolution_trend_analytics', trn.assign(etl_loaded_at=ts))

        conn.commit()
        logger.info("  All tables committed OK")
        return len(cdf)

    finally:
        conn.close()


# ══════════════════════════════════════════════════════════════════════════════
# ETL RUN LOG helper
# ══════════════════════════════════════════════════════════════════════════════
def _log_run(db_path, status, extracted=0, transformed=0, loaded=0,
             duration=0.0, error=None):
    try:
        conn = sqlite3.connect(db_path)
        conn.execute(
            "INSERT INTO etl_run_log "
            "(run_at, status, records_extracted, records_transformed, records_loaded, "
            "duration_seconds, error_message) VALUES (?,?,?,?,?,?,?)",
            (datetime.now().isoformat(), status, extracted, transformed, loaded,
             round(duration, 2), error)
        )
        conn.commit()
        conn.close()
    except Exception as exc:
        logger.warning(f"Could not write etl_run_log: {exc}")


# ══════════════════════════════════════════════════════════════════════════════
# ORCHESTRATOR
# ══════════════════════════════════════════════════════════════════════════════
def run_etl(dataset_path: str = DEFAULT_DATASET, db_path: str = DEFAULT_DB) -> dict:
    """Run the full Extract → Transform → Load pipeline."""
    logger.info("=" * 55)
    logger.info("CCRTS ETL Pipeline  –  Phase 2")
    logger.info("=" * 55)

    t0 = time.time()
    extracted = transformed = loaded = 0

    try:
        df_raw            = extract(dataset_path)
        extracted         = len(df_raw)

        df_clean, sla, cat, agt, trn = transform(df_raw)
        transformed       = len(df_clean)

        loaded            = load(df_clean, sla, cat, agt, trn, db_path)
        duration          = time.time() - t0

        _log_run(db_path, 'success', extracted, transformed, loaded, duration)

        logger.info("=" * 55)
        logger.info("Pipeline completed successfully")
        logger.info(f"  Extracted  : {extracted:,}")
        logger.info(f"  Transformed: {transformed:,}")
        logger.info(f"  Loaded     : {loaded:,}")
        logger.info(f"  Duration   : {duration:.2f}s")
        logger.info("=" * 55)

        return {
            "status": "success",
            "records_extracted": extracted,
            "records_transformed": transformed,
            "records_loaded": loaded,
            "duration_seconds": round(duration, 2),
        }

    except Exception as exc:
        duration = time.time() - t0
        logger.error(f"Pipeline FAILED: {exc}")
        _log_run(db_path, 'failed', extracted, transformed, loaded, duration, str(exc))
        raise


# ══════════════════════════════════════════════════════════════════════════════
# CLI entry point
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='CCRTS ETL Pipeline')
    parser.add_argument('--dataset', default=DEFAULT_DATASET, help='Path to CSV/Excel dataset')
    parser.add_argument('--db',      default=DEFAULT_DB,      help='Path to SQLite database')
    args = parser.parse_args()
    run_etl(args.dataset, args.db)
