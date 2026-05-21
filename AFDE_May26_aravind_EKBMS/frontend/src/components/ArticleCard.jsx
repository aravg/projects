import React from 'react'
import { Link } from 'react-router-dom'
import { Eye, Star, Bookmark, Clock, User, Tag } from 'lucide-react'

const STATUS_CONFIG = {
  draft: { label: 'Draft', class: 'bg-slate-100 text-slate-600' },
  pending_approval: { label: 'Pending Review', class: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', class: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
  archived: { label: 'Archived', class: 'bg-purple-100 text-purple-700' }
}

function ArticleCard({ article, showStatus = false, onEdit, onDelete, onSubmit, currentUserId, currentUserRole }) {
  const status = STATUS_CONFIG[article.status] || STATUS_CONFIG.draft
  const isOwner = currentUserId === article.author_id
  const isAdminOrReviewer = ['admin', 'reviewer'].includes(currentUserRole)

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'

  const renderStars = (rating) => {
    const stars = Math.round(rating || 0)
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
    ))
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm card-hover overflow-hidden flex flex-col h-full">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-3">
          {article.category_name && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: article.category_color || '#6366f1' }}
            >
              {article.category_name}
            </span>
          )}
          {showStatus && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.class} ml-auto flex-shrink-0`}>
              {status.label}
            </span>
          )}
        </div>

        <Link to={`/articles/${article.id}`} className="group flex-1">
          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
              {article.summary}
            </p>
          )}
        </Link>

        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {article.tags.slice(0, 3).map(tag => (
              <span key={tag.id} className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                <Tag className="w-2.5 h-2.5" />
                {tag.name}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="text-xs text-slate-400 px-1">+{article.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(article.author_name)}
          </div>
          <span className="text-xs text-slate-600 font-medium truncate">{article.author_name}</span>
          <span className="text-slate-300 text-xs ml-auto flex-shrink-0">
            <Clock className="w-3 h-3 inline mr-1" />
            {formatDate(article.created_at)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Eye className="w-3.5 h-3.5" />
              {article.view_count?.toLocaleString() || 0}
            </span>
            <span className="flex items-center gap-0.5">
              {renderStars(article.avg_rating)}
            </span>
          </div>

          {(isOwner || isAdminOrReviewer) && (
            <div className="flex items-center gap-1">
              {isOwner && article.status === 'draft' && onSubmit && (
                <button
                  onClick={() => onSubmit(article.id)}
                  className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium"
                >
                  Submit
                </button>
              )}
              {(isOwner || isAdminOrReviewer) && onEdit && (
                <button
                  onClick={() => onEdit(article.id)}
                  className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Edit
                </button>
              )}
              {(isOwner || currentUserRole === 'admin') && onDelete && (
                <button
                  onClick={() => onDelete(article.id, article.title)}
                  className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ArticleCard
