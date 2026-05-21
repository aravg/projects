import { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';

function BarChart({ data, labelKey, valueKey, color = '#4f46e5' }) {
  if (!data || data.length === 0) return <p style={{ color: '#888' }}>No data available. Run ETL first.</p>;
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '180px', fontSize: '12px', textAlign: 'right', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={d[labelKey]}>
            {d[labelKey]}
          </div>
          <div style={{ flex: 1, background: '#f0f0f0', borderRadius: '4px', height: '22px', position: 'relative' }}>
            <div style={{
              width: `${(d[valueKey] / max) * 100}%`,
              background: color,
              borderRadius: '4px',
              height: '100%',
              transition: 'width 0.6s ease',
              minWidth: '2px',
            }} />
          </div>
          <div style={{ width: '30px', fontSize: '12px', fontWeight: 600, color: '#333' }}>{d[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, labelKey, valueKey }) {
  if (!data || data.length === 0) return <p style={{ color: '#888' }}>No data available. Run ETL first.</p>;
  const w = 600, h = 180, pad = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const max = Math.max(...data.map(d => d[valueKey]));
  const min = 0;
  const xStep = innerW / (data.length - 1 || 1);
  const yScale = v => innerH - ((v - min) / (max - min || 1)) * innerH;
  const points = data.map((d, i) => `${pad.left + i * xStep},${pad.top + yScale(d[valueKey])}`).join(' ');

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: w, display: 'block' }}>
        <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={pad.left + i * xStep} cy={pad.top + yScale(d[valueKey])} r="4" fill="#4f46e5" />
            {i % Math.ceil(data.length / 10) === 0 && (
              <text x={pad.left + i * xStep} y={h - 8} textAnchor="middle" fontSize="10" fill="#666">
                {d[labelKey].slice(2)}
              </text>
            )}
          </g>
        ))}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + innerH} stroke="#ccc" />
        <line x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} stroke="#ccc" />
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <text key={i} x={pad.left - 4} y={pad.top + yScale(min + t * (max - min)) + 4} textAnchor="end" fontSize="10" fill="#666">
            {Math.round(min + t * (max - min))}
          </text>
        ))}
      </svg>
    </div>
  );
}

function PieChart({ data, labelKey, valueKey }) {
  if (!data || data.length === 0) return <p style={{ color: '#888' }}>No data available. Run ETL first.</p>;
  const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  const total = data.reduce((s, d) => s + d[valueKey], 0);
  let cumAngle = -Math.PI / 2;
  const cx = 90, cy = 90, r = 80;

  const slices = data.map((d, i) => {
    const angle = (d[valueKey] / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: colors[i % colors.length], label: d[labelKey], value: d[valueKey] };
  });

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
      <svg viewBox="0 0 180 180" style={{ width: '180px', flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1.5" />)}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
            <span style={{ color: '#444' }}>{s.label}</span>
            <span style={{ fontWeight: 600, color: '#333' }}>({s.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [status, setStatus] = useState(null);
  const [mostBorrowed, setMostBorrowed] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [overdueData, setOverdueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningETL, setRunningETL] = useState(false);
  const [etlMessage, setEtlMessage] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [st, mb, cat, mt, ov] = await Promise.all([
        analyticsAPI.getStatus(),
        analyticsAPI.getMostBorrowed(10),
        analyticsAPI.getCategoryBorrowing(),
        analyticsAPI.getMonthlyTrends(),
        analyticsAPI.getOverdue(),
      ]);
      setStatus(st.data);
      setMostBorrowed(mb.data);
      setCategoryData(cat.data);
      setMonthlyData(mt.data);
      setOverdueData(ov.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRunETL = async () => {
    setRunningETL(true);
    setEtlMessage('');
    try {
      const res = await analyticsAPI.runETL();
      setEtlMessage(`ETL completed: ${res.data.most_borrowed_count} books, ${res.data.overdue_count} overdue records loaded.`);
      await fetchAll();
    } catch (e) {
      setEtlMessage('ETL failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setRunningETL(false);
    }
  };

  if (loading) return <div className="empty-state"><p>Loading analytics...</p></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>Analytics Dashboard</h1>
          <p>ETL-powered borrowing insights from transaction dataset</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleRunETL}
          disabled={runningETL}
          style={{ alignSelf: 'flex-start' }}
        >
          {runningETL ? 'Running ETL...' : 'Run ETL Pipeline'}
        </button>
      </div>

      {etlMessage && (
        <div className={`card`} style={{ marginBottom: '1rem', background: etlMessage.startsWith('ETL failed') ? '#fff5f5' : '#f0fdf4', borderLeft: `4px solid ${etlMessage.startsWith('ETL failed') ? '#ef4444' : '#10b981'}` }}>
          <p style={{ margin: 0, fontSize: '14px' }}>{etlMessage}</p>
        </div>
      )}

      {status && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon blue">📊</div>
            <div className="stat-info">
              <h3>{status.most_borrowed_count}</h3>
              <p>Books Tracked</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">🏷️</div>
            <div className="stat-info">
              <h3>{status.category_count}</h3>
              <p>Categories</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">📅</div>
            <div className="stat-info">
              <h3>{status.monthly_trend_count}</h3>
              <p>Monthly Periods</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">⚠️</div>
            <div className="stat-info">
              <h3>{status.overdue_count}</h3>
              <p>Overdue Transactions</p>
            </div>
          </div>
        </div>
      )}

      {!status?.etl_run && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '1rem' }}>No analytics data yet. Click <strong>Run ETL Pipeline</strong> to process the dataset.</p>
        </div>
      )}

      {status?.etl_run && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <h2 style={{ marginBottom: '1rem', color: '#1a1a2e', fontSize: '1.1rem' }}>Top 10 Most Borrowed Books</h2>
              <BarChart data={mostBorrowed} labelKey="book_title" valueKey="borrow_count" color="#4f46e5" />
            </div>
            <div className="card">
              <h2 style={{ marginBottom: '1rem', color: '#1a1a2e', fontSize: '1.1rem' }}>Category-wise Borrowing</h2>
              <PieChart data={categoryData} labelKey="category" valueKey="borrow_count" />
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem', color: '#1a1a2e', fontSize: '1.1rem' }}>Monthly Borrowing Trends</h2>
            <LineChart data={monthlyData} labelKey="year_month" valueKey="borrow_count" />
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem', color: '#1a1a2e', fontSize: '1.1rem' }}>Overdue Transactions ({overdueData.length})</h2>
            {overdueData.length === 0 ? (
              <div className="empty-state"><p>No overdue transactions.</p></div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Txn #</th>
                      <th>Book</th>
                      <th>Borrower</th>
                      <th>Email</th>
                      <th>Borrow Date</th>
                      <th>Days Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueData.map(row => (
                      <tr key={row.id}>
                        <td>#{row.transaction_id}</td>
                        <td>{row.book_title}</td>
                        <td>{row.borrower_name}</td>
                        <td>{row.borrower_email}</td>
                        <td>{row.borrow_date}</td>
                        <td>
                          <span className="badge badge-borrowed">{row.days_overdue} days</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
