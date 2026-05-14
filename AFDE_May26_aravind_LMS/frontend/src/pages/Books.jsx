import { useState, useEffect } from 'react';
import { booksAPI } from '../services/api';

const emptyForm = { title: '', author: '', category: '', isbn: '', availability_status: 'available' };

export default function Books() {
  const [books, setBooks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editBook, setEditBook] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBooks = () => {
    booksAPI.getAll().then(res => {
      setBooks(res.data);
      setFiltered(res.data);
    }).catch(() => setError('Failed to load books'));
  };

  useEffect(() => { fetchBooks(); }, []);

  useEffect(() => {
    const q = searchText.toLowerCase();
    setFiltered(books.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q)
    ));
  }, [searchText, books]);

  const openAdd = () => { setForm(emptyForm); setEditBook(null); setShowModal(true); setError(''); };
  const openEdit = (book) => { setForm({ ...book }); setEditBook(book); setShowModal(true); setError(''); };
  const closeModal = () => { setShowModal(false); setError(''); };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.title.trim()) return 'Title is required';
    if (!form.author.trim()) return 'Author is required';
    if (!form.category.trim()) return 'Category is required';
    if (!form.isbn.trim()) return 'ISBN is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    try {
      if (editBook) {
        await booksAPI.update(editBook.book_id, form);
        setSuccess('Book updated successfully!');
      } else {
        await booksAPI.create(form);
        setSuccess('Book added successfully!');
      }
      fetchBooks();
      closeModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book?')) return;
    try {
      await booksAPI.delete(id);
      setSuccess('Book deleted!');
      fetchBooks();
      setTimeout(() => setSuccess(''), 3000);
    } catch { setError('Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Book Management</h1>
        <p>Manage your library book collection</p>
      </div>

      {success && <div className="success-msg">{success}</div>}

      <div className="card">
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="Search books..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <button className="btn btn-primary" onClick={openAdd}>+ Add Book</button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Author</th><th>Category</th><th>ISBN</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No books found</td></tr>
              ) : filtered.map(book => (
                <tr key={book.book_id}>
                  <td>{book.book_id}</td>
                  <td><strong>{book.title}</strong></td>
                  <td>{book.author}</td>
                  <td>{book.category}</td>
                  <td>{book.isbn}</td>
                  <td><span className={`badge badge-${book.availability_status}`}>{book.availability_status}</span></td>
                  <td>
                    <button className="btn btn-warning" style={{ marginRight: '0.5rem' }} onClick={() => openEdit(book)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(book.book_id)}>Delete</button>
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
            <h2>{editBook ? 'Edit Book' : 'Add New Book'}</h2>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="Book title" />
              </div>
              <div className="form-group">
                <label>Author *</label>
                <input name="author" value={form.author} onChange={handleChange} placeholder="Author name" />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <input name="category" value={form.category} onChange={handleChange} placeholder="Category" />
              </div>
              <div className="form-group">
                <label>ISBN *</label>
                <input name="isbn" value={form.isbn} onChange={handleChange} placeholder="ISBN number" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="availability_status" value={form.availability_status} onChange={handleChange}>
                  <option value="available">Available</option>
                  <option value="borrowed">Borrowed</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editBook ? 'Update' : 'Add Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
