import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, CheckCircle, Clock, FolderOpen, Eye, PlusCircle, Search, ArrowRight, Star, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { analyticsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  draft: { label: 'Draft', class: 'bg-slate-100 text-slate-600' },
  pending_approval: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', class: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
  archived: { label: 'Archived', class: 'bg-purple-100 text-purple-700' }
}

function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await analyticsAPI.getDashboard()
      setData(res.data.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const renderStars = (rating) => {
    const stars = Math.round(rating || 0)
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
    ))
  }

  if (loading) return <LoadingSpinner fullScreen={false} />

  const { stats, mostViewedArticles, recentArticles, categoryDistribution, articlesByStatus } = data || {}

  const canCreateArticle = user?.role === 'author' || user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>!
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Here's what's happening with your knowledge base today.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {canCreateArticle && (
            <Link
              to="/articles/create"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              New Article
            </Link>
          )}
          <Link
            to="/search"
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-xl font-medium text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} value={stats?.totalArticles} label="Total Articles" color="indigo" />
        <StatCard icon={CheckCircle} value={stats?.approvedArticles} label="Published" color="green" />
        <StatCard icon={Clock} value={stats?.pendingArticles} label="Pending Review" color="amber" />
        <StatCard icon={FolderOpen} value={stats?.totalCategories} label="Categories" color="purple" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Articles by Category</h3>
              <p className="text-xs text-slate-500 mt-0.5">Published articles distribution</p>
            </div>
          </div>
          <div className="p-4">
            {categoryDistribution && categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categoryDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }}
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(value) => [value, 'Articles']}
                  />
                  <Bar dataKey="article_count" radius={[6, 6, 0, 0]}>
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-52 flex items-center justify-center text-slate-400 text-sm">
                No data available
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Content Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">Article distribution by status</p>
          </div>
          <div className="p-4 space-y-3">
            {articlesByStatus?.map(({ status, count, color }) => {
              const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
              const total = stats?.totalArticles || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.class}`}>{cfg.label}</span>
                    <span className="text-xs font-bold text-slate-700">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Most Viewed</h3>
              <p className="text-xs text-slate-500 mt-0.5">Top 5 popular articles</p>
            </div>
            <Link to="/articles?sort=popular" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {mostViewedArticles?.length > 0 ? mostViewedArticles.map((article, idx) => (
              <Link key={article.id} to={`/articles/${article.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <span className="text-lg font-black text-slate-200 w-6 text-center flex-shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{article.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{article.author_name}</span>
                    <span className="flex">{renderStars(article.avg_rating)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">{article.view_count?.toLocaleString()}</span>
                </div>
              </Link>
            )) : (
              <div className="py-8 text-center text-slate-400 text-sm">No articles yet</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Recent Articles</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest additions</p>
            </div>
            <Link to="/articles" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentArticles?.length > 0 ? recentArticles.map(article => {
              const s = STATUS_CONFIG[article.status] || STATUS_CONFIG.draft
              return (
                <Link key={article.id} to={`/articles/${article.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (article.category_color || '#6366f1') + '20' }}>
                    <FileText className="w-4 h-4" style={{ color: article.category_color || '#6366f1' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{article.title}</p>
                    <p className="text-xs text-slate-400">{article.category_name || 'Uncategorized'} · {formatDate(article.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${s.class}`}>{s.label}</span>
                </Link>
              )
            }) : (
              <div className="py-8 text-center text-slate-400 text-sm">No articles yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-bold mb-1">Quick Actions</h3>
            <p className="text-indigo-200 text-sm">Get things done faster</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canCreateArticle && (
              <Link to="/articles/create"
                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-medium transition-colors">
                <PlusCircle className="w-4 h-4" /> Create Article
              </Link>
            )}
            <Link to="/search"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-medium transition-colors">
              <Search className="w-4 h-4" /> Search Knowledge
            </Link>
            <Link to="/categories"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-medium transition-colors">
              <FolderOpen className="w-4 h-4" /> Browse Categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
