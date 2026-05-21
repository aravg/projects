import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon, Filter, X, Eye, Star, Clock, SortAsc, Lightbulb } from 'lucide-react'
import { searchAPI, categoriesAPI, tagsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  approved: { label: 'Approved', class: 'bg-green-100 text-green-700' }
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    tag: searchParams.get('tag') || '',
    sort: searchParams.get('sort') || 'relevance'
  })
  const [results, setResults] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  const SEARCH_TIPS = [
    'Use specific keywords for better results',
    'Try searching by category name',
    'Look for policy documents with "policy"',
    'Find technical guides with "technical"',
    'Search by author name or department'
  ]

  const POPULAR_SEARCHES = ['security policy', 'onboarding', 'expense reimbursement', 'remote work', 'IT support', 'network infrastructure']

  useEffect(() => {
    fetchMeta()
    if (searchParams.get('q') || searchParams.get('tag')) {
      performSearch()
    }
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    const tag = searchParams.get('tag')
    if (q !== null) setQuery(q)
    if (tag) setFilters(prev => ({ ...prev, tag }))
  }, [searchParams])

  const fetchMeta = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([categoriesAPI.getAll(), tagsAPI.getAll()])
      setCategories(catRes.data.data)
      setTags(tagRes.data.data)
    } catch {}
  }

  const performSearch = async (page = 1) => {
    setLoading(true)
    setSearched(true)
    try {
      const params = {
        q: query || searchParams.get('q') || '',
        page,
        limit: 10,
        sort: filters.sort
      }
      if (filters.category) params.category = filters.category
      if (filters.tag) params.tag = filters.tag || searchParams.get('tag')

      const res = await searchAPI.search(params)
      setResults(res.data.data.articles)
      setPagination(res.data.data.pagination)
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const newParams = {}
    if (query) newParams.q = query
    if (filters.category) newParams.category = filters.category
    if (filters.tag) newParams.tag = filters.tag
    if (filters.sort !== 'relevance') newParams.sort = filters.sort
    setSearchParams(newParams)
    performSearch(1)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({ category: '', tag: '', sort: 'relevance' })
  }

  const highlightText = (text, q) => {
    if (!q || !text) return text
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5">{part}</mark>
        : part
    )
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
  ))

  const activeFilterCount = [filters.category, filters.tag].filter(Boolean).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Search Knowledge Base</h2>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles, guides, policies..."
              className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all text-base"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-medium transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            Search
          </button>
        </form>

        {showFilters && (
          <div className="mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Filter Results</span>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Clear filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                value={filters.tag}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Tags</option>
                {tags.map(t => <option key={t.id} value={t.name}>#{t.name}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-slate-400" />
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <LoadingSpinner fullScreen={false} text="Searching..." />
        </div>
      ) : searched ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-600">
              Found <span className="font-bold text-slate-900">{pagination.total}</span> result{pagination.total !== 1 ? 's' : ''}
              {query && <span className="text-slate-500"> for "<span className="text-indigo-600">{query}</span>"</span>}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No results found</h3>
              <p className="text-slate-400 text-sm mb-6">Try different keywords or remove filters</p>

              <div className="max-w-sm mx-auto">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Popular Searches</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {POPULAR_SEARCHES.map(s => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); performSearch(1) }}
                      className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map(article => (
                <Link key={article.id} to={`/articles/${article.id}`} className="block">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-indigo-300 hover:shadow-md transition-all card-hover">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {article.category_name && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                              style={{ backgroundColor: article.category_color || '#6366f1' }}>
                              {article.category_name}
                            </span>
                          )}
                          {article.tags?.slice(0, 3).map(tag => (
                            <span key={tag.id} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              #{tag.name}
                            </span>
                          ))}
                        </div>

                        <h3 className="font-bold text-slate-900 text-base mb-1.5 hover:text-indigo-600 transition-colors">
                          {highlightText(article.title, query)}
                        </h3>

                        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                          {article.highlight?.summary
                            ? highlightText(article.highlight.summary, query)
                            : article.summary || 'No summary available'
                          }
                        </p>

                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                          <span className="font-medium text-slate-600">{article.author_name}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(article.created_at)}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.view_count?.toLocaleString()}</span>
                          <span className="flex">{renderStars(article.avg_rating)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => performSearch(page)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
                        page === pagination.page
                          ? 'bg-indigo-600 text-white'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" /> Search Tips
            </h3>
            <ul className="space-y-2">
              {SEARCH_TIPS.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map(s => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); setTimeout(() => document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true })), 100) }}
                  className="flex items-center gap-1.5 text-sm bg-slate-100 text-slate-700 px-4 py-2 rounded-xl hover:bg-indigo-100 hover:text-indigo-700 transition-colors font-medium"
                >
                  <SearchIcon className="w-3.5 h-3.5" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setFilters(p => ({ ...p, category: cat.id })); setSearched(true); performSearch(1) }}
                  className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cat.color + '20' }}>
                    <span className="text-sm" style={{ color: cat.color }}>●</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{cat.name}</p>
                    <p className="text-xs text-slate-400">{cat.article_count || 0} articles</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Search
