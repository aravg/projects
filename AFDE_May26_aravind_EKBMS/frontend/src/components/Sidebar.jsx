import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, FolderOpen, Search,
  CheckSquare, Users, BarChart3, BookOpen,
  LogOut, ChevronRight, Settings, Database
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: null },
  { path: '/articles', icon: FileText, label: 'Articles', roles: null },
  { path: '/categories', icon: FolderOpen, label: 'Categories', roles: null },
  { path: '/search', icon: Search, label: 'Search', roles: null },
  { path: '/approvals', icon: CheckSquare, label: 'Approval Queue', roles: ['reviewer', 'admin'] },
  { path: '/users', icon: Users, label: 'User Management', roles: ['admin'] },
  { path: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin'] },
  { path: '/etl', icon: Database, label: 'ETL Management', roles: ['admin'] },
]

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-500/20 text-purple-300',
      author: 'bg-blue-500/20 text-blue-300',
      reviewer: 'bg-green-500/20 text-green-300',
      employee: 'bg-slate-500/20 text-slate-300'
    }
    return colors[role] || colors.employee
  }

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user?.role)
  })

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30
        flex flex-col
        transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: '#0f172a' }}>

        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">EKBMS</span>
            <p className="text-slate-400 text-xs">Knowledge Base</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto sidebar-scroll space-y-1">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Navigation</p>

          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group
                ${isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getRoleBadgeColor(user?.role)}`}>
                {user?.role}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <NavLink
              to="/profile"
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              Profile
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
