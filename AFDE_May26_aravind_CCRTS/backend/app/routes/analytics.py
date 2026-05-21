"""
Phase 2 – Analytics & ETL Routes
Exposes read endpoints for all ETL-generated analytics tables,
plus a POST /run-etl endpoint (admin/supervisor only) that triggers
the ETL pipeline as a subprocess.
"""

import os
import sys
import subprocess
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..models import (
    ETLRunLog, ComplaintAnalytics, SLAAnalytics,
    CategoryAnalytics, AgentPerformanceAnalytics, ResolutionTrendAnalytics,
)
from .. import schemas

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# ── Path to ETL script ────────────────────────────────────────────────────────
_ROUTES_DIR  = os.path.dirname(os.path.abspath(__file__))
_APP_DIR     = os.path.dirname(_ROUTES_DIR)
_BACKEND_DIR = os.path.dirname(_APP_DIR)
_PROJECT_DIR = os.path.dirname(_BACKEND_DIR)
_ETL_SCRIPT  = os.path.join(_PROJECT_DIR, 'etl', 'etl_pipeline.py')


# ── ETL Status ────────────────────────────────────────────────────────────────
@router.get("/etl-status", response_model=schemas.ETLStatusOut)
def get_etl_status(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Return the last ETL run details and total analytics record count."""
    last = db.query(ETLRunLog).order_by(ETLRunLog.run_at.desc()).first()
    total = db.query(ComplaintAnalytics).count()

    if last:
        last_run = schemas.ETLRunLogOut(
            id=last.id,
            run_at=last.run_at.isoformat() if last.run_at else None,
            status=last.status,
            records_extracted=last.records_extracted or 0,
            records_transformed=last.records_transformed or 0,
            records_loaded=last.records_loaded or 0,
            duration_seconds=last.duration_seconds,
            error_message=last.error_message,
        )
    else:
        last_run = schemas.ETLRunLogOut(status="never_run")

    return schemas.ETLStatusOut(last_run=last_run, total_analytics_records=total)


# ── SLA Breach Analytics ──────────────────────────────────────────────────────
@router.get("/sla-breaches", response_model=schemas.SLABreachesOut)
def get_sla_breaches(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """SLA breach breakdown by priority and category."""
    records = db.query(SLAAnalytics).all()
    if not records:
        return schemas.SLABreachesOut(
            summary=schemas.SLASummary(total_complaints=0, total_breached=0,
                                       total_compliant=0, overall_breach_rate=0.0),
            by_priority=[], by_category=[], detailed=[]
        )

    total_c   = sum(r.total_complaints for r in records)
    total_b   = sum(r.sla_breached      for r in records)

    # By priority
    prio: dict = {}
    for r in records:
        p = prio.setdefault(r.priority, {'total': 0, 'breached': 0})
        p['total']   += r.total_complaints
        p['breached'] += r.sla_breached

    by_priority = [
        schemas.SLAPriorityItem(
            priority=k,
            total=v['total'],
            breached=v['breached'],
            compliant=v['total'] - v['breached'],
            breach_rate=round(v['breached'] / v['total'] * 100, 2) if v['total'] else 0.0,
        )
        for k, v in prio.items()
    ]

    # By category
    cat_map: dict = {}
    for r in records:
        c = cat_map.setdefault(r.category, {'total': 0, 'breached': 0})
        c['total']   += r.total_complaints
        c['breached'] += r.sla_breached

    by_category = [
        schemas.SLACategoryItem(
            category=k,
            total=v['total'],
            breached=v['breached'],
            breach_rate=round(v['breached'] / v['total'] * 100, 2) if v['total'] else 0.0,
        )
        for k, v in cat_map.items()
    ]

    detailed = [
        {
            "category": r.category,
            "priority": r.priority,
            "total_complaints": r.total_complaints,
            "sla_breached": r.sla_breached,
            "sla_compliant": r.sla_compliant,
            "breach_rate": r.breach_rate,
            "avg_resolution_hours": r.avg_resolution_hours,
        }
        for r in records
    ]

    return schemas.SLABreachesOut(
        summary=schemas.SLASummary(
            total_complaints=total_c,
            total_breached=total_b,
            total_compliant=total_c - total_b,
            overall_breach_rate=round(total_b / total_c * 100, 2) if total_c else 0.0,
        ),
        by_priority=sorted(by_priority, key=lambda x: ['critical','high','medium','low'].index(x.priority) if x.priority in ['critical','high','medium','low'] else 99),
        by_category=by_category,
        detailed=detailed,
    )


# ── Category Analytics ────────────────────────────────────────────────────────
@router.get("/category-analysis", response_model=schemas.CategoryAnalysisOut)
def get_category_analysis(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Per-category complaint counts and KPIs."""
    records = db.query(CategoryAnalytics).all()
    categories = [
        schemas.CategoryItem(
            category=r.category,
            total_complaints=r.total_complaints,
            open_complaints=r.open_complaints,
            resolved_complaints=r.resolved_complaints,
            escalated_complaints=r.escalated_complaints,
            resolution_rate=round(r.resolved_complaints / r.total_complaints * 100, 2)
                if r.total_complaints else 0.0,
            avg_resolution_hours=r.avg_resolution_hours,
            avg_customer_rating=r.avg_customer_rating,
        )
        for r in records
    ]
    return schemas.CategoryAnalysisOut(
        categories=sorted(categories, key=lambda x: x.total_complaints, reverse=True)
    )


# ── Agent Performance Analytics ───────────────────────────────────────────────
@router.get("/agent-performance", response_model=schemas.AgentPerformanceOut)
def get_agent_performance(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Per-agent resolution and SLA performance metrics."""
    records = db.query(AgentPerformanceAnalytics).all()
    agents = [
        schemas.AgentItem(
            agent_name=r.agent_name,
            total_assigned=r.total_assigned,
            total_resolved=r.total_resolved,
            sla_met=r.sla_met,
            sla_breached=r.sla_breached,
            resolution_rate=r.resolution_rate or 0.0,
            avg_resolution_hours=r.avg_resolution_hours,
            avg_customer_rating=r.avg_customer_rating,
        )
        for r in records
    ]
    return schemas.AgentPerformanceOut(
        agents=sorted(agents, key=lambda x: x.resolution_rate, reverse=True)
    )


# ── Resolution Trend Analytics ────────────────────────────────────────────────
@router.get("/resolution-trends", response_model=schemas.ResolutionTrendsOut)
def get_resolution_trends(
    db: Session = Depends(get_db),
    _current_user=Depends(get_current_user),
):
    """Monthly complaint volume and resolution rate trends."""
    records = (
        db.query(ResolutionTrendAnalytics)
        .order_by(ResolutionTrendAnalytics.month)
        .all()
    )
    trends = [
        schemas.TrendItem(
            month=r.month,
            total_complaints=r.total_complaints,
            resolved_complaints=r.resolved_complaints,
            sla_breaches=r.sla_breaches,
            resolution_rate=r.resolution_rate or 0.0,
            avg_resolution_hours=r.avg_resolution_hours,
        )
        for r in records
    ]
    return schemas.ResolutionTrendsOut(trends=trends)


# ── Run ETL Pipeline ──────────────────────────────────────────────────────────
@router.post("/run-etl", response_model=schemas.ETLRunResult)
def run_etl_pipeline(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Trigger the ETL pipeline (admin / supervisor only)."""
    if current_user.role not in ('admin', 'supervisor'):
        raise HTTPException(status_code=403, detail="Admin or supervisor access required")

    if not os.path.exists(_ETL_SCRIPT):
        raise HTTPException(
            status_code=500,
            detail=f"ETL script not found at {_ETL_SCRIPT}"
        )

    try:
        result = subprocess.run(
            [sys.executable, _ETL_SCRIPT],
            capture_output=True, text=True, timeout=180,
        )
        if result.returncode != 0:
            raise HTTPException(
                status_code=500,
                detail=f"ETL pipeline failed:\n{result.stderr[-2000:]}"
            )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="ETL pipeline timed out (>180s)")

    db.expire_all()
    last = db.query(ETLRunLog).order_by(ETLRunLog.run_at.desc()).first()

    return schemas.ETLRunResult(
        message="ETL pipeline completed successfully",
        records_extracted=last.records_extracted if last else 0,
        records_transformed=last.records_transformed if last else 0,
        records_loaded=last.records_loaded if last else 0,
        duration_seconds=last.duration_seconds if last else 0.0,
    )
