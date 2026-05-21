import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, CheckCircle, AlertTriangle, Clock, TrendingUp, Users, Activity, Shield } from 'lucide-react';
import Layout from '../components/Layout';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    </Layout>
  );

  const statusData = [
    { name: 'Open', value: stats.open },
    { name: 'Assigned', value: stats.assigned },
    { name: 'In Progress', value: stats.in_progress },
    { name: 'Escalated', value: stats.escalated },
    { name: 'Resolved', value: stats.resolved },
    { name: 'Closed', value: stats.closed },
  ].filter(d => d.value > 0);

  const priorityData = Object.entries(stats.by_priority).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), value: v
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Welcome back, {user?.name}</p>
          </div>
          <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full capitalize border border-blue-100">
            {user?.role}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Complaints" value={stats.total} icon={FileText} color="bg-blue-500" />
          <StatCard title="Open" value={stats.open + stats.assigned + stats.in_progress} icon={Activity} color="bg-orange-500" sub="Awaiting resolution" />
          <StatCard title="Resolved" value={stats.resolved + stats.closed} icon={CheckCircle} color="bg-green-500" />
          <StatCard title="SLA Breaches" value={stats.sla_breaches} icon={AlertTriangle} color={stats.sla_breaches > 0 ? "bg-red-500" : "bg-gray-400"} sub={stats.sla_breaches > 0 ? "Needs attention!" : "All on track"} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Complaints by Status</h3>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm text-center py-12">No data available</p>}
          </div>

          {/* Priority Distribution */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Complaints by Priority</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barSize={36}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityData.map((_, i) => (
                    <Cell key={i} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444'][i % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown */}
        {stats.by_category.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.by_category} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quick Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Open', val: stats.open, color: 'text-blue-600 bg-blue-50 border-blue-100' },
            { label: 'In Progress', val: stats.in_progress, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
            { label: 'Escalated', val: stats.escalated, color: 'text-red-600 bg-red-50 border-red-100' },
            { label: 'Resolved', val: stats.resolved, color: 'text-green-600 bg-green-50 border-green-100' },
          ].map(({ label, val, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-2xl font-bold">{val}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
