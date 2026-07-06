import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { User, Phone, Mail, Lock, History, ClipboardCheck, Trash2, ShieldAlert, Check } from 'lucide-react';

export const Profile = () => {
  const { user, token, updateUser } = useAuth();
  
  // Profile update form states
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Bookings list states
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  // Cancellation modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // 1. Fetch user bookings
  const fetchMyBookings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [token]);

  // 2. Submit Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email, phone, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      setProfileSuccess('Profile credentials updated successfully!');
      updateUser(data.user);
      setPassword(''); // clear password
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // 3. Open Cancel Confirmation Modal
  const openCancelConfirm = (booking) => {
    setBookingToCancel(booking);
    setCancelError('');
    setCancelModalOpen(true);
  };

  // 4. Submit Cancel Request to Backend
  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    setCancelLoading(true);
    setCancelError('');

    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingToCancel.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Cancellation request rejected.');
      }

      setCancelModalOpen(false);
      setBookingToCancel(null);
      // Refresh list
      fetchMyBookings();
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelLoading(false);
    }
  };

  // 5. Utility: Sort bookings into Active vs Past/Cancelled
  const filterBookings = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const timeToMinutes = (tStr) => {
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };

    return bookings.reduce((acc, b) => {
      // Postgres dates might return full ISO strings. Normalize to YYYY-MM-DD
      const bDateStr = new Date(b.date).toISOString().split('T')[0];
      
      const isCancelled = b.status === 'cancelled';
      const isPastDate = bDateStr < todayStr;
      const isToday = bDateStr === todayStr;
      const isPastTime = isToday && timeToMinutes(b.start_time) <= currentMinutes;

      const isCompleted = isPastDate || isPastTime;

      if (isCancelled || isCompleted) {
        acc.history.push({ ...b, bDateStr, isCompleted });
      } else {
        acc.active.push({ ...b, bDateStr });
      }
      return acc;
    }, { active: [], history: [] });
  };

  const sortedBookings = filterBookings();
  const displayedBookings = activeTab === 'active' ? sortedBookings.active : sortedBookings.history;

  return (
    <div className="container animate-fade-in" style={{ marginTop: '20px' }}>
      
      <div className="page-header">
        <div>
          <h1 className="page-title">My Account</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Manage details and inspect booked sports sessions.</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px'
      }} className="profile-layout">
        
        {/* Left Side: Profile credentials edit */}
        <div className="glass-card" style={{ padding: '32px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} style={{ color: 'var(--primary)' }} />
            Profile Credentials
          </h2>

          {profileError && (
            <div className="badge-danger" style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '20px' }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="badge-success" style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '20px' }}>
              <Check size={16} style={{ flexShrink: 0 }} />
              <span>{profileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                <input 
                  type="tel" 
                  className="form-input" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Change Password (Leave blank to keep current)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="New password (min. 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: '12px' }}
              disabled={profileLoading}
            >
              {profileLoading ? 'Saving changes...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Right Side: Booking listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tab Selection */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('active')}
              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
            >
              <ClipboardCheck size={16} />
              Active Bookings ({sortedBookings.active.length})
            </button>
            <button 
              className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('history')}
              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
            >
              <History size={16} />
              History ({sortedBookings.history.length})
            </button>
          </div>

          {/* Bookings Display Container */}
          {bookingsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <div className="spinner" />
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <History size={32} style={{ color: 'var(--text-dark)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>No bookings here</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                {activeTab === 'active' ? 'You don\'t have any active reservations.' : 'No past sessions recorded.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {displayedBookings.map((b) => (
                <div key={b.id} className="glass-card profile-booking-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--card-border)' }}>
                  
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span className="badge badge-success" style={{ marginBottom: '6px' }}>
                        {b.facility_type === 'cricket' ? 'Cricket' : b.facility_type === 'tennis' ? 'Tennis' : b.facility_type === 'pickleball' ? 'Pickleball' : 'Other'}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{b.facility_name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{b.facility_location}</p>
                    </div>

                    {/* Status badge */}
                    <div>
                      {b.status === 'cancelled' ? (
                        <span className="badge badge-danger">Cancelled</span>
                      ) : b.isCompleted ? (
                        <span className="badge badge-neutral">Completed</span>
                      ) : (
                        <span className="badge badge-success">Confirmed</span>
                      )}
                    </div>
                  </div>

                  {/* Card Timings & Pricing Details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</span>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px' }}>{b.bDateStr}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time Slot</span>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2px', color: 'var(--primary)' }}>{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price Paid</span>
                      <p style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '2px' }}>₹{parseFloat(b.total_price).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Action row (Cancel active booking) */}
                  {b.status === 'confirmed' && !b.isCompleted && (
                    <div style={{ display: 'flex', justifyContent: 'end', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <button 
                        onClick={() => openCancelConfirm(b)}
                        className="btn btn-danger"
                        style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Trash2 size={14} />
                        Cancel Slot Booking
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={cancelModalOpen} 
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Slot Booking"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
            Are you sure you want to cancel your slot booking at <strong>{bookingToCancel?.facility_name}</strong>?
          </p>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--danger)' }}>
            ⚠️ This action cannot be undone. The reserved slot will immediately become open to bookings by other players.
          </div>

          {cancelError && (
            <div className="badge-danger" style={{ display: 'flex', gap: '6px', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <ShieldAlert size={14} />
              <span>{cancelError}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelLoading}
            >
              Keep Booking
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleCancelBooking}
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @media (min-width: 992px) {
          .profile-layout {
            grid-template-columns: 1fr 2fr !important;
          }
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
