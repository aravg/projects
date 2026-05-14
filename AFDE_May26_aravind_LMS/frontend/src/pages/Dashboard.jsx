import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state"><p>Loading dashboard...</p></div>;
  if (!stats) return <div className="error-msg">Failed to load dashboard data.</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Library Management System overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📚</div>
          <div className="stat-info">
            <h3>{stats.total_books}</h3>
            <p>Total Books</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <h3>{stats.available_books}</h3>
            <p>Available Books</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">📖</div>
          <div className="stat-info">
            <h3>{stats.borrowed_books}</h3>
            <p>Borrowed Books</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">👥</div>
          <div className="stat-info">
            <h3>{stats.total_borrowers}</h3>
            <p>Total Borrowers</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '1rem', color: '#1a1a2e' }}>Recent Transactions</h2>
        {stats.recent_transactions.length === 0 ? (
          <div className="empty-state"><p>No transactions yet.</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Borrow Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_transactions.map(tx => (
                  <tr key={tx.transaction_id}>
                    <td>#{tx.transaction_id}</td>
                    <td>{tx.book?.title}</td>
                    <td>{tx.borrower?.borrower_name}</td>
                    <td>{new Date(tx.borrow_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${tx.return_date ? 'badge-available' : 'badge-borrowed'}`}>
                        {tx.return_date ? 'Returned' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
