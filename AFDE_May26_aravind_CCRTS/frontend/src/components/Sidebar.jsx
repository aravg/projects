import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, PlusCircle, Users,
  AlertTriangle, BarChart2, Bell, LogOut, ShieldCheck, List
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-white/20 text-white shadow-sm'
          : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }`
    }
  >
    <Icon size={18} />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar() {
  const { user, logout, isAdmin, isSupervisor, isAgent, canManage } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-700 to-blue-900 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">CCRTS</p>
            <p className="text-blue-200 text-xs">Complaint Tracker</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-blue-200 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider px-4 py-2">Main</p>
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/complaints" icon={List} label="All Complaints" />
        <NavItem to="/complaints/new" icon={PlusCircle} label="New Complaint" />

        {(isAgent || canManage) && (
          <>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider px-4 py-2 mt-2">Work</p>
            {isAgent && <NavItem to="/my-queue" icon={FileText} label="My Queue" />}
            {canManage && <NavItem to="/escalations" icon={AlertTriangle} label="Escalations" />}
          </>
        )}

        {canManage && (
          <>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider px-4 py-2 mt-2">Management</p>
            <NavItem to="/reports" icon={BarChart2} label="Reports" />
            {isAdmin && <NavItem to="/users" icon={Users} label="Users" />}
          </>
        )}

        <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider px-4 py-2 mt-2">Account</p>
        <NavItem to="/notifications" icon={Bell} label="Notifications" />
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-blue-100 hover:bg-white/10 hover:text-white text-sm font-medium transition-all"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
