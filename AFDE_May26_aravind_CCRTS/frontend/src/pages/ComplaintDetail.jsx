import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, User, Calendar, AlertTriangle, CheckCircle, UserCheck, MessageSquare } from 'lucide-react';

export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusComment, setStatusComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [feedback, setFeedback] = useState({ rating: 5, comments: '' });
  const { user, canManage, isAgent } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api.get(`/api/complaints/${id}`);
      setComplaint(res.data);
      setSelectedStatus(res.data.status);
    } catch { toast.error('Complaint not found'); navigate('/complaints'); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (canManage) api.get('/api/users/agents').then(r => setAgents(r.data)).catch(() => {});
  }, [id]);

  const updateStatus = async () => {
    try {
      await api.post(`/api/complaints/${id}/status`, { status: selectedStatus, comment: statusComment });
      toast.success('Status updated');
      setStatusComment('');
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const assignAgent = async () => {
    if (!selectedAgent) return toast.error('Select an agent');
    try {
      await api.post(`/api/complaints/${id}/assign`, { agent_id: parseInt(selectedAgent) });
      toast.success('Complaint assigned');
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const escalate = async () => {
    if (!escalateReason) return toast.error('Provide escalation reason');
    try {
      await api.post(`/api/complaints/${id}/escalate`, { reason: escalateReason });
      toast.success('Complaint escalated');
      setEscalateReason('');
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const submitFeedback = async () => {
    try {
      await api.post(`/api/feedback/${id}`, feedback);
      toast.success('Feedback submitted!');
      load();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  if (loading) return <Layout><div className="flex justify-center py-24"><div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" /></div></Layout>;
  if (!complaint) return null;

  const isOwner = user?.id === complaint.customer?.id;
  const isAssignedAgent = user?.id === complaint.agent?.id;
  const canUpdateStatus = canManage || isAssignedAgent;
  const slaBreached = complaint.sla_deadline && new Date(complaint.sla_deadline) < new Date() && !['resolved', 'closed'].includes(complaint.status);

  return (
    <Layout>
      <div className="max-w-4xl space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={16} /> Back to Complaints
        </button>

        {/* Header Card */}
        <div className="card">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">{complaint.complaint_number}</span>
                {complaint.is_escalated && <span className="bg-red-100 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full border border-red-200">Escalated</span>}
                {slaBreached && <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-200">SLA Breached</span>}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{complaint.title}</h1>
              <p className="text-gray-500 text-sm mt-1">{complaint.category?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 text-sm leading-relaxed">{complaint.description}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <User size={14} />
              <span>{complaint.customer?.name || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <UserCheck size={14} />
              <span>{complaint.agent?.name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar size={14} />
              <span>{format(new Date(complaint.created_at), 'MMM d, yyyy')}</span>
            </div>
            <div className={`flex items-center gap-2 ${slaBreached ? 'text-red-500' : 'text-gray-500'}`}>
              <AlertTriangle size={14} />
              <span>{complaint.sla_deadline ? `SLA: ${format(new Date(complaint.sla_deadline), 'MMM d, HH:mm')}` : '—'}</span>
            </div>
          </div>

          {complaint.resolution_notes && (
            <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
              <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1"><CheckCircle size={13} /> Resolution Notes</p>
              <p className="text-sm text-green-800">{complaint.resolution_notes}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Update Status */}
            {canUpdateStatus && !['closed'].includes(complaint.status) && (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Update Status</h3>
                <select className="input mb-3" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                  {['open','assigned','in_progress','pending_customer','resolved','closed'].map(s => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <textarea className="input text-sm resize-none mb-3" rows={2} placeholder="Add comment..." value={statusComment} onChange={e => setStatusComment(e.target.value)} />
                <button onClick={updateStatus} className="btn-primary w-full text-sm">Update Status</button>
              </div>
            )}

            {/* Assign Agent */}
            {canManage && (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Assign Agent</h3>
                <select className="input mb-3" value={selectedAgent} onChange={e => setSelectedAgent(e.target.value)}>
                  <option value="">Select agent...</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <button onClick={assignAgent} className="btn-primary w-full text-sm">Assign</button>
              </div>
            )}

            {/* Escalate */}
            {!complaint.is_escalated && !['resolved','closed'].includes(complaint.status) && (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Escalate Complaint</h3>
                <textarea className="input text-sm resize-none mb-3" rows={2} placeholder="Reason for escalation..." value={escalateReason} onChange={e => setEscalateReason(e.target.value)} />
                <button onClick={escalate} className="btn-danger w-full text-sm">Escalate</button>
              </div>
            )}

            {/* Feedback */}
            {isOwner && ['resolved','closed'].includes(complaint.status) && !complaint.feedback && (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm">Rate Resolution</h3>
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setFeedback({...feedback, rating: n})}
                      className={`text-xl ${n <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>&#9733;</button>
                  ))}
                </div>
                <textarea className="input text-sm resize-none mb-3" rows={2} placeholder="Any comments?" value={feedback.comments} onChange={e => setFeedback({...feedback, comments: e.target.value})} />
                <button onClick={submitFeedback} className="btn-primary w-full text-sm">Submit Feedback</button>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare size={16} /> Activity Timeline
              </h3>
              {complaint.history.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {[...complaint.history].reverse().map((h, i) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-blue-500' : 'bg-gray-300'}`}>
                          {h.user?.name?.charAt(0) || '?'}
                        </div>
                        {i < complaint.history.length - 1 && <div className="w-0.5 bg-gray-100 flex-1 mt-2" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-800">{h.user?.name || 'System'}</span>
                          {h.old_status && h.new_status && (
                            <span className="text-xs text-gray-500">
                              {h.old_status} &rarr; <span className="font-medium text-gray-700">{h.new_status}</span>
                            </span>
                          )}
                          <span className="text-xs text-gray-400 ml-auto">{formatDistanceToNow(new Date(h.updated_at), { addSuffix: true })}</span>
                        </div>
                        {h.comment && <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">{h.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
