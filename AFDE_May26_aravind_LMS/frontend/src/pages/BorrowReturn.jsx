import { useState, useEffect } from 'react';
import { booksAPI, borrowersAPI, transactionsAPI } from '../services/api';

export default function BorrowReturn() {
  const [books, setBooks] = useState([]);
  const [borrowers, setBorrowers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [borrowForm, setBorrowForm] = useState({ book_id: '', borrower_id: '' });
  const [returnForm, setReturnForm] = useState({ transaction_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = () => {
    Promise.all([booksAPI.getAll(), borrowersAPI.getAll(), transactionsAPI.getAll()])
      .then(([booksRes, borrowersRes, txRes]) => {
        setBooks(booksRes.data);
        setBorrowers(borrowersRes.data);
        setTransactions(txRes.data);
      })
      .catch(() => setError('Failed to load data'));
  };

  useEffect(() => { fetchData(); }, []);

  const availableBooks = books.filter(b => b.availability_status === 'available');
  const activeTransactions = transactions.filter(tx => !tx.return_date);

  const handleBorrow = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!borrowForm.book_id || !borrowForm.borrower_id) { setError('Please select both book and borrower'); return; }
    try {
      await transactionsAPI.borrow({ book_id: parseInt(borrowForm.book_id), borrower_id: parseInt(borrowForm.borrower_id) });
      setSuccess('Book borrowed successfully!');
      setBorrowForm({ book_id: '', borrower_id: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.response?.data?.detail || 'Borrow operation failed');
    }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!returnForm.transaction_id) { setError('Please select a transaction'); return; }
    try {
      await transactionsAPI.return({ transaction_id: parseInt(returnForm.transaction_id) });
      setSuccess('Book returned successfully!');
      setReturnForm({ transaction_id: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.response?.data?.detail || 'Return operation failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Borrow / Return</h1>
        <p>Manage book borrowing and return operations</p>
      </div>

      {success && <div className="success-msg">{success}</div>}
      {error && <div className="error-msg">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h2 style={{ marginBottom: '1.25rem', color: '#1a1a2e' }}>Borrow a Book</h2>
          <form onSubmit={handleBorrow}>
            <div className="form-group">
              <label>Select Book (Available Only)</label>
              <select value={borrowForm.book_id} onChange={e => setBorrowForm(f => ({ ...f, book_id: e.target.value }))}>
                <option value="">-- Select a book --</option>
                {availableBooks.map(b => (
                  <option key={b.book_id} value={b.book_id}>{b.title} - {b.author}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Borrower</label>
              <select value={borrowForm.borrower_id} onChange={e => setBorrowForm(f => ({ ...f, borrower_id: e.target.value }))}>
                <option value="">-- Select a borrower --</option>
                {borrowers.map(b => (
                  <option key={b.borrower_id} value={b.borrower_id}>{b.borrower_name} ({b.email})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Borrow Book</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1.25rem', color: '#1a1a2e' }}>Return a Book</h2>
          <form onSubmit={handleReturn}>
            <div className="form-group">
              <label>Select Active Transaction</label>
              <select value={returnForm.transaction_id} onChange={e => setReturnForm({ transaction_id: e.target.value })}>
                <option value="">-- Select transaction --</option>
                {activeTransactions.map(tx => (
                  <option key={tx.transaction_id} value={tx.transaction_id}>
                    #{tx.transaction_id} - {tx.book?.title} &rarr; {tx.borrower?.borrower_name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-success" style={{ width: '100%' }}>Return Book</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', color: '#1a1a2e' }}>All Transactions</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>ID</th><th>Book</th><th>Borrower</th><th>Borrow Date</th><th>Return Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No transactions yet</td></tr>
              ) : transactions.map(tx => (
                <tr key={tx.transaction_id}>
                  <td>#{tx.transaction_id}</td>
                  <td>{tx.book?.title}</td>
                  <td>{tx.borrower?.borrower_name}</td>
                  <td>{new Date(tx.borrow_date).toLocaleDateString()}</td>
                  <td>{tx.return_date ? new Date(tx.return_date).toLocaleDateString() : '-'}</td>
                  <td><span className={`badge ${tx.return_date ? 'badge-available' : 'badge-borrowed'}`}>{tx.return_date ? 'Returned' : 'Active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
