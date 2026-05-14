import { useState, useEffect } from 'react';
import { borrowersAPI } from '../services/api';

const emptyForm = { borrower_name: '', email: '', phone: '' };

export default function Borrowers() {
  const [borrowers, setBorrowers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editBorrower, setEditBorrower] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBorrowers = () => {
    borrowersAPI.getAll().then(res => {
      setBorrowers(res.data);
      setFiltered(res.data);
    }).catch(() => setError('Failed to load borrowers'));
  };

  useEffect(() => { fetchBorrowers(); }, []);

  useEffect(() => {
    const q = searchText.toLowerCase();
    setFiltered(borrowers.filter(b =>
      b.borrower_name.toLowerCase().includes(q) ||
      b.email.toLowerCase().includes(q) ||
      b.phone.includes(q)
    ));
  }, [searchText, borrowers]);

  const openAdd = () => { setForm(emptyForm); setEditBorrower(null); setShowModal(true); setError(''); };
  const openEdit = (b) => { setForm({ ...b }); setEditBorrower(b); setShowModal(true); setError(''); };
  const closeModal = () => { setShowModal(false); setError(''); };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.borrower_name.trim()) return 'Name is required';
    if (!form.email.trim() || !form.email.includes('@')) return 'Valid email is required';
    if (!form.phone.trim()) return 'Phone is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    try {
      if (editBorrower) {
        await borrowersAPI.update(editBorrower.borrower_id, form);
        setSuccess('Borrower updated!');
      } else {
        await borrowersAPI.create(form);
        setSuccess('Borrower added!');
      }
      fetchBorrowers();
      closeModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this borrower?')) return;
    try {
      await borrowersAPI.delete(id);
      setSuccess('Borrower deleted!');
      fetchBorrowers();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Borrower Management</h1>
        <p>Manage library members and borrowers</p>
      </div>

      {success && <div className="success-msg">{success}</div>}

      <div className="card">
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search borrowers..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <button className="btn btn-primary" onClick={openAdd}>+ Add Borrower</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No borrowers found</td></tr>
              ) : filtered.map(b => (
                <tr key={b.borrower_id}>
                  <td>{b.borrower_id}</td>
                  <td><strong>{b.borrower_name}</strong></td>
                  <td>{b.email}</td>
                  <td>{b.phone}</td>
                  <td>
                    <button className="btn btn-warning" style={{ marginRight: '0.5rem' }} onClick={() => openEdit(b)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(b.borrower_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editBorrower ? 'Edit Borrower' : 'Add New Borrower'}</h2>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input name="borrower_name" value={form.borrower_name} onChange={handleChange} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email address" />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="Contact number" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editBorrower ? 'Update' : 'Add Borrower'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
