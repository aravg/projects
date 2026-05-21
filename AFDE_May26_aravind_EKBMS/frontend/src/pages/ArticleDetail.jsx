import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Eye, Star, Bookmark, Clock, User, Tag, FolderOpen,
  MessageSquare, Paperclip, Download, Send, Trash2, CheckCircle, XCircle,
  AlertCircle, FileText
} from 'lucide-react'
import { articlesAPI, commentsAPI, approvalsAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  draft: { label: 'Draft', class: 'bg-slate-100 text-slate-700', icon: FileText },
  pending_approval: { label: 'Pending Review', class: 'bg-amber-100 text-amber-800', icon: AlertCircle },
  approved: { label: 'Published', class: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-800', icon: XCircle },
  archived: { label: 'Archived', class: 'bg-purple-100 text-purple-800', icon: FileText }
}

function StarRating({ value, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => !readOnly && onChange && onChange(i + 1)}
          onMouseEnter={() => !readOnly && setHovered(i + 1)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              i < (hovered || value)
                ? 'text-amber-400 fill-amber-400'
                : 'text-slate-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [article, setArticle] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [avgRating, setAvgRating] = useState(0)
  const [relatedArticles, setRelatedArticles] = useState([])
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [approvalLoading, setApprovalLoading] = useState(false)

  useEffect(() => {
    fetchArticle()
    fetchComments()
  }, [id])

  const fetchArticle = async () => {
    setLoading(true)
    try {
      const res = await articlesAPI.getOne(id)
      const art = res.data.data
      setArticle(art)
      setBookmarked(art.isBookmarked || false)
      setUserRating(art.userRating || 0)
      setAvgRating(art.avg_rating || 0)
      if (art.category_id) {
        fetchRelated(art.category_id, art.id)
      }
    } catch (err) {
      toast.error('Failed to load article')
      navigate('/articles')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await commentsAPI.getAll(id)
      setComments(res.data.data)
    } catch {}
  }

  const fetchRelated = async (categoryId, currentId) => {
    try {
      const res = await articlesAPI.getAll({ category: categoryId, status: 'approved', limit: 5 })
      setRelatedArticles(res.data.data.articles.filter(a => a.id !== currentId).slice(0, 4))
    } catch {}
  }

  const handleBookmark = async () => {
    try {
      const res = await articlesAPI.bookmark(id)
      setBookmarked(res.data.data.bookmarked)
      toast.success(res.data.data.bookmarked ? 'Bookmarked!' : 'Bookmark removed')
    } catch {
      toast.error('Failed to update bookmark')
    }
  }

  const handleRate = async (rating) => {
    try {
      const res = await articlesAPI.rate(id, rating)
      setUserRating(rating)
      setAvgRating(res.data.data.avgRating)
      toast.success('Rating saved!')
    } catch {
      toast.error('Failed to save rating')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setCommentLoading(true)
    try {
      const res = await commentsAPI.create(id, { content: newComment })
      setComments(prev => [...prev, res.data.data])
      setNewComment('')
      toast.success('Comment added!')
    } catch {
      toast.error('Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await commentsAPI.delete(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const handleApprove = async () => {
    setApprovalLoading(true)
    try {
      await approvalsAPI.approve(id, {})
      toast.success('Article approved and published!')
      fetchArticle()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve')
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setApprovalLoading(true)
    try {
      await approvalsAPI.reject(id, { reason: rejectReason })
      toast.success('Article rejected')
      setShowRejectModal(false)
      fetchArticle()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject')
    } finally {
      setApprovalLoading(false)
    }
  }

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'

  const renderContent = (content) => {
    if (!content) return ''
    return content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^---$/gm, '<hr>')
      .replace(/^\| (.+) \|$/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim())
        return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
      })
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
  }

  if (loading) return <LoadingSpinner fullScreen={false} />

  if (!article) return null

  const statusCfg = STATUS_CONFIG[article.status] || STATUS_CONFIG.draft
  const StatusIcon = statusCfg.icon
  const isOwner = user?.id === article.author_id
  const isAdminOrReviewer = ['admin', 'reviewer'].includes(user?.role)
  const canEdit = isOwner || user?.role === 'admin'
  const canApprove = isAdminOrReviewer && article.status === 'pending_approval'

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span>/</span>
          <Link to="/articles" className="hover:text-slate-900 transition-colors">Articles</Link>
          {article.category_name && (
            <>
              <span>/</span>
              <Link to={`/articles?category=${article.category_id}`} className="hover:text-slate-900">{article.category_name}</Link>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link
              to={`/articles/${id}/edit`}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit
            </Link>
          )}
          {canApprove && (
            <>
              <button
                onClick={handleApprove}
                disabled={approvalLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={approvalLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {article.category_name && (
                    <span className="text-sm font-semibold px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: article.category_color || '#6366f1' }}>
                      {article.category_name}
                    </span>
                  )}
                  {article.is_featured === 1 && (
                    <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Featured</span>
                  )}
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${statusCfg.class}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusCfg.label}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{article.title}</h1>

              {article.summary && (
                <p className="text-slate-500 text-base leading-relaxed border-l-4 border-indigo-300 pl-4 mb-5 italic">
                  {article.summary}
                </p>
              )}

              {article.rejection_reason && article.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">Rejection Reason</p>
                      <p className="text-sm text-red-700 mt-1">{article.rejection_reason}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-500 mb-6 flex-wrap pb-5 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(article.author_name)}
                  </div>
                  <span className="font-medium text-slate-700">{article.author_name}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(article.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {article.view_count?.toLocaleString() || 0} views
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {article.comment_count || 0} comments
                </span>
              </div>

              <div
                className="article-content prose max-w-none"
                dangerouslySetInnerHTML={{ __html: renderContent(article.content) }}
              />
            </div>
          </div>

          {article.attachments && article.attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-indigo-500" />
                Attachments ({article.attachments.length})
              </h3>
              <div className="space-y-2">
                {article.attachments.map(att => (
                  <a
                    key={att.id}
                    href={`/uploads/${att.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-indigo-300 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{att.original_name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(att.file_size)}</p>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              Comments ({comments.length})
            </h3>

            {user && (
              <form onSubmit={handleComment} className="mb-6">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!newComment.trim() || commentLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {commentLoading ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-6">No comments yet. Be the first!</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {getInitials(comment.user_name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800 text-sm">{comment.user_name}</span>
                        <span className="text-xs text-slate-400">{formatDate(comment.created_at)}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{comment.user_role}</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{comment.content}</p>
                    </div>
                    {(user?.id === comment.user_id || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  bookmarked
                    ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-indigo-600' : ''}`} />
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>

              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{Number(avgRating).toFixed(1)}</p>
                <p className="text-xs text-slate-400">avg rating</p>
              </div>
            </div>

            {user && (
              <div>
                <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Your Rating</p>
                <StarRating value={userRating} onChange={handleRate} />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Article Info</h4>
            <div className="space-y-3">
              {[
                { icon: User, label: 'Author', value: article.author_name },
                { icon: FolderOpen, label: 'Category', value: article.category_name || 'Uncategorized' },
                { icon: Clock, label: 'Published', value: formatDate(article.created_at) },
                { icon: Eye, label: 'Views', value: article.view_count?.toLocaleString() || '0' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className="text-sm font-medium text-slate-700">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h4 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <Link
                    key={tag.id}
                    to={`/search?tag=${tag.name}`}
                    className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {relatedArticles.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h4 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Related Articles</h4>
              <div className="space-y-3">
                {relatedArticles.map(rel => (
                  <Link key={rel.id} to={`/articles/${rel.id}`} className="block group">
                    <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{rel.view_count} views</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
            <div className="p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-1">Reject Article</h3>
              <p className="text-sm text-slate-500 mb-4">Provide a reason for rejection. The author will be notified.</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this article is being rejected..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50"
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={approvalLoading || !rejectReason.trim()}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {approvalLoading ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArticleDetail
