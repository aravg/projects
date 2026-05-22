import React, { useState, useEffect } from 'react'
import {
  Database, Play, RefreshCw, CheckCircle, XCircle,
  Clock, FileText, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react'
import { etlAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_META = {
  completed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Completed' },
  failed:    { icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50',     label: 'Failed'    },
  running:   { icon: Clock,       color: 'text-amber-500',   bg: 'bg-amber-50',   label: 'Running'   },
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.running
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${meta.bg} ${meta.color}`}>
      <Icon className="w-3.5 h-3.5" />{meta.label}
    </span>
  )
}

function RunRow({ run }) {
  const [open, setOpen] = useState(false)
  const fmtDate = (d) => d ? new Date(d).toLocaleString() : '—'
  const duration = run.started_at && run.completed_at
    ? `${Math.round((new Date(run.completed_at) - new Date(run.started_at)) / 1000)}s`
    : null

  return (
    <>
      <tr
        className="hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => run.error_message && setOpen(o => !o)}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{run.source_file}</span>
          </div>
        </td>
        <td className="px-5 py-3.5"><StatusBadge status={run.status} /></td>
        <td className="px-5 py-3.5 text-sm text-slate-600 font-mono">{run.records_extracted ?? '—'}</td>
        <td className="px-5 py-3.5 text-sm text-slate-600 font-mono">{run.records_transformed ?? '—'}</td>
        <td className="px-5 py-3.5 text-sm font-bold text-emerald-600 font-mono">{run.records_loaded ?? '—'}</td>
        <td className="px-5 py-3.5 text-xs text-slate-500">{fmtDate(run.started_at)}</td>
        <td className="px-5 py-3.5 text-xs text-slate-400">{duration || '—'}</td>
        <td className="px-5 py-3.5">
          {run.error_message && (
            open
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </td>
      </tr>
      {open && run.error_message && (
        <tr className="bg-red-50">
          <td colSpan={8} className="px-5 py-3">
            <div className="flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <pre className="whitespace-pre-wrap font-mono">{run.error_message}</pre>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function ResultBanner({ result }) {
  if (!result) return null
  const skipped = result.extracted - result.loaded
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="w-5 h-5 text-emerald-600" />
        <h4 className="font-bold text-emerald-800">ETL Pipeline Completed</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Extracted', value: result.extracted, color: 'text-slate-700' },
          { label: 'Transformed', value: result.transformed, color: 'text-blue-700' },
          { label: 'Loaded', value: result.loaded, color: 'text-emerald-700' },
          { label: 'Skipped', value: skipped, color: 'text-amber-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-3 text-center border border-emerald-100">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {result.errors && result.errors.length > 0 && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-xl p-3 border border-amber-200">
          <p className="font-semibold mb-1">Skipped records (first {result.errors.length}):</p>
          {result.errors.map((e, i) => <p key={i} className="truncate">• {e}</p>)}
        </div>
      )}
    </div>
  )
}

function ETLManagement() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  useEffect(() => { fetchRuns() }, [])

  const fetchRuns = async () => {
    setLoading(true)
    try {
      const res = await etlAPI.getRuns()
      setRuns(res.data.data || [])
    } catch {
      toast.error('Failed to load ETL history')
    } finally {
      setLoading(false)
    }
  }

  const triggerETL = async () => {
    setTriggering(true)
    setLastResult(null)
    try {
      const res = await etlAPI.trigger()
      setLastResult(res.data.data)
      const { loaded } = res.data.data
      toast.success(`ETL complete — ${loaded} article${loaded !== 1 ? 's' : ''} imported`)
      fetchRuns()
    } catch (err) {
      const msg = err.response?.data?.message || 'ETL pipeline failed'
      toast.error(msg)
    } finally {
      setTriggering(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ETL Management</h2>
          <p className="text-sm text-slate-500">Import and manage knowledge article datasets</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRuns}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={triggerETL}
            disabled={triggering}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60"
          >
            {triggering ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Running…</>
            ) : (
              <><Play className="w-4 h-4" /> Run ETL Import</>
            )}
          </button>
        </div>
      </div>

      {/* Pipeline overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Database,
            title: 'Extract',
            desc: 'Reads knowledge_articles.csv from the datasets/ folder',
            color: 'from-blue-500 to-cyan-500',
          },
          {
            icon: RefreshCw,
            title: 'Transform',
            desc: 'Normalises categories, tags, dates, and removes duplicates',
            color: 'from-indigo-500 to-purple-500',
          },
          {
            icon: CheckCircle,
            title: 'Load',
            desc: 'Inserts cleaned articles and tags into the knowledge base',
            color: 'from-emerald-500 to-teal-500',
          },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex gap-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-md`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{title}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Last run result */}
      <ResultBanner result={lastResult} />

      {/* Dataset info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-bold text-slate-900 mb-1">Dataset Source</h3>
        <p className="text-xs text-slate-500 mb-3">Place CSV or JSON files in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">datasets/</code> folder at the project root</p>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-2">Expected CSV columns:</p>
          <div className="flex flex-wrap gap-2">
            {['title', 'summary', 'category', 'tags', 'views', 'author_email', 'status', 'created_date'].map(col => (
              <span key={col} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono border border-indigo-100">{col}</span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Tags are comma-separated within a quoted field, e.g. <code className="font-mono">"policy,security,process"</code>
          </p>
        </div>
        <div className="mt-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-semibold text-slate-600 mb-1">Python ETL (offline batch)</p>
          <p className="text-xs text-slate-500 mb-2">Run standalone from the project root (stop the server first):</p>
          <pre className="text-xs font-mono bg-slate-800 text-emerald-300 rounded-lg px-4 py-3 overflow-x-auto">
{`cd etl
pip install -r requirements.txt
python etl_pipeline.py`}
          </pre>
        </div>
      </div>

      {/* Run history */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-500" />
          <div>
            <h3 className="font-bold text-slate-900">Run History</h3>
            <p className="text-xs text-slate-400">Last 30 ETL executions</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12"><LoadingSpinner fullScreen={false} /></div>
        ) : runs.length === 0 ? (
          <div className="py-16 text-center">
            <Database className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No ETL runs yet</p>
            <p className="text-slate-300 text-xs mt-1">Click "Run ETL Import" to load your dataset</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['Source File', 'Status', 'Extracted', 'Transformed', 'Loaded', 'Started', 'Duration', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {runs.map(run => <RunRow key={run.id} run={run} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ETLManagement
