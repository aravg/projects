import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Eye, User, FolderOpen, CheckSquare, History, X } from 'lucide-react'
import { approvalsAPI } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

function ApprovalQueue() {
  const [tab, setTab] = useState('pending')
  const [pending, setPending] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchPending()
  }, [])

  useEffect(() => {
    if (tab === 'history' && history.length === 0) {
      fetchHistory()
    }
  }, [tab])

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await approvalsAPI.getPending()
      setPending(res.data.data)
    } catch {
      toast.error('Failed to load pending articles')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await approvalsAPI.getHistory()
      setHistory(res.data.data)
    } catch {
      toast.error('Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleApprove = async (articleId, title) => {
    if (!window.confirm(`Approve "${title}"? It will be published immediately.`)) return
    setActionLoading(articleId)
    try {
      await approvalsAPI.approve(articleId, {})
      toast.success('Article approved and published!')
      setPending(prev => prev.filter(a => a.id !== articleId))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return }
    setActionLoading(rejectModal.id)
    try {
      await approvalsAPI.reject(rejectModal.id, { reason: rejectReason })
      toast.success('Article rejected')
      setPending(prev => prev.filter(a => a.id !== rejectModal.id))
      setRejectModal(null)
      setRejectReason('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Approval Queue</h2>
        <p className="text-sm text-slate-500 mt-0.5">Review and manage article submissions</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'pending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          Pending
          {pending.length > 0 && (
            <span className="w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            tab === 'history' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
      </div>

      {tab === 'pending' && (
        <div>
          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner fullScreen={false} /></div>
          ) : pending.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">All clear!</h3>
              <p className="text-slate-400 text-sm">No articles are waiting for review</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map(article => (
                <div key={article.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {article.category_name && (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                              style={{ backgroundColor: article.category_color || '#6366f1' }}>
                              {article.category_name}
                            </span>
                          )}
                          <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        </div>

                        <Link to={`/articles/${article.id}`} className="group">
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors mb-1.5">
                            {article.title}
                          </h3>
                        </Link>

                        {article.summary && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-3">{article.summary}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-medium text-slate-600">{article.author_name}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Submitted {formatDate(article.updated_at || article.created_at)}
                          </span>
                          {article.tags?.length > 0 && (
                            <span className="hidden sm:block">
                              {article.tags.slice(0, 3).map(t => `#${t.name}`).join(' ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Link
                          to={`/articles/${article.id}`}
                          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" /> Preview
                        </Link>
                        <button
                          onClick={() => handleApprove(article.id, article.title)}
                          disabled={actionLoading === article.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-60"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {actionLoading === article.id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => setRejectModal(article)}
                          disabled={actionLoading === article.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div>
          {historyLoading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner fullScreen={false} /></div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No history yet</h3>
              <p className="text-slate-400 text-sm">Approval actions will appear here</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Article</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Author</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reviewer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link to={`/articles/${entry.article_id}`} className="font-medium text-slate-800 hover:text-indigo-600 text-sm transition-colors line-clamp-1">
                          {entry.article_title}
                        </Link>
                        {entry.comments && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{entry.comments}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{entry.author_name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          entry.action === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.action === 'approved'
                            ? <CheckCircle className="w-3.5 h-3.5" />
                            : <XCircle className="w-3.5 h-3.5" />
                          }
                          {entry.action === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-600">{entry.reviewer_name}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{formatDate(entry.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Reject Article</h3>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 rounded-xl p-3 mb-4">
                <p className="text-sm font-semibold text-slate-800 line-clamp-2">{rejectModal.title}</p>
                <p className="text-xs text-slate-500 mt-1">by {rejectModal.author_name}</p>
              </div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this article is being rejected. The author will be notified..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50"
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { setRejectModal(null); setRejectReason('') }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !rejectReason.trim()}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalQueue
