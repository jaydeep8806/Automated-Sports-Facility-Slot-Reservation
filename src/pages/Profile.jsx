import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { User, Phone, Mail, Lock, History, ClipboardCheck, Trash2, ShieldAlert, Check, UtensilsCrossed, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


export const Profile = () => {
  const { user, token, updateUser, deleteAccount } = useAuth();
  const navigate = useNavigate();

  // India Standard Time (Asia/Kolkata) helpers at component scope
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const timeToMinutes = (tStr) => {
    if (!tStr) return 0;
    const [h, m] = tStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatDateToLocalYYYYMMDD = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'history', 'food'

  // Food Orders states
  const [foodOrders, setFoodOrders] = useState([]);
  const [foodOrdersLoading, setFoodOrdersLoading] = useState(false);
  const [foodCancelLoading, setFoodCancelLoading] = useState({});
  const [foodMsg, setFoodMsg] = useState('');

  // Cancellation modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [bookingMsg, setBookingMsg] = useState('');

  // Food cancellation modal states
  const [foodCancelModalOpen, setFoodCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [foodCancelError, setFoodCancelError] = useState('');

  // Delete account modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Inline field validation errors (profile form)
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // 1. Fetch user bookings
  const fetchMyBookings = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/api/bookings/my-bookings', {
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
    fetchMyFoodOrders(true);
  }, [token]);

  // Dynamic status updates: Poll food orders every 5 seconds when in Food tab
  useEffect(() => {
    if (activeTab !== 'food' || !token) return;
    const interval = setInterval(() => {
      fetchMyFoodOrders(false); // Poll in background without showing spinner
    }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, token]);

  // Fetch food orders
  const fetchMyFoodOrders = async (showLoader = false) => {
    if (showLoader) {
      setFoodOrdersLoading(true);
    }
    try {
      const res = await fetch(API_BASE_URL + '/api/canteen/my-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFoodOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoader) {
        setFoodOrdersLoading(false);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setBookingMsg('');
    setFoodMsg('');
    if (tab === 'food') {
      fetchMyFoodOrders(true); // Show loader when manually switching to the tab
    }
  };

  const triggerCancelFoodOrder = (order) => {
    setOrderToCancel(order);
    setFoodCancelError('');
    setFoodCancelModalOpen(true);
  };

  const confirmCancelFoodOrder = async () => {
    if (!orderToCancel) return;
    setFoodCancelLoading(prev => ({ ...prev, [orderToCancel.id]: true }));
    setFoodCancelError('');
    setFoodMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/canteen/orders/${orderToCancel.id}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFoodMsg('Food order cancelled successfully. 🎉');
      setFoodCancelModalOpen(false);
      setOrderToCancel(null);
      fetchMyFoodOrders();
    } catch (err) {
      setFoodCancelError(err.message || 'Failed to cancel order.');
    } finally {
      if (orderToCancel) {
        setFoodCancelLoading(prev => ({ ...prev, [orderToCancel.id]: false }));
      }
    }
  };

  const orderStatusColor = (status) => {
    const map = { pending: '#6366f1', preparing: '#f59e0b', ready: '#10b981', delivered: '#10b981', cancelled: '#ef4444' };
    return map[status] || 'var(--text-muted)';
  };

  // Phone: allow only digits, max 10
  const handlePhoneChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    if (digits.length > 0 && digits.length < 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  // Password: min 6, max 12 (blank = keep current)
  const handlePasswordChange = (val) => {
    setPassword(val);
    if (val.length > 0 && val.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else if (val.length > 12) {
      setPasswordError('Password must be at most 12 characters.');
    } else {
      setPasswordError('');
    }
  };

  // 2. Submit Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');

    // Validate phone
    if (phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      setProfileError('Please fix the validation errors below.');
      setProfileLoading(false);
      return;
    }
    // Validate password if provided
    if (password && (password.length < 6 || password.length > 12)) {
      setPasswordError(password.length < 6 ? 'Password must be at least 6 characters.' : 'Password must be at most 12 characters.');
      setProfileError('Please fix the validation errors below.');
      setProfileLoading(false);
      return;
    }

    try {
      const response = await fetch(API_BASE_URL + '/api/auth/profile', {
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
      setPasswordError('');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await deleteAccount();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.');
      setDeleteLoading(false);
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
    setBookingMsg('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingToCancel.id}/cancel`, {
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
      setBookingMsg('Sports ground booking cancelled successfully. 🎉');
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
    return bookings.reduce((acc, b) => {
      const bDateStr = formatDateToLocalYYYYMMDD(b.date);
      
      const isCancelled = b.status === 'cancelled';
      const isPastDate = bDateStr < todayStr;
      const isToday = bDateStr === todayStr;
      // Match ends when its end_time has passed
      const isEndedToday = isToday && timeToMinutes(b.end_time) <= currentMinutes;

      const isCompleted = isPastDate || isEndedToday;

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
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="form-input" 
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  style={{ paddingLeft: '40px', borderColor: phoneError ? 'var(--danger)' : undefined }}
                  required
                />
              </div>
              {phoneError ? (
                <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {phoneError}
                </p>
              ) : phone.length === 10 ? (
                <p style={{ color: '#10b981', fontSize: '0.78rem', marginTop: '4px' }}>✓ Valid phone number</p>
              ) : null}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Change Password (Leave blank to keep current, 6–12 chars)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="New password (6–12 characters)"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  style={{ paddingLeft: '40px', borderColor: passwordError ? 'var(--danger)' : undefined }}
                />
              </div>
              {passwordError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={12} /> {passwordError}
                </p>
              )}
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

          {/* Danger Zone: Delete Account */}
          <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid rgba(239,68,68,0.2)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} /> Danger Zone
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => { setDeleteError(''); setDeleteModalOpen(true); }}
              style={{
                width: '100%', padding: '11px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--danger)',
                background: 'rgba(239,68,68,0.06)',
                color: 'var(--danger)',
                fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.14)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
            >
              <Trash2 size={16} /> Delete My Account
            </button>
          </div>
        </div>

        {/* Right Side: Booking listings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tab Selection */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTabChange('active')}
              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
            >
              <ClipboardCheck size={16} />
              Active Bookings ({sortedBookings.active.length})
            </button>
            <button 
              className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTabChange('history')}
              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
            >
              <History size={16} />
              History ({sortedBookings.history.length})
            </button>
            <button 
              className={`btn ${activeTab === 'food' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleTabChange('food')}
              style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
            >
              <UtensilsCrossed size={16} />
              Food Orders ({foodOrders.length})
            </button>
          </div>

          {/* Bookings Display Container — only for active/history tabs */}
          {(activeTab === 'active' || activeTab === 'history') && (
            <div>
              {bookingMsg && (
                <div style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.875rem', fontWeight: 600 }}>
                  {bookingMsg}
                </div>
              )}
              {bookingsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                  <div className="spinner" />
                </div>
              ) : displayedBookings.length === 0 ? (
                <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <History size={32} style={{ color: 'var(--text-dark)', marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>No bookings here</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                    {activeTab === 'active' ? "You don't have any active reservations." : 'No past sessions recorded.'}
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

                      {/* Action row (Order Food & Cancel booking) */}
                      {b.status === 'confirmed' && !b.isCompleted && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
                          {/* Order Food Button — Always visible before or during the slot */}
                          <button
                            onClick={() => navigate(`/canteen?bookingId=${b.id}&facilityId=${b.facility_id}&facilityName=${encodeURIComponent(b.facility_name || '')}`)}
                            className="btn"
                            style={{ 
                              padding: '8px 16px', 
                              fontSize: '0.8rem', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px',
                              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                              color: '#fff',
                              border: 'none',
                              fontWeight: 700
                            }}
                          >
                            <UtensilsCrossed size={14} />
                            Order Food
                          </button>

                          {/* Cancel Booking Button — only available before match starts */}
                          {!(b.bDateStr === todayStr && timeToMinutes(b.start_time) <= currentMinutes) && (
                            <button 
                              onClick={() => openCancelConfirm(b)}
                              className="btn btn-danger"
                              style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Trash2 size={14} />
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Food Orders Tab Panel */}
          {activeTab === 'food' && (
            <div>
              {foodMsg && (
                <div style={{ padding: '10px 14px', marginBottom: '14px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--primary)', fontSize: '0.85rem' }}>{foodMsg}</div>
              )}
              {foodOrdersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" /></div>
              ) : foodOrders.length === 0 ? (
                <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <UtensilsCrossed size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                  <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>No food orders yet</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Order food after booking a slot!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {foodOrders.map(order => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    return (
                      <div key={order.id} className="glass-card" style={{ padding: '20px', border: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Order #{String(order.id).padStart(4, '0')}</span>
                            {order.booking_id && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '8px' }}>· Booking #{order.booking_id}</span>}
                          </div>
                          <span style={{ padding: '4px 12px', borderRadius: '999px', background: `${orderStatusColor(order.order_status)}22`, color: orderStatusColor(order.order_status), fontWeight: 700, fontSize: '0.78rem', textTransform: 'capitalize' }}>
                            {order.order_status}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
                          📍 {order.facility_name || 'Canteen'} &nbsp;·&nbsp; {order.delivery_time === 'before' ? '⚡ Before' : order.delivery_time === 'during' ? '🎮 During' : '🏆 After'} match
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                          {items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: item.is_veg ? '#10b981' : '#ef4444', flexShrink: 0, display: 'inline-block' }} />
                                <span>{item.name} × {item.qty}</span>
                              </div>
                              <span style={{ fontWeight: 600 }}>₹{(parseFloat(item.price) * item.qty).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Live Food Order Status Progress Tracker */}
                        {order.order_status === 'cancelled' ? (
                          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', marginBottom: '14px' }}>
                            ❌ This order has been cancelled
                          </div>
                        ) : (
                          <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
                              Track Food Order
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                              {/* Background Connector line */}
                              <div style={{ position: 'absolute', left: '10%', right: '10%', top: '14px', height: '2px', background: 'var(--border)', zIndex: 1 }} />
                              {/* Colored highlight connector line */}
                              <div style={{ 
                                position: 'absolute', 
                                left: '10%', 
                                width: order.order_status === 'pending' ? '0%' : order.order_status === 'preparing' ? '33%' : order.order_status === 'ready' ? '66%' : '80%', 
                                top: '14px', 
                                height: '2px', 
                                background: 'var(--primary)', 
                                zIndex: 1,
                                transition: 'width 0.4s ease'
                              }} />
                              
                              {[
                                { key: 'pending', emoji: '📝', label: 'Placed' },
                                { key: 'preparing', emoji: '👨‍🍳', label: 'Preparing' },
                                { key: 'ready', emoji: '🍽️', label: 'Ready' },
                                { key: 'delivered', emoji: '✅', label: 'Delivered' }
                              ].map((step, idx) => {
                                const stepOrder = ['pending', 'preparing', 'ready', 'delivered'];
                                const currentIdx = stepOrder.indexOf(order.order_status);
                                const isCompleted = idx <= currentIdx;
                                const isActive = idx === currentIdx;

                                return (
                                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                                    <div style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      background: isCompleted ? 'var(--primary)' : 'var(--bg-card)',
                                      border: isCompleted ? '2px solid var(--primary)' : '2px solid var(--border)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.85rem',
                                      boxShadow: isActive ? '0 0 10px rgba(99,102,241,0.5)' : 'none',
                                      transition: 'all 0.3s ease'
                                    }}>
                                      {step.emoji}
                                    </div>
                                    <span style={{ fontSize: '0.62rem', fontWeight: isCompleted ? 700 : 500, color: isCompleted ? 'var(--text-main)' : 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '12px' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Paid</span>
                            <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)', margin: 0 }}>₹{parseFloat(order.total_price).toFixed(2)}</p>
                          </div>
                          {order.order_status === 'pending' && (
                            <button
                              onClick={() => triggerCancelFoodOrder(order)}
                              style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid var(--danger)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Ground Booking Cancellation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Booking?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
            <ShieldAlert size={28} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Are you sure you want to cancel this sports ground booking?</h4>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
            Booking at <strong>{bookingToCancel?.facility_name}</strong> on <strong>{bookingToCancel?.bDateStr}</strong> ({bookingToCancel?.start_time.slice(0, 5)} - {bookingToCancel?.end_time.slice(0, 5)})
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

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '4px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelLoading}
            >
              No, Keep Booking
            </button>
            <button
              className="btn btn-danger"
              onClick={handleCancelBooking}
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Food Order Cancellation Modal */}
      <Modal
        isOpen={foodCancelModalOpen}
        onClose={() => setFoodCancelModalOpen(false)}
        title="Cancel Food Order?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
            <ShieldAlert size={28} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Are you sure you want to cancel this food order?</h4>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
            Order <strong>#{String(orderToCancel?.id).padStart(4, '0')}</strong> from <strong>{orderToCancel?.facility_name || 'Canteen'}</strong>
          </p>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--danger)' }}>
            ⚠️ This action cannot be undone. The preparation/delivery request will be discarded.
          </div>

          {foodCancelError && (
            <div className="badge-danger" style={{ display: 'flex', gap: '6px', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <ShieldAlert size={14} />
              <span>{foodCancelError}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '4px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setFoodCancelModalOpen(false)}
              disabled={foodCancelLoading[orderToCancel?.id]}
            >
              No, Keep Order
            </button>
            <button
              className="btn btn-danger"
              onClick={confirmCancelFoodOrder}
              disabled={foodCancelLoading[orderToCancel?.id]}
            >
              {foodCancelLoading[orderToCancel?.id] ? 'Cancelling...' : 'Yes, Cancel Order'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account?"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
            <ShieldAlert size={28} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Are you sure you want to permanently delete your account?</h4>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0, color: 'var(--text-muted)' }}>
            This will permanently delete your account, all your bookings, and food order history. <strong style={{ color: 'var(--text-main)' }}>This action cannot be undone.</strong>
          </p>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--danger)', lineHeight: 1.5 }}>
            ⚠️ All your data — profile, reservations, food orders — will be erased immediately.
          </div>

          {deleteError && (
            <div className="badge-danger" style={{ display: 'flex', gap: '6px', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <ShieldAlert size={14} />
              <span>{deleteError}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '4px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={14} />
              {deleteLoading ? 'Deleting...' : 'Delete Account'}
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
