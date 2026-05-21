import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Borrowers from './pages/Borrowers';
import BorrowReturn from './pages/BorrowReturn';
import Search from './pages/Search';
import Analytics from './pages/Analytics';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <span className="nav-icon">📚</span>
            <span>Library Management System</span>
          </div>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Dashboard</NavLink>
            <NavLink to="/books" className={({ isActive }) => isActive ? 'active' : ''}>Books</NavLink>
            <NavLink to="/borrowers" className={({ isActive }) => isActive ? 'active' : ''}>Borrowers</NavLink>
            <NavLink to="/borrow-return" className={({ isActive }) => isActive ? 'active' : ''}>Borrow/Return</NavLink>
            <NavLink to="/search" className={({ isActive }) => isActive ? 'active' : ''}>Search</NavLink>
            <NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>Analytics</NavLink>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/books" element={<Books />} />
            <Route path="/borrowers" element={<Borrowers />} />
            <Route path="/borrow-return" element={<BorrowReturn />} />
            <Route path="/search" element={<Search />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
