import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import {
  BarChart2, PieChart as PieIcon, TrendingUp, Users, RefreshCw,
  AlertTriangle, Database,
} from 'lucide-react'
import { analyticsService } from '../services/analyticsService'

const PRIORITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4',
  '#10b981', '#f59e0b', '#f43f5e', '#64748b',
]

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-indigo-600" />
      </div>
      <div>
        <h2 className="font-semibold text-slate-900 text-base">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
        <Database size={28} className="text-amber-500" />
      </div>
      <p className="font-semibold text-slate-700">No analytics data yet</p>
      <p className="text-sm text-slate-500 mt-1 mb-5 max-w-xs">
        Run the ETL pipeline to import historical ticket data and populate the analytics dashboard.
      </p>
      <Link to="/etl" className="btn-primary mx-auto w-fit">
        Go to ETL Manager
      </Link>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [priorityData, setPriorityData] = useState([])
  const [deptData, setDeptData] = useState([])
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sum, cat, pri, dept, trend] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getCategoryDistribution(),
        analyticsService.getPriorityDistribution(),
        analyticsService.getDepartmentCounts(),
        analyticsService.getResolutionTrends(),
      ])
      setSummary(sum.data)
      setCategoryData(cat.data)
      setPriorityData(pri.data)
      setDeptData(dept.data)
      setTrendData(trend.data)
    } catch {
      setError('Failed to load analytics. Make sure the ETL pipeline has been run.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || summary?.total_imported === 0) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="page-header mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500 mt-0.5">ETL-powered ticket insights</p>
          </div>
        </div>
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <div className="card"><EmptyState /></div>
      </div>
    )
  }

  const resolutionRate = summary.total_imported > 0
    ? Math.round((summary.resolved_count / summary.total_imported) * 100)
    : 0

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="page-header mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">ETL-powered insights from historical ticket data</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/etl" className="btn-secondary">
            <Database size={15} />
            ETL Manager
          </Link>
          <button onClick={load} className="btn-secondary">
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Imported</p>
          <p className="text-3xl font-bold text-slate-900">{summary.total_imported.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">historical tickets</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Resolution Rate</p>
          <p className="text-3xl font-bold text-emerald-600">{resolutionRate}%</p>
          <p className="text-xs text-slate-400 mt-1">{summary.resolved_count} resolved / closed</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg Resolution</p>
          <p className="text-3xl font-bold text-indigo-600">{summary.avg_resolution_days}</p>
          <p className="text-xs text-slate-400 mt-1">days average</p>
        </div>
      </div>

      {/* Row 1: Category + Priority */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Category Distribution */}
        <div className="card p-6">
          <SectionHeader
            icon={BarChart2}
            title="Issue Category Distribution"
            subtitle="Most common support request types"
          />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="category"
                width={130}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="card p-6">
          <SectionHeader
            icon={PieIcon}
            title="Priority Distribution"
            subtitle="Breakdown by urgency level"
          />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={priorityData}
                dataKey="count"
                nameKey="priority"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ priority, percent }) =>
                  `${priority} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {priorityData.map((entry) => (
                  <Cell
                    key={entry.priority}
                    fill={PRIORITY_COLORS[entry.priority] || '#94a3b8'}
                  />
                ))}
              </Pie>
              <Legend
                formatter={(val) => (
                  <span className="text-xs text-slate-600">{val}</span>
                )}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Department + Resolution Trends */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Department Counts */}
        <div className="card p-6">
          <SectionHeader
            icon={Users}
            title="Department-wise Ticket Counts"
            subtitle="Volume of tickets by department"
          />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deptData} margin={{ left: 0, right: 16, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="department"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Tickets" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resolution Trends */}
        <div className="card p-6">
          <SectionHeader
            icon={TrendingUp}
            title="Average Resolution Time Trends"
            subtitle="Monthly average days to resolve tickets"
          />
          {trendData.length === 0 ? (
            <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
              No resolution data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ left: 0, right: 16, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avg_resolution_days"
                  name="Avg Days"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
