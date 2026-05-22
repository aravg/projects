import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Play, FileText, CheckCircle2, AlertTriangle, Info,
  BarChart2, ArrowRight, Database, Loader2,
} from 'lucide-react'
import { analyticsService } from '../services/analyticsService'

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  )
}

function StageCard({ step, title, description, status }) {
  const colors = {
    done: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    pending: 'bg-slate-50 border-slate-200 text-slate-400',
    active: 'bg-indigo-50 border-indigo-200 text-indigo-600',
  }
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${colors[status]}`}>
      <div className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
        {status === 'done' ? <CheckCircle2 size={14} /> : step}
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs opacity-70 mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export default function EtlManager() {
  const [datasetInfo, setDatasetInfo] = useState(null)
  const [runResult, setRunResult] = useState(null)
  const [running, setRunning] = useState(false)
  const [loadingInfo, setLoadingInfo] = useState(true)

  useEffect(() => {
    analyticsService.getDatasetInfo()
      .then((r) => setDatasetInfo(r.data))
      .catch(() => setDatasetInfo(null))
      .finally(() => setLoadingInfo(false))
  }, [])

  const handleRun = async () => {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await analyticsService.runEtl()
      setRunResult({ type: 'success', data: res.data })
      toast.success(`ETL complete — ${res.data.loaded} records loaded`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'ETL pipeline failed'
      setRunResult({ type: 'error', message: msg })
      toast.error(msg)
    } finally {
      setRunning(false)
    }
  }

  const stageStatus = (stage) => {
    if (!runResult) return 'pending'
    if (runResult.type === 'error') return stage === 'extract' ? 'active' : 'pending'
    return 'done'
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="page-header mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ETL Manager</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Import and clean historical ticket data for analytics
          </p>
        </div>
        <Link to="/analytics" className="btn-secondary">
          <BarChart2 size={15} />
          View Analytics
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Dataset info + Run */}
        <div className="space-y-5">
          {/* Dataset Card */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <FileText size={18} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 text-base">Dataset</h2>
                <p className="text-xs text-slate-400">datasets/tickets_historical.csv</p>
              </div>
            </div>

            {loadingInfo ? (
              <p className="text-sm text-slate-400">Checking dataset...</p>
            ) : datasetInfo?.exists ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span className="text-sm text-emerald-700 font-medium">Dataset found</span>
                </div>
                <InfoRow label="Raw rows" value={datasetInfo.row_count_raw?.toLocaleString() ?? '—'} highlight />
                <InfoRow label="File size" value={`${Math.round(datasetInfo.size_bytes / 1024)} KB`} />
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-700">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Dataset not found. Run{' '}
                  <code className="bg-amber-100 px-1 rounded text-xs">datasets/generate_dataset.py</code>{' '}
                  first.
                </p>
              </div>
            )}
          </div>

          {/* Run ETL */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center">
                <Database size={18} className="text-violet-600" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 text-base">Run Pipeline</h2>
                <p className="text-xs text-slate-400">Extract → Transform → Load</p>
              </div>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Reads the CSV dataset, deduplicates and normalises records, then loads cleaned
              data into the reporting database powering the analytics charts.
            </p>

            <button
              onClick={handleRun}
              disabled={running || !datasetInfo?.exists}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Running pipeline…
                </>
              ) : (
                <>
                  <Play size={16} />
                  Run ETL Pipeline
                </>
              )}
            </button>

            {!datasetInfo?.exists && (
              <p className="text-xs text-slate-400 text-center mt-2">
                Dataset must be present to run the pipeline
              </p>
            )}
          </div>
        </div>

        {/* Right: ETL stages + result */}
        <div className="space-y-5">
          {/* Pipeline stages */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Info size={18} className="text-slate-500" />
              </div>
              <h2 className="font-semibold text-slate-900 text-base">Pipeline Stages</h2>
            </div>
            <div className="space-y-3">
              <StageCard
                step="1"
                title="Extract"
                description="Read CSV, validate required columns"
                status={stageStatus('extract')}
              />
              <StageCard
                step="2"
                title="Transform"
                description="Deduplicate rows, normalise categories, priorities, and statuses; compute resolution days"
                status={stageStatus('transform')}
              />
              <StageCard
                step="3"
                title="Load"
                description="Replace reporting_tickets table with cleaned records"
                status={stageStatus('load')}
              />
            </div>
          </div>

          {/* Result */}
          {runResult && (
            <div
              className={`card p-6 border ${
                runResult.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              {runResult.type === 'success' ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <h3 className="font-semibold text-emerald-800">Pipeline Succeeded</h3>
                  </div>
                  <InfoRow label="Extracted" value={runResult.data.extracted} highlight />
                  <InfoRow label="Duplicates removed" value={runResult.data.duplicates_removed} />
                  <InfoRow label="Invalid rows dropped" value={runResult.data.invalid_rows_dropped} />
                  <InfoRow label="Records loaded" value={runResult.data.loaded} highlight />
                  <Link
                    to="/analytics"
                    className="mt-4 w-full btn-primary justify-center bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                  >
                    <BarChart2 size={15} />
                    View Analytics
                  </Link>
                </>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-700 text-sm mb-1">Pipeline Failed</p>
                    <p className="text-xs text-red-600">{runResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
