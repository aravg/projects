import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  HeadphonesIcon,
  ChevronRight,
  BarChart2,
  Database,
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/create', icon: PlusCircle, label: 'New Ticket', end: false },
  { to: '/tickets', icon: Ticket, label: 'All Tickets', end: false },
]

const analyticsItems = [
  { to: '/analytics', icon: BarChart2, label: 'Analytics', end: false },
  { to: '/etl', icon: Database, label: 'ETL Manager', end: false },
]

export default function Sidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 text-white flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <HeadphonesIcon size={16} />
          </div>
          <div>
            <p className="font-bold text-sm leading-none">HelpDesk</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Ticket Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2">
          Navigation
        </p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={13} className="opacity-70" />}
              </>
            )}
          </NavLink>
        ))}

        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pb-2 pt-5">
          Analytics
        </p>
        {analyticsItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={13} className="opacity-70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            IT
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">IT Support</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
