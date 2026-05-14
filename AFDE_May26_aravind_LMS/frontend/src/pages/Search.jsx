import { useState } from 'react';
import { searchAPI } from '../services/api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await searchAPI.search({ q: query, category, author });
      setResults(res.data);
      setSearched(true);
    } catch {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery(''); setCategory(''); setAuthor('');
    setResults([]); setSearched(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Search Books</h1>
        <p>Find books by title, author, category, or keyword</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Keyword Search</label>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Title, author, ISBN..." />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Filter by category..." />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Author</label>
              <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="Filter by author..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" className="btn btn-secondary" onClick={handleClear}>Clear</button>
          </div>
        </form>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {loading && <div className="empty-state"><p>Searching...</p></div>}

      {searched && !loading && (
        <div className="card">
          <h2 style={{ marginBottom: '1rem', color: '#1a1a2e' }}>
            Results ({results.length} {results.length === 1 ? 'book' : 'books'} found)
          </h2>
          <div className="table-container">
            <table>
              <thead>
                <tr><th>ID</th><th>Title</th><th>Author</th><th>Category</th><th>ISBN</th><th>Status</th></tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No books match your search</td></tr>
                ) : results.map(book => (
                  <tr key={book.book_id}>
                    <td>{book.book_id}</td>
                    <td><strong>{book.title}</strong></td>
                    <td>{book.author}</td>
                    <td>{book.category}</td>
                    <td>{book.isbn}</td>
                    <td><span className={`badge badge-${book.availability_status}`}>{book.availability_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
