import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, LogOut, Menu, X, ShieldAlert, Dumbbell, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('sports_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sports_theme', theme);
  }, [theme]);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;
  const userInitials = user ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo-icon"><Dumbbell size={18} /></div>
          <span>Sport<span style={{ color: 'var(--primary)' }}>Slot</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <Link to="/facilities" className={`nav-link-item${isActive('/facilities') ? ' active' : ''}`}>
            Facilities
          </Link>
          {user && (
            <Link to="/profile" className={`nav-link-item${isActive('/profile') ? ' active' : ''}`}>
              <Calendar size={15} />My Bookings
            </Link>
          )}
          {user && user.role === 'admin' && (
            <Link to="/admin" className={`nav-link-item${isActive('/admin') ? ' active' : ''}`}
              style={isActive('/admin') ? { color: 'var(--secondary)', background: 'var(--secondary-glow)' } : {}}>
              <ShieldAlert size={15} />Admin
            </Link>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            {theme === 'dark' ? <Sun size={15} style={{ color: '#f59e0b' }} /> : <Moon size={15} style={{ color: 'var(--secondary)' }} />}
          </button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="user-chip">
                <div className="user-avatar">{userInitials}</div>
                <span>{user.name.split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '7px 13px', fontSize: '0.8125rem' }}>
                <LogOut size={14} />Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/login" className="btn btn-ghost" style={{ padding: '7px 13px', fontSize: '0.875rem' }}>Log In</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '0.875rem' }}>Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="mobile-toggle" aria-label="Toggle menu">
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="mobile-menu">
          <Link to="/facilities" className={`mobile-nav-link${isActive('/facilities') ? ' active' : ''}`}>Facilities</Link>
          {user && <Link to="/profile" className={`mobile-nav-link${isActive('/profile') ? ' active' : ''}`}><Calendar size={15} />My Bookings</Link>}
          {user && user.role === 'admin' && <Link to="/admin" className={`mobile-nav-link${isActive('/admin') ? ' active' : ''}`}><ShieldAlert size={15} />Admin</Link>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '12px', marginTop: '8px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <div className="user-chip" style={{ flex: 1 }}>
                  <div className="user-avatar">{userInitials}</div>
                  <span style={{ fontSize: '0.875rem' }}>{user.name}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 14px', fontSize: '0.8125rem' }}>
                  <LogOut size={14} />Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary" style={{ flex: 1, padding: '9px' }}>Log In</Link>
                <Link to="/register" className="btn btn-primary" style={{ flex: 1, padding: '9px' }}>Sign Up</Link>
              </>
            )}
            <button onClick={toggleTheme} className="theme-toggle" title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} style={{ color: '#f59e0b' }} /> : <Moon size={15} style={{ color: 'var(--secondary)' }} />}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
