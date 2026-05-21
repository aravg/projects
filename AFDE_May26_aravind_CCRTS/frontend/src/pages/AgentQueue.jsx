import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { format } from 'date-fns';
import { Eye, Inbox } from 'lucide-react';

export default function AgentQueue() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/complaints?limit=100').then(r => setComplaints(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Work Queue</h1>
          <p className="text-gray-500 text-sm">Complaints assigned to you</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {['assigned','in_progress','pending_customer'].map(s => (
            <div key={s} className="card text-center">
              <p className="text-3xl font-bold text-gray-900">{complaints.filter(c => c.status === s).length}</p>
              <p className="text-sm text-gray-500 capitalize mt-1">{s.replace('_',' ')}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><Inbox size={40} className="mx-auto mb-3 opacity-30" /><p>No complaints in queue</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['#','Title','Customer','Priority','Status','SLA Deadline','Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {complaints.map(c => {
                  const slaBreached = c.sla_deadline && new Date(c.sla_deadline) < new Date() && !['resolved','closed'].includes(c.status);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3"><span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{c.complaint_number}</span></td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{c.title}</td>
                      <td className="px-4 py-3 text-gray-500">{c.customer?.name}</td>
                      <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className={`px-4 py-3 text-xs ${slaBreached ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {c.sla_deadline ? format(new Date(c.sla_deadline), 'MMM d, HH:mm') : '—'}
                        {slaBreached && ' (Breached)'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/complaints/${c.id}`)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"><Eye size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
