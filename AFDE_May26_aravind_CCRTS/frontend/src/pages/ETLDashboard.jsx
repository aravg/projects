import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Database, RefreshCw, AlertTriangle, TrendingUp,
  Users, CheckCircle, XCircle, Clock, Star, Play,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];
const PRIORITY_COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const EmptyState = ({ msg }) => (
  <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
    <Database size={32} />
    <p className="text-sm">{msg}</p>
  </div>
);

export default function ETLDashboard() {
  const { isAdmin, isSupervisor } = useAuth();
  const canRunETL = isAdmin || isSupervisor;

  const [loading, setLoading]   = useState(true);
  const [running, setRunning]   = useState(false);
  const [sla, setSla]           = useState(null);
  const [cats, setCats]         = useState(null);
  const [agents, setAgents]     = useState(null);
  const [trends, setTrends]     = useState(null);
  const [etlStatus, setEtlStatus] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3, r4, r5] = await Promise.all([
        api.get('/api/analytics/etl-status'),
        api.get('/api/analytics/sla-breaches'),
        api.get('/api/analytics/category-analysis'),
        api.get('/api/analytics/agent-performance'),
        api.get('/api/analytics/resolution-trends'),
      ]);
      setEtlStatus(r1.data);
      setSla(r2.data);
      setCats(r3.data);
      setAgents(r4.data);
      setTrends(r5.data);
    } catch {
      toast.error('Failed to load analytics data. Run ETL first.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRunETL = async () => {
    setRunning(true);
    try {
      const res = await api.post('/api/analytics/run-etl');
      toast.success(`ETL complete — ${res.data.records_loaded} records loaded in ${res.data.duration_seconds}s`);
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'ETL pipeline failed');
    } finally {
      setRunning(false);
    }
  };

  // ── Derived chart data ──────────────────────────────────────────────────────
  const slaByPriority = sla?.by_priority?.map(p => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    Compliant: p.compliant,
    Breached: p.breached,
    fill: PRIORITY_COLORS[p.priority] ?? '#3b82f6',
  })) ?? [];

  const slaByCategory = sla?.by_category?.map(c => ({
    name: c.category.replace(' Issues', '').replace(' Problems', '').replace(' Delays', ''),
    breachRate: c.breach_rate,
    total: c.total,
  })) ?? [];

  const categoryPie = cats?.categories?.map((c, i) => ({
    name: c.category,
    value: c.total_complaints,
    fill: COLORS[i % COLORS.length],
  })) ?? [];

  const trendData = trends?.trends?.map(t => ({
    month: t.month,
    Total: t.total_complaints,
    Resolved: t.resolved_complaints,
    SLABreaches: t.sla_breaches,
  })) ?? [];

  const noData = etlStatus?.last_run?.status === 'never_run';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Database size={24} className="text-blue-600" />
            ETL Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complaint analytics powered by the Phase 2 ETL pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {canRunETL && (
            <button
              onClick={handleRunETL}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {running
                ? <><RefreshCw size={15} className="animate-spin" /> Running ETL…</>
                : <><Play size={15} /> Run ETL Pipeline</>}
            </button>
          )}
        </div>
      </div>

      {/* ETL Status Card */}
      <div className={`rounded-xl border p-4 ${
        etlStatus?.last_run?.status === 'success' ? 'bg-green-50 border-green-200' :
        etlStatus?.last_run?.status === 'failed'  ? 'bg-red-50 border-red-200'    :
                                                     'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {etlStatus?.last_run?.status === 'success'
              ? <CheckCircle size={20} className="text-green-600" />
              : etlStatus?.last_run?.status === 'failed'
              ? <XCircle size={20} className="text-red-600" />
              : <Database size={20} className="text-gray-500" />}
            <div>
              <p className="font-semibold text-gray-700 text-sm">
                ETL Pipeline Status&nbsp;
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  etlStatus?.last_run?.status === 'success' ? 'bg-green-100 text-green-700' :
                  etlStatus?.last_run?.status === 'failed'  ? 'bg-red-100 text-red-700'    :
                                                               'bg-gray-100 text-gray-600'
                }`}>
                  {etlStatus?.last_run?.status ?? 'Unknown'}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                {etlStatus?.last_run?.run_at
                  ? `Last run: ${new Date(etlStatus.last_run.run_at).toLocaleString()}`
                  : 'ETL has not been run yet. Click "Run ETL Pipeline" to load analytics data.'}
              </p>
            </div>
          </div>
          {etlStatus?.last_run?.status === 'success' && (
            <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
              <span><strong>{etlStatus.last_run.records_extracted}</strong> extracted</span>
              <span><strong>{etlStatus.last_run.records_loaded}</strong> loaded</span>
              <span><strong>{etlStatus.last_run.duration_seconds}s</strong> duration</span>
            </div>
          )}
        </div>
        {etlStatus?.last_run?.error_message && (
          <p className="mt-2 text-xs text-red-600 bg-red-100 rounded p-2 font-mono">
            {etlStatus.last_run.error_message}
          </p>
        )}
      </div>

      {noData ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
          <Database size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No Analytics Data Yet</h3>
          <p className="text-sm text-gray-400 mt-1 mb-4">
            Run the ETL pipeline to populate analytics dashboards with complaint insights.
          </p>
          {canRunETL && (
            <button
              onClick={handleRunETL}
              disabled={running}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {running ? <><RefreshCw size={14} className="animate-spin" /> Running…</> : <><Play size={14} /> Run ETL Pipeline</>}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Database}
              label="Total Records Analysed"
              value={(etlStatus?.total_analytics_records ?? 0).toLocaleString()}
              sub="from CSV dataset"
              color="blue"
            />
            <StatCard
              icon={AlertTriangle}
              label="SLA Breaches"
              value={sla?.summary?.total_breached ?? 0}
              sub={`${sla?.summary?.overall_breach_rate ?? 0}% breach rate`}
              color="red"
            />
            <StatCard
              icon={CheckCircle}
              label="SLA Compliant"
              value={sla?.summary?.total_compliant ?? 0}
              sub="resolved within SLA"
              color="green"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Resolution Rate"
              value={`${trends?.trends?.length
                ? Math.round(trends.trends.reduce((s, t) => s + t.resolution_rate, 0) / trends.trends.length)
                : 0}%`}
              sub="across all months"
              color="purple"
            />
          </div>

          {/* Row 2: SLA by Priority + Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SLA by Priority */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" />
                SLA Breach by Priority
              </h2>
              {slaByPriority.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={slaByPriority} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Compliant" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Breached"  fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState msg="No SLA data yet" />}
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                Complaints by Category
              </h2>
              {categoryPie.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryPie}
                      cx="50%" cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryPie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyState msg="No category data yet" />}
            </div>
          </div>

          {/* Row 3: Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-purple-500" />
              Monthly Resolution Trends
            </h2>
            {trendData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Total"       stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Resolved"    stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="SLABreaches" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState msg="No trend data yet" />}
          </div>

          {/* Row 4: SLA Breach Rate by Category + Agent Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SLA Breach Rate by Category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                SLA Breach Rate by Category
              </h2>
              {slaByCategory.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={slaByCategory}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={85} />
                    <Tooltip formatter={v => [`${v}%`, 'Breach Rate']} />
                    <Bar dataKey="breachRate" fill="#f97316" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyState msg="No SLA data yet" />}
            </div>

            {/* Agent Performance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Users size={16} className="text-green-500" />
                Agent Performance
              </h2>
              {agents?.agents?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                        <th className="text-left py-2 pr-3">Agent</th>
                        <th className="text-right py-2 px-2">Assigned</th>
                        <th className="text-right py-2 px-2">Resolved</th>
                        <th className="text-right py-2 px-2">Rate</th>
                        <th className="text-right py-2 px-2">
                          <Star size={11} className="inline" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.agents.map((a, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 pr-3 font-medium text-gray-700">{a.agent_name}</td>
                          <td className="text-right py-2.5 px-2 text-gray-600">{a.total_assigned}</td>
                          <td className="text-right py-2.5 px-2 text-gray-600">{a.total_resolved}</td>
                          <td className="text-right py-2.5 px-2">
                            <span className={`font-semibold ${
                              a.resolution_rate >= 80 ? 'text-green-600' :
                              a.resolution_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {a.resolution_rate}%
                            </span>
                          </td>
                          <td className="text-right py-2.5 px-2 text-yellow-500">
                            {a.avg_customer_rating ? a.avg_customer_rating.toFixed(1) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <EmptyState msg="No agent data yet" />}
            </div>
          </div>

          {/* Row 5: Category KPIs Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              Category Analytics Summary
            </h2>
            {cats?.categories?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                      <th className="text-left py-2 pr-4">Category</th>
                      <th className="text-right py-2 px-2">Total</th>
                      <th className="text-right py-2 px-2">Open</th>
                      <th className="text-right py-2 px-2">Resolved</th>
                      <th className="text-right py-2 px-2">Escalated</th>
                      <th className="text-right py-2 px-2">Res. Rate</th>
                      <th className="text-right py-2 px-2">Avg Hrs</th>
                      <th className="text-right py-2 pl-2">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cats.categories.map((c, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 pr-4 font-medium text-gray-700">{c.category}</td>
                        <td className="text-right py-2.5 px-2 font-semibold text-gray-800">{c.total_complaints}</td>
                        <td className="text-right py-2.5 px-2 text-blue-600">{c.open_complaints}</td>
                        <td className="text-right py-2.5 px-2 text-green-600">{c.resolved_complaints}</td>
                        <td className="text-right py-2.5 px-2 text-orange-600">{c.escalated_complaints}</td>
                        <td className="text-right py-2.5 px-2">
                          <span className={`font-semibold ${
                            c.resolution_rate >= 70 ? 'text-green-600' :
                            c.resolution_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {c.resolution_rate}%
                          </span>
                        </td>
                        <td className="text-right py-2.5 px-2 text-gray-500">
                          {c.avg_resolution_hours != null ? `${c.avg_resolution_hours}h` : '—'}
                        </td>
                        <td className="text-right py-2.5 pl-2 text-yellow-500">
                          {c.avg_customer_rating != null ? `★ ${c.avg_customer_rating}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState msg="No category data yet" />}
          </div>
        </>
      )}
    </div>
  );
}
