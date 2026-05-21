import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import PriorityBadge from '../components/PriorityBadge';
import { format } from 'date-fns';
import { AlertTriangle, Eye } from 'lucide-react';

export default function Escalations() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/complaints?status=escalated&limit=100').then(r => setComplaints(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Escalated Complaints</h1>
            <p className="text-gray-500 text-sm">{complaints.length} complaints requiring immediate attention</p>
          </div>
        </div>
        {complaints.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
            <strong>{complaints.length}</strong> complaint{complaints.length > 1 ? 's have' : ' has'} been escalated and require immediate attention from supervisors.
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-16 text-gray-400"><AlertTriangle size={40} className="mx-auto mb-3 opacity-30" /><p>No escalated complaints</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-red-50 border-b border-red-100">
                <tr>
                  {['Complaint #','Title','Customer','Agent','Priority','Escalated On','Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-red-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {complaints.map(c => (
                  <tr key={c.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-4 py-3"><span className="font-mono text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100">{c.complaint_number}</span></td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.title}</td>
                    <td className="px-4 py-3 text-gray-500">{c.customer?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.agent?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(c.updated_at), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/complaints/${c.id}`)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"><Eye size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
