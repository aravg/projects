import { useEffect, useState } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

export default function Reports() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <Layout><div className="flex justify-center py-24"><div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" /></div></Layout>;

  const statusData = [
    { name: 'Open', value: stats.open, color: '#3b82f6' },
    { name: 'Assigned', value: stats.assigned, color: '#8b5cf6' },
    { name: 'In Progress', value: stats.in_progress, color: '#f59e0b' },
    { name: 'Escalated', value: stats.escalated, color: '#ef4444' },
    { name: 'Resolved', value: stats.resolved, color: '#10b981' },
    { name: 'Closed', value: stats.closed, color: '#6b7280' },
  ];

  const priorityData = Object.entries(stats.by_priority).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), count: v
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">System-wide complaint analytics overview</p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Complaints', value: stats.total, bg: 'bg-blue-500' },
            { label: 'Active Cases', value: stats.open + stats.assigned + stats.in_progress, bg: 'bg-orange-500' },
            { label: 'Resolution Rate', value: `${stats.total > 0 ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100) : 0}%`, bg: 'bg-green-500' },
            { label: 'SLA Breaches', value: stats.sla_breaches, bg: stats.sla_breaches > 0 ? 'bg-red-500' : 'bg-gray-400' },
          ].map(({ label, value, bg }) => (
            <div key={label} className="card">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Status Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData.filter(d=>d.value>0)} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Priority Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6,6,0,0]}>
                  {priorityData.map((_, i) => <Cell key={i} fill={['#10b981','#3b82f6','#f59e0b','#ef4444'][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Complaints by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.by_category} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
