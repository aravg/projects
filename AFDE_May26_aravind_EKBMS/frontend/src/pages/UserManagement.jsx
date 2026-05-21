import React, { useState, useEffect } from 'react'
import { Users, Search, Shield, ToggleLeft, ToggleRight, Trash2, Crown, Edit } from 'lucide-react'
import { usersAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const ROLES = ['admin', 'author', 'reviewer', 'employee']

const ROLE_CONFIG = {
  admin: { label: 'Admin', class: 'bg-purple-100 text-purple-700', icon: '👑' },
  author: { label: 'Author', class: 'bg-blue-100 text-blue-700', icon: '✍️' },
  reviewer: { label: 'Reviewer', class: 'bg-green-100 text-green-700', icon: '🔍' },
  employee: { label: 'Employee', class: 'bg-slate-100 text-slate-700', icon: '👤' }
}

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const { user: currentUser } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await usersAPI.getAll(params)
      setUsers(res.data.data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 400)
    return () => clearTimeout(timer)
  }, [search, roleFilter])

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser.id) { toast.error("You can't change your own role"); return }
    setActionLoading(userId + '-role')
    try {
      await usersAPI.updateRole(userId, newRole)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success('Role updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser.id) { toast.error("You can't deactivate your own account"); return }
    setActionLoading(user.id + '-status')
    try {
      const res = await usersAPI.updateStatus(user.id)
      setUsers(prev => prev.map(u => u.id === user.id ? res.data.data : u))
      toast.success(`User ${res.data.data.is_active ? 'activated' : 'deactivated'}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (user) => {
    if (user.id === currentUser.id) { toast.error("You can't delete your own account"); return }
    if (!window.confirm(`Delete user "${user.name}"? This action cannot be undone.`)) return
    try {
      await usersAPI.delete(user.id)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      toast.success('User deleted')
    } catch {
      toast.error('Failed to delete user')
    }
  }

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const roleCounts = ROLES.reduce((acc, role) => ({
    ...acc,
    [role]: users.filter(u => u.role === role).length
  }), {})

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">User Management</h2>
        <p className="text-sm text-slate-500 mt-0.5">{users.length} users registered</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {ROLES.map(role => {
          const cfg = ROLE_CONFIG[role]
          return (
            <div key={role} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
              <span className="text-2xl">{cfg.icon}</span>
              <div>
                <p className="text-2xl font-bold text-slate-900">{roleCounts[role] || 0}</p>
                <p className="text-xs text-slate-500">{cfg.label}s</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r} className="capitalize">{ROLE_CONFIG[r].label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><LoadingSpinner fullScreen={false} /></div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => {
                  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.employee
                  const isSelf = user.id === currentUser.id
                  return (
                    <tr key={user.id} className={`hover:bg-slate-50 transition-colors ${!user.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                            user.role === 'admin' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                            user.role === 'author' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                            user.role === 'reviewer' ? 'bg-gradient-to-br from-green-500 to-green-700' :
                            'bg-gradient-to-br from-slate-400 to-slate-600'
                          }`}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                              {user.name}
                              {isSelf && <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">You</span>}
                            </p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isSelf ? (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleCfg.class}`}>
                            {roleCfg.label}
                          </span>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={actionLoading === user.id + '-role'}
                            className="text-xs font-medium border border-slate-200 rounded-xl px-2 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
                          >
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-600">{user.department || '—'}</span>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-xs text-slate-400">{formatDate(user.created_at)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {!isSelf && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              disabled={actionLoading === user.id + '-status'}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                user.is_active
                                  ? 'text-green-500 hover:bg-green-50'
                                  : 'text-red-500 hover:bg-red-50'
                              } disabled:opacity-40`}
                            >
                              {user.is_active
                                ? <ToggleRight className="w-5 h-5" />
                                : <ToggleLeft className="w-5 h-5" />
                              }
                            </button>
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement
