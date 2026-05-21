import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Building2, Shield, Edit, Save, X, Lock, Eye, EyeOff, FileText, Bookmark, Calendar } from 'lucide-react'
import { authAPI, articlesAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  draft: { label: 'Draft', class: 'bg-slate-100 text-slate-600' },
  pending_approval: { label: 'Pending', class: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', class: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', class: 'bg-red-100 text-red-700' },
  archived: { label: 'Archived', class: 'bg-purple-100 text-purple-700' }
}

const ROLE_CONFIG = {
  admin: { label: 'Administrator', class: 'bg-purple-100 text-purple-700', description: 'Full system access' },
  author: { label: 'Author', class: 'bg-blue-100 text-blue-700', description: 'Create and manage articles' },
  reviewer: { label: 'Reviewer', class: 'bg-green-100 text-green-700', description: 'Review and approve content' },
  employee: { label: 'Employee', class: 'bg-slate-100 text-slate-700', description: 'Read and comment on articles' }
}

function Profile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', department: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showPwForm, setShowPwForm] = useState(false)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [myArticles, setMyArticles] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [activeTab, setActiveTab] = useState('articles')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, department: user.department || '' })
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    setDataLoading(true)
    try {
      const [artRes, bookmarkRes] = await Promise.all([
        articlesAPI.getAll({ author: user.id, limit: 50 }),
        articlesAPI.getAll({ limit: 50, status: 'approved' })
      ])
      setMyArticles(artRes.data.data.articles || [])
    } catch {}

    try {
      const res = await articlesAPI.getAll({ limit: 100 })
      const articles = res.data.data.articles || []
      const bookmarkChecks = await Promise.allSettled(
        articles.slice(0, 20).map(a => articlesAPI.getBookmark(a.id).then(r => ({ ...a, isBookmarked: r.data.data.bookmarked })))
      )
      setBookmarks(bookmarkChecks
        .filter(r => r.status === 'fulfilled' && r.value.isBookmarked)
        .map(r => r.value)
      )
    } catch {}
    setDataLoading(false)
  }

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const res = await authAPI.updateProfile({ name: form.name, department: form.department })
      updateUser(res.data.data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('All fields are required'); return }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Passwords don't match"); return }
    setPwLoading(true)
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed successfully!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPwForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  if (!user) return <LoadingSpinner fullScreen={false} />

  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.employee

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-6">My Profile</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-lg">
              {getInitials(user.name)}
            </div>
            <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
            <p className="text-sm text-slate-500 mb-3">{user.email}</p>
            <span className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-full ${roleCfg.class}`}>
              {roleCfg.label}
            </span>
            <p className="text-xs text-slate-400 mt-2">{roleCfg.description}</p>

            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{myArticles.length}</p>
                <p className="text-xs text-slate-400">Articles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{bookmarks.length}</p>
                <p className="text-xs text-slate-400">Bookmarks</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Profile Info</h4>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                  <input
                    value={form.department}
                    onChange={(e) => setForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setEditing(false); setForm({ name: user.name, department: user.department || '' }) }}
                    className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50">
                    Cancel
                  </button>
                  <button onClick={handleSaveProfile} disabled={saving}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-1.5">
                    {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: User, label: 'Name', value: user.name },
                  { icon: Mail, label: 'Email', value: user.email },
                  { icon: Building2, label: 'Department', value: user.department || 'Not set' },
                  { icon: Shield, label: 'Role', value: roleCfg.label },
                  { icon: Calendar, label: 'Member Since', value: formatDate(user.created_at) }
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-medium text-slate-700">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4" /> Security
              </h4>
              <button
                onClick={() => setShowPwForm(!showPwForm)}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
              >
                {showPwForm ? 'Cancel' : 'Change'}
              </button>
            </div>

            {showPwForm ? (
              <form onSubmit={handleChangePassword} className="space-y-3">
                {[
                  { field: 'currentPassword', label: 'Current Password', show: showCurrentPw, setShow: setShowCurrentPw },
                  { field: 'newPassword', label: 'New Password', show: showNewPw, setShow: setShowNewPw },
                  { field: 'confirmPassword', label: 'Confirm New Password', show: showNewPw, setShow: null }
                ].map(({ field, label, show, setShow }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                    <div className="relative">
                      <input
                        type={show ? 'text' : 'password'}
                        value={pwForm[field]}
                        onChange={(e) => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-9"
                      />
                      {setShow && (
                        <button type="button" onClick={() => setShow(!show)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={pwLoading}
                  className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
                  {pwLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500">Keep your account secure with a strong password.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
              {[
                { id: 'articles', icon: FileText, label: 'My Articles', count: myArticles.length },
                { id: 'bookmarks', icon: Bookmark, label: 'Bookmarks', count: bookmarks.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {dataLoading ? (
              <div className="py-12 flex justify-center"><LoadingSpinner fullScreen={false} /></div>
            ) : activeTab === 'articles' ? (
              <div className="divide-y divide-slate-50">
                {myArticles.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No articles yet</p>
                    {(user.role === 'author' || user.role === 'admin') && (
                      <Link to="/articles/create"
                        className="inline-block mt-3 text-sm text-indigo-600 font-semibold hover:text-indigo-800">
                        Create your first article
                      </Link>
                    )}
                  </div>
                ) : (
                  myArticles.map(article => {
                    const s = STATUS_CONFIG[article.status] || STATUS_CONFIG.draft
                    return (
                      <Link key={article.id} to={`/articles/${article.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{article.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{article.category_name || 'Uncategorized'} · {new Date(article.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${s.class}`}>{s.label}</span>
                      </Link>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {bookmarks.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No bookmarks yet</p>
                    <Link to="/articles" className="inline-block mt-3 text-sm text-indigo-600 font-semibold hover:text-indigo-800">
                      Browse articles
                    </Link>
                  </div>
                ) : (
                  bookmarks.map(article => (
                    <Link key={article.id} to={`/articles/${article.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: (article.category_color || '#6366f1') + '20' }}>
                        <Bookmark className="w-5 h-5" style={{ color: article.category_color || '#6366f1' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{article.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{article.category_name || 'Uncategorized'} · {article.author_name}</p>
                      </div>
                      <span className="text-xs text-slate-400">{article.view_count?.toLocaleString()} views</span>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
