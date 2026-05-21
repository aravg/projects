import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { Plus, Search, Filter, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      const res = await api.get(`/api/complaints?${params}`);
      setComplaints(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchComplaints(); }, [search, statusFilter, priorityFilter]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
            <p className="text-gray-500 text-sm">{complaints.length} total complaints</p>
          </div>
          <Link to="/complaints/new" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Complaint
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Search complaints..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {['open','assigned','in_progress','pending_customer','escalated','resolved','closed'].map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <select className="input w-40" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={fetchComplaints} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Filter size={40} className="mx-auto mb-3 opacity-30" />
              <p>No complaints found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Complaint #', 'Title', 'Customer', 'Category', 'Priority', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {complaints.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{c.complaint_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 max-w-xs truncate">{c.title}</p>
                        {c.is_escalated && <span className="text-xs text-red-500 font-medium">Escalated</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.customer?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{c.category?.name || '—'}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(c.created_at), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/complaints/${c.id}`)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
