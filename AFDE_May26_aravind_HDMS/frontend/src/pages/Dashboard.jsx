import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Ticket,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Flame,
  ArrowRight,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { ticketService } from '../services/ticketService'
import StatsCard from '../components/StatsCard'
import StatusBadge from '../components/StatusBadge'
import PriorityBadge from '../components/PriorityBadge'

const CATEGORY_COLORS = {
  'VPN Issue': 'bg-purple-100 text-purple-700',
  'Password Reset': 'bg-pink-100 text-pink-700',
  'Software Installation': 'bg-blue-100 text-blue-700',
  'Laptop Issue': 'bg-orange-100 text-orange-700',
  'Email Access': 'bg-cyan-100 text-cyan-700',
  'Network Connectivity': 'bg-teal-100 text-teal-700',
  'Hardware Request': 'bg-amber-100 text-amber-700',
  Other: 'bg-slate-100 text-slate-600',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([
          ticketService.getStats(),
          ticketService.getAll({ limit: 6 }),
        ])
        setStats(s.data)
        setRecentTickets(t.data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statsCards = [
    { title: 'Total Tickets', value: stats?.total ?? 0, icon: Ticket, color: 'indigo' },
    { title: 'Open', value: stats?.open ?? 0, icon: AlertCircle, color: 'blue' },
    { title: 'In Progress', value: stats?.in_progress ?? 0, icon: Clock, color: 'amber' },
    { title: 'Resolved', value: stats?.resolved ?? 0, icon: CheckCircle, color: 'emerald' },
    { title: 'Closed', value: stats?.closed ?? 0, icon: XCircle, color: 'slate' },
    { title: 'Critical', value: stats?.critical ?? 0, icon: Flame, color: 'red' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of all support tickets
          </p>
        </div>
        <Link to="/create" className="btn-primary shadow-md shadow-indigo-200">
          <Plus size={17} />
          New Ticket
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statsCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Resolution Rate Banner */}
      {stats?.total > 0 && (
        <div className="card p-5 mb-6 bg-gradient-to-r from-indigo-600 to-violet-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-100">Resolution Rate</p>
                <p className="text-2xl font-bold">
                  {stats.total > 0
                    ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-indigo-100">
              <p>{stats.resolved + stats.closed} resolved/closed</p>
              <p>out of {stats.total} total</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tickets */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Recent Tickets</h2>
            <p className="text-xs text-slate-400 mt-0.5">Latest support requests</p>
          </div>
          <Link
            to="/tickets"
            className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Ticket size={28} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">No tickets yet</p>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Create your first support ticket to get started
            </p>
            <Link to="/create" className="btn-primary mx-auto w-fit">
              <Plus size={16} />
              Create Ticket
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentTickets.map((t) => (
              <Link
                key={t.ticket_id}
                to={`/tickets/${t.ticket_id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors duration-100 group"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600">#{t.ticket_id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {t.issue_category}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        CATEGORY_COLORS[t.issue_category] || CATEGORY_COLORS.Other
                      }`}
                    >
                      {t.issue_category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {t.employee_name} &middot; {t.department} &middot; {formatDate(t.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
                <ArrowRight
                  size={14}
                  className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
