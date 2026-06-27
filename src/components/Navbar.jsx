import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, LogOut, Menu, X, ShieldAlert, Dumbbell } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass-card" style={{
      position: 'sticky',
      top: '16px',
      margin: '16px auto',
      maxWidth: '1280px',
      zIndex: 100,
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--card-border)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'between',
      width: 'calc(100% - 32px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }} onClick={() => setIsOpen(false)}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#020617'
          }}>
            <Dumbbell size={20} />
          </div>
          <span>Sport<span style={{ color: 'var(--primary)' }}>Slot</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="desktop-menu" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
          <Link to="/facilities" style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 500,
            background: isActive('/facilities') ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
            color: isActive('/facilities') ? 'var(--primary)' : 'var(--text-muted)'
          }}>
            Facilities
          </Link>
          
          {user && (
            <Link to="/profile" style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 500,
              background: isActive('/profile') ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              color: isActive('/profile') ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Calendar size={16} />
              My Booking
            </Link>
          )}

          {user && user.role === 'admin' && (
            <Link to="/admin" style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 500,
              background: isActive('/admin') ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
              color: isActive('/admin') ? 'var(--secondary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldAlert size={16} />
              Admin
            </Link>
          )}
        </div>

        {/* Desktop Right Info */}
        <div className="desktop-menu-right" style={{ display: 'none', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <User size={16} />
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="btn btn-secondary" 
                style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOut size={14} />
                Log Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/login" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)', padding: '8px 16px' }}>
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          style={{
            display: 'block',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '4px'
          }}
          className="mobile-toggle"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '8px',
          background: '#0f172a',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 99
        }}>
          <Link to="/facilities" style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: isActive('/facilities') ? 'var(--primary)' : 'var(--text-main)' }} onClick={() => setIsOpen(false)}>
            Explore Facilities
          </Link>
          {user && (
            <>
              <Link to="/profile" style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: isActive('/profile') ? 'var(--primary)' : 'var(--text-main)' }} onClick={() => setIsOpen(false)}>
                My Bookings & Profile
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--secondary)' }} onClick={() => setIsOpen(false)}>
                  Admin Dashboard
                </Link>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Logged in as: <strong>{user.name}</strong></span>
                <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            </>
          )}
          {!user && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ flex: 1, padding: '8px' }} onClick={() => setIsOpen(false)}>Log In</Link>
              <Link to="/register" className="btn btn-primary" style={{ flex: 1, padding: '8px' }} onClick={() => setIsOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}

      {/* Media Query Injector */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-menu { display: flex !important; }
          .desktop-menu-right { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
      `}</style>
    </nav>
  );
};
