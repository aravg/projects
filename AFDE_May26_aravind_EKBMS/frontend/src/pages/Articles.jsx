import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PlusCircle, Filter, SortAsc, ChevronLeft, ChevronRight, FileText, RefreshCw } from 'lucide-react'
import { articlesAPI, categoriesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import ArticleCard from '../components/ArticleCard'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
]

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
]

function Articles() {
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 })
  const [filters, setFilters] = useState({ status: '', category: '', sort: 'created_at' })
  const { user } = useAuth()
  const navigate = useNavigate()

  const canCreate = user?.role === 'author' || user?.role === 'admin'

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [filters])

  useEffect(() => {
    fetchArticles()
  }, [pagination.page, filters])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: pagination.limit, sort: filters.sort }
      if (filters.status) params.status = filters.status
      if (filters.category) params.category = filters.category
      const res = await articlesAPI.getAll(params)
      setArticles(res.data.data.articles)
      setPagination(prev => ({ ...prev, ...res.data.data.pagination }))
    } catch {
      toast.error('Failed to load articles')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll()
      setCategories(res.data.data)
    } catch {}
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete article "${title}"? This cannot be undone.`)) return
    try {
      await articlesAPI.delete(id)
      toast.success('Article deleted')
      fetchArticles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete article')
    }
  }

  const handleSubmit = async (id) => {
    try {
      await articlesAPI.submit(id)
      toast.success('Article submitted for approval!')
      fetchArticles()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit article')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePage = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Articles</h2>
          <p className="text-sm text-slate-500">
            {pagination.total} article{pagination.total !== 1 ? 's' : ''} found
          </p>
        </div>
        {canCreate && (
          <Link
            to="/articles/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            New Article
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-600">Filters:</span>
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 min-w-[140px]"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 min-w-[160px]"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <SortAsc className="w-4 h-4 text-slate-400" />
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={fetchArticles}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner fullScreen={false} text="Loading articles..." />
        </div>
      ) : articles.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No articles found</h3>
          <p className="text-slate-400 text-sm mb-6">
            {filters.status || filters.category
              ? 'Try adjusting your filters'
              : 'Be the first to publish an article!'
            }
          </p>
          {canCreate && (
            <Link to="/articles/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition-colors">
              <PlusCircle className="w-4 h-4" /> Create Article
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                showStatus={true}
                onEdit={(id) => navigate(`/articles/${id}/edit`)}
                onDelete={handleDelete}
                onSubmit={handleSubmit}
                currentUserId={user?.id}
                currentUserRole={user?.role}
              />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => handlePage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let page
                if (pagination.pages <= 5) {
                  page = i + 1
                } else if (pagination.page <= 3) {
                  page = i + 1
                } else if (pagination.page >= pagination.pages - 2) {
                  page = pagination.pages - 4 + i
                } else {
                  page = pagination.page - 2 + i
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePage(page)}
                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                      page === pagination.page
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                onClick={() => handlePage(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Articles
