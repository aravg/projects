import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Plus,
  ChevronRight,
  Ticket as TicketIcon,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { ticketService } from '../services/ticketService'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'

const CATEGORIES = [
  'all',
  'VPN Issue',
  'Password Reset',
  'Software Installation',
  'Laptop Issue',
  'Email Access',
  'Network Connectivity',
  'Hardware Request',
  'Other',
]
const STATUSES = ['all', 'Open', 'In Progress', 'Resolved', 'Closed']
const PRIORITIES = ['all', 'Low', 'Medium', 'High', 'Critical']

const PRIORITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }

function Skeleton() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilter = keyword || category !== 'all' || status !== 'all' || priority !== 'all'

  const clearFilters = () => {
    setKeyword('')
    setCategory('all')
    setStatus('all')
    setPriority('all')
  }

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (keyword) params.keyword = keyword
      if (category !== 'all') params.category = category
      if (status !== 'all') params.status = status
      if (priority !== 'all') params.priority = priority

      const res = hasActiveFilter
        ? await ticketService.search(params)
        : await ticketService.getAll()
      setTickets(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [keyword, category, status, priority, hasActiveFilter])

  useEffect(() => {
    const t = setTimeout(fetchTickets, 280)
    return () => clearTimeout(t)
  }, [fetchTickets])

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—'

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Tickets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading...' : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`btn-secondary ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilter && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                !
              </span>
            )}
          </button>
          <Link to="/create" className="btn-primary shadow-md shadow-indigo-200">
            <Plus size={17} />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card p-4 mb-5 space-y-4">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by keyword, employee name, department, category..."
            className="input-field pl-9 pr-10"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 animate-slide-up">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field text-sm py-2"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field text-sm py-2"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All Statuses' : s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-field text-sm py-2"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p === 'all' ? 'All Priorities' : p}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {hasActiveFilter && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <p className="text-xs text-slate-500">Active filters applied</p>
            <button
              onClick={clearFilters}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <X size={12} />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  ID
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Employee
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Category
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Priority
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Created
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => <Skeleton key={i} />)
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <TicketIcon size={24} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">No tickets found</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {hasActiveFilter
                            ? 'Try adjusting or clearing your filters'
                            : 'Create a ticket to get started'}
                        </p>
                      </div>
                      {hasActiveFilter && (
                        <button onClick={clearFilters} className="btn-secondary text-sm">
                          <X size={14} />
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr
                    key={t.ticket_id}
                    className="hover:bg-slate-50/80 transition-colors duration-100 group"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        #{t.ticket_id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-900">{t.employee_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.department}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-sm">{t.issue_category}</td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/tickets/${t.ticket_id}`}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors"
                      >
                        <ChevronRight size={15} className="text-slate-400 group-hover:text-slate-600" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
