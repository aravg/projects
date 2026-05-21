import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import toast from 'react-hot-toast';
import { ArrowLeft, Send } from 'lucide-react';

export default function CreateComplaint() {
  const [form, setForm] = useState({ title: '', description: '', category_id: '', priority: 'medium' });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, category_id: form.category_id ? parseInt(form.category_id) : null };
      const res = await api.post('/api/complaints', payload);
      toast.success(`Complaint ${res.data.complaint_number} created!`);
      navigate(`/complaints/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="card">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Register New Complaint</h1>
          <p className="text-sm text-gray-500 mb-6">Fill in the details below. A complaint ID will be auto-generated.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Complaint Title *</label>
              <input
                className="input"
                placeholder="Brief description of your complaint"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Priority *</label>
                <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low (72h SLA)</option>
                  <option value="medium">Medium (48h SLA)</option>
                  <option value="high">High (24h SLA)</option>
                  <option value="critical">Critical (4h SLA)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea
                className="input min-h-32 resize-none"
                placeholder="Provide detailed information about your complaint..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
                rows={5}
              />
            </div>

            {/* Priority info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-800 mb-2">SLA Guidelines</p>
              <div className="grid grid-cols-2 gap-1 text-blue-700 text-xs">
                <span>Low priority: 72 hours</span>
                <span>Medium priority: 48 hours</span>
                <span>High priority: 24 hours</span>
                <span>Critical priority: 4 hours</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                <Send size={16} />
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
