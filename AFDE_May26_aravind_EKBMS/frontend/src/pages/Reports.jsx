import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  BarChart3, Download, TrendingUp, Users, FileText, Eye,
  Search, RefreshCw, Star, UserCheck
} from 'lucide-react'
import { analyticsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  approved: '#10b981',
  pending_approval: '#f59e0b',
  draft: '#6b7280',
  rejected: '#ef4444',
  archived: '#8b5cf6'
}

const STATUS_LABELS = {
  approved: 'Approved',
  pending_approval: 'Pending',
  draft: 'Draft',
  rejected: 'Rejected',
  archived: 'Archived'
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'authors', label: 'Author Activity', icon: UserCheck },
]

function Reports() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dashData, setDashData] = useState(null)
  const [searchTrends, setSearchTrends] = useState([])
  const [userActivity, setUserActivity] = useState(null)
  const [popularCategories, setPopularCategories] = useState([])
  const [authorActivity, setAuthorActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dashRes, trendsRes, activityRes, catRes, authorRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getSearchTrends(),
        analyticsAPI.getUserActivity(),
        analyticsAPI.getPopularCategories(),
        analyticsAPI.getAuthorActivity(),
      ])
      setDashData(dashRes.data.data)
      setSearchTrends(trendsRes.data.data)
      setUserActivity(activityRes.data.data)
      setPopularCategories(catRes.data.data)
      setAuthorActivity(authorRes.data.data || [])
    } catch {
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!dashData) return
    const rows = [
      ['Metric', 'Value'],
      ['Total Articles', dashData.stats.totalArticles],
      ['Approved Articles', dashData.stats.approvedArticles],
      ['Pending Articles', dashData.stats.pendingArticles],
      ['Draft Articles', dashData.stats.draftArticles],
      ['Rejected Articles', dashData.stats.rejectedArticles],
      ['Total Users', dashData.stats.totalUsers],
      ['Total Categories', dashData.stats.totalCategories],
      ['Total Comments', dashData.stats.totalComments],
      [],
      ['Category', 'Article Count', 'Total Views'],
      ...popularCategories.map(c => [c.name, c.article_count, c.total_views || 0]),
      [],
      ['Search Query', 'Search Count'],
      ...searchTrends.map(t => [t.query, t.search_count]),
      [],
      ['Author', 'Articles', 'Total Views', 'Approved', 'Avg Rating'],
      ...authorActivity.map(a => [a.name, a.article_count, a.total_views, a.approved_count, Number(a.avg_rating).toFixed(2)]),
    ]
    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ekbms_analytics_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported successfully!')
  }

  if (loading) return <LoadingSpinner fullScreen={false} />

  const { stats, mostViewedArticles, articlesByStatus, categoryDistribution } = dashData || {}

  const pieData = articlesByStatus?.filter(s => s.count > 0).map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: s.color || STATUS_COLORS[s.status] || '#6366f1'
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-sm text-slate-500">Comprehensive insights into your knowledge base</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FileText} value={stats?.totalArticles} label="Total Articles" color="indigo" />
            <StatCard icon={TrendingUp} value={stats?.approvedArticles} label="Published" color="green" />
            <StatCard icon={Users} value={stats?.totalUsers} label="Total Users" color="purple" />
            <StatCard icon={Eye} value={mostViewedArticles?.reduce((s, a) => s + a.view_count, 0)} label="Total Views" color="blue" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-1">Articles by Status</h3>
              <p className="text-xs text-slate-500 mb-5">Distribution across all statuses</p>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} formatter={(value, name) => [value, name]} />
                    <Legend formatter={(value) => <span style={{ fontSize: '12px', color: '#64748b' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No data</div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-1">Articles by Category</h3>
              <p className="text-xs text-slate-500 mb-5">Published articles per category</p>
              {categoryDistribution && categoryDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoryDistribution} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="article_count" radius={[0, 6, 6, 0]} name="Articles">
                      {categoryDistribution.map((entry, index) => <Cell key={index} fill={entry.color || '#6366f1'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No data</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-1">Most Viewed Articles</h3>
            <p className="text-xs text-slate-500 mb-5">Top performing content</p>
            {mostViewedArticles && mostViewedArticles.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mostViewedArticles} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} angle={-25} textAnchor="end" interval={0} tickFormatter={(val) => val.length > 25 ? val.slice(0, 25) + '…' : val} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} cursor={{ fill: '#f1f5f9' }} formatter={(value) => [value.toLocaleString(), 'Views']} />
                  <Bar dataKey="view_count" fill="#6366f1" radius={[6, 6, 0, 0]} name="Views" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No data</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="font-bold text-slate-900">Search Trends</h3>
                  <p className="text-xs text-slate-400">Top 10 search queries</p>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {searchTrends.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-sm">No search data yet</div>
                ) : (
                  searchTrends.map((trend, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-6 py-3">
                      <span className="text-lg font-black text-slate-200 w-6 text-center">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{trend.query}</p>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, (trend.search_count / (searchTrends[0]?.search_count || 1)) * 100)}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-700 flex-shrink-0">{trend.search_count}x</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="font-bold text-slate-900">User Distribution</h3>
                  <p className="text-xs text-slate-400">By role</p>
                </div>
              </div>
              <div className="p-5">
                {userActivity?.usersByRole && userActivity.usersByRole.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={userActivity.usersByRole.map(r => ({ name: r.role.charAt(0).toUpperCase() + r.role.slice(1), value: r.count }))} cx="50%" cy="50%" outerRadius={75} dataKey="value" paddingAngle={3}>
                        {userActivity.usersByRole.map((_, index) => <Cell key={index} fill={['#6366f1', '#8b5cf6', '#10b981', '#f59e0b'][index % 4]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} formatter={(value, name) => [value, name]} />
                      <Legend formatter={(value) => <span style={{ fontSize: '12px', color: '#64748b' }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No user data</div>
                )}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {userActivity?.usersByRole?.map((r, i) => (
                    <div key={r.role} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b'][i % 4] }} />
                      <div>
                        <p className="text-xs font-semibold text-slate-700 capitalize">{r.role}</p>
                        <p className="text-xs text-slate-400">{r.count} users</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Category Performance</h3>
              <p className="text-xs text-slate-500">Articles and views per category</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Articles</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Views</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {popularCategories.map((cat) => {
                    const maxViews = popularCategories[0]?.total_views || 1
                    const pct = Math.round(((cat.total_views || 0) / maxViews) * 100)
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="font-medium text-slate-800 text-sm">{cat.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-slate-700">{cat.article_count}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-600">{(cat.total_views || 0).toLocaleString()}</td>
                        <td className="px-5 py-3.5 w-40">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── AUTHOR ACTIVITY TAB ───────────────────────────────────────────────── */}
      {activeTab === 'authors' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} value={authorActivity.length} label="Active Authors" color="indigo" />
            <StatCard icon={FileText} value={authorActivity.reduce((s, a) => s + (a.article_count || 0), 0)} label="Total Articles" color="green" />
            <StatCard icon={Eye} value={authorActivity.reduce((s, a) => s + (a.total_views || 0), 0)} label="Combined Views" color="blue" />
            <StatCard icon={Star} value={
              authorActivity.length
                ? Number(authorActivity.reduce((s, a) => s + Number(a.avg_rating || 0), 0) / authorActivity.length).toFixed(1)
                : '—'
            } label="Avg Rating" color="purple" />
          </div>

          {authorActivity.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-1">Views by Author</h3>
              <p className="text-xs text-slate-500 mb-5">Total article views accumulated per author</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={authorActivity} margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }}
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(value) => [value.toLocaleString(), 'Views']}
                  />
                  <Bar dataKey="total_views" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Views" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-slate-900">Author Leaderboard</h3>
                <p className="text-xs text-slate-400">Ranked by total views</p>
              </div>
            </div>
            {authorActivity.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No author data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50">
                      {['#', 'Author', 'Department', 'Articles', 'Approved', 'Pending', 'Total Views', 'Avg Rating'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {authorActivity.map((author, idx) => (
                      <tr key={author.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 text-lg font-black text-slate-200 w-8">{idx + 1}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {author.name ? author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{author.name}</p>
                              <p className="text-xs text-slate-400">{author.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-500">{author.department || '—'}</td>
                        <td className="px-5 py-3.5 text-sm font-bold text-slate-700">{author.article_count}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {author.approved_count}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {author.pending_count > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700">
                              {author.pending_count}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-20">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                style={{ width: `${Math.min(100, ((author.total_views || 0) / (authorActivity[0]?.total_views || 1)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                              {(author.total_views || 0).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="text-sm font-semibold text-slate-700">
                              {Number(author.avg_rating || 0).toFixed(1)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Reports
