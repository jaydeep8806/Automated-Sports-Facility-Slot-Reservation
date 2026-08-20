import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Undo2, Calendar, Clock, MapPin, Wallet,
  Activity, UtensilsCrossed, CreditCard, QrCode, Landmark, Lock, Star
} from 'lucide-react';
import RazorpayModal from '../components/RazorpayModal';
import { FeedbackModal } from '../components/FeedbackModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const bookingData = location.state || {};
  const {
    isExtension = false,
    extendBookingId = null,
    facilityId,
    facilityName,
    facilityLocation,
    facilityType = '',
    date,
    originalStartTime = null,
    originalEndTime = null,
    originalTotalPrice = 0,
    selectedSlots = [],
    totalPrice = 0
  } = bookingData;

  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdBookingIds, setCreatedBookingIds] = useState([]);
  const [updatedBooking, setUpdatedBooking] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!facilityId || selectedSlots.length === 0) {
    return (
      <div className="container" style={{ marginTop: '60px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
          <ShieldCheck size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Session Expired</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>No active booking session found. Please select timing slots first.</p>
          <button onClick={() => navigate('/facilities')} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Undo2 size={16} /> Back to Venues
          </button>
        </div>
      </div>
    );
  }

  /* Called from modal after payment simulation */
  const handlePaymentSuccess = async () => {
    try {
      if (isExtension && extendBookingId) {
        // Extend existing active booking
        const response = await fetch(`${API_BASE_URL}/api/bookings/${extendBookingId}/extend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            slots: selectedSlots.map(s => ({ startTime: s.startTime, endTime: s.endTime, price: s.price })),
            additionalPrice: totalPrice,
            date: date
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Extension failed after payment.');

        setUpdatedBooking(data.booking);
        setCreatedBookingIds([extendBookingId]);
        setShowModal(false);
        setSuccess(true);
        setShowFeedbackModal(true);
      } else {
        // Normal booking creation
        const response = await fetch(API_BASE_URL + '/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            facilityId, date,
            slots: selectedSlots.map(s => ({ startTime: s.startTime, endTime: s.endTime, price: s.price })),
            totalPrice,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Booking failed after payment.');

        const ids = data.bookings ? data.bookings.map(b => b.id) : (data.booking ? [data.booking.id] : []);
        setCreatedBookingIds(ids);
        setShowModal(false);
        setSuccess(true);
        setShowFeedbackModal(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment processing error.');
      setShowModal(false);
      throw err;
    }
  };

  /* SUCCESS VIEW — Dedicated centered layout fitting comfortably within viewport */
  if (success) {
    return (
      <div className="container animate-fade-in" style={{
        minHeight: 'calc(100vh - 90px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px 40px'
      }}>
        <div className="glass-card animate-scale-up" style={{
          padding: '24px 26px',
          maxWidth: '560px',
          width: '100%',
          margin: '0 auto',
          textAlign: 'center',
          border: '1px solid rgba(16,185,129,0.25)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)'
        }}>
          {/* Success Badge Icon */}
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(16,185,129,0.12)',
            border: '2px solid rgb(16,185,129)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto'
          }}>
            <ShieldCheck size={28} style={{ color: 'rgb(16,185,129)' }} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', color: 'rgb(16,185,129)' }}>
            {isExtension ? 'Booking Extended Successfully! 🎉' : 'Booking Confirmed! 🎉'}
          </h2>

          <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 500, marginBottom: '4px' }}>
            {isExtension
              ? <>Your session at <strong>{facilityName}</strong> has been extended to <strong>{selectedSlots[selectedSlots.length - 1]?.endTime}</strong>.</>
              : <>Your slot at <strong>{facilityName}</strong> is reserved.</>
            }
          </p>

          {createdBookingIds.length > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
              Booking ID: {createdBookingIds.map(id => `#${id}`).join(', ')}
            </p>
          )}

          {isExtension && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.82rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Facility &amp; Sport:</span>
                <strong style={{ color: 'var(--text-main)' }}>{facilityName} {facilityType ? `(${facilityType})` : ''}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                <strong style={{ color: 'var(--text-main)' }}>{date}</strong>
              </div>
              {originalStartTime && originalEndTime && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Original Booking:</span>
                  <span>{originalStartTime} – {originalEndTime}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Newly Extended Slots:</span>
                <strong style={{ color: '#10b981' }}>{selectedSlots.map(s => `${s.startTime}–${s.endTime}`).join(', ')}</strong>
              </div>
              <div style={{ borderTop: '1px solid rgba(99, 102, 241, 0.2)', margin: '2px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Updated Total Session:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                  {originalStartTime ? `${originalStartTime} – ${selectedSlots[selectedSlots.length - 1]?.endTime}` : `${selectedSlots[0]?.startTime} – ${selectedSlots[selectedSlots.length - 1]?.endTime}`}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Extension Amount Paid:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>₹{totalPrice.toFixed(2)}</strong>
              </div>
            </div>
          )}

          {errorMsg && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '12px' }}>{errorMsg}</p>}

          {/* Feedback Trigger CTA */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setShowFeedbackModal(true)}
              className="btn"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1.5px solid #f59e0b',
                color: '#f59e0b',
                padding: '8px 18px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Star size={14} fill="#f59e0b" stroke="none" /> Share Booking Experience Feedback
            </button>
          </div>

          {/* Canteen CTA Card */}
          <div style={{
            background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(239,68,68,0.08))',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '14px',
            padding: '16px 18px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.3rem' }}>🍔</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Hungry? Order Food from Canteen!</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
              Get snacks, fast food, and drinks delivered to your seat during the match.
            </p>
            <button
              onClick={() => navigate(`/canteen?bookingId=${createdBookingIds[0] || ''}&facilityId=${facilityId}&facilityName=${encodeURIComponent(facilityName || '')}`)}
              style={{
                background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                color: '#fff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <UtensilsCrossed size={16} /> Order Food from Canteen
            </button>
          </div>

          {/* Direct Link to My Bookings */}
          <div>
            <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700, textDecoration: 'underline' }}>
              Go to My Bookings → Active Bookings
            </button>
          </div>
        </div>

        {/* Feedback Popup Modal */}
        {showFeedbackModal && createdBookingIds.length > 0 && (
          <FeedbackModal
            bookingId={createdBookingIds[0]}
            facilityId={facilityId}
            facilityName={facilityName}
            onClose={() => setShowFeedbackModal(false)}
            onSuccess={() => setShowFeedbackModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ marginTop: '32px', paddingBottom: '60px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wallet style={{ color: 'var(--primary)' }} /> {isExtension ? 'Extend Booking Checkout' : 'Secure Checkout'}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
          {isExtension
            ? 'Review your additional extension slots and complete payment.'
            : 'Review your booking and complete the payment.'}
        </p>
      </div>

      {/* CHECKOUT LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }} className="checkout-layout">

        {/* Left: Payment Trigger */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '14px' }}>
            {isExtension ? 'Complete Extension Payment' : 'Complete Your Payment'}
          </h2>

            {/* Supported methods */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
              {[
                { icon: <CreditCard size={18} />, label: 'Cards' },
                { icon: <QrCode size={18} />, label: 'UPI' },
                { icon: <Landmark size={18} />, label: 'Net Banking' },
                { icon: <Wallet size={18} />, label: 'Wallets' },
              ].map(m => (
                <div key={m.label} style={{ padding: '14px 10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  <span style={{ color: 'var(--primary)' }}>{m.icon}</span>{m.label}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', fontSize: '12px', color: 'rgb(16,185,129)' }}>
              <ShieldCheck size={14} />
              <span>256-bit SSL Encrypted · 3D Secure · PCI DSS Compliant</span>
            </div>

            {errorMsg && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: 'var(--danger)' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => navigate(`/facilities/${facilityId}${isExtension ? `?extendBookingId=${extendBookingId}` : ''}`)} className="btn"
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}>
                Cancel
              </button>
              <button onClick={() => { window.scrollTo({ top: 0, behavior: 'instant' }); setShowModal(true); }} className="btn btn-primary"
                style={{ flex: 2, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700, background: isExtension ? 'linear-gradient(135deg, var(--primary), #8b5cf6)' : undefined }}>
                <Lock size={16} /> Pay ₹{totalPrice.toFixed(2)} Securely
              </button>
            </div>
          </div>

          {/* Right: Booking Summary */}
          <div style={{ position: 'relative' }}>
            <div className="glass-card" style={{ padding: '32px', position: 'sticky', top: '110px', border: isExtension ? '1.5px solid var(--primary)' : '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--primary)' }} />
                {isExtension ? 'Extension Summary' : 'Booking Summary'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{facilityName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} /><span>{facilityLocation}</span>
                  </div>
                </div>

                {facilityType && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sport:</span>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{facilityType}</span>
                  </div>
                )}

                {isExtension && originalStartTime && originalEndTime && (
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Current Booking Time (Paid):</span>
                    <strong style={{ color: 'var(--text-main)' }}>{originalStartTime} – {originalEndTime}</strong>
                  </div>
                )}

                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Date</span>
                  <span style={{ fontWeight: 600 }}>{date}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> {isExtension ? 'Newly Selected Extension Slot(s)' : 'Time Slots'} ({selectedSlots.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '20px' }}>
                    {selectedSlots.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>• {s.startTime} – {s.endTime}</span>
                        <span style={{ fontWeight: 600 }}>₹{parseFloat(s.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {isExtension ? 'Additional Duration:' : 'Total Duration:'}
                  </span>
                  <span style={{ fontWeight: 600 }}>{selectedSlots.length} {selectedSlots.length === 1 ? 'Hour' : 'Hours'}</span>
                </div>

                {isExtension && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hourly Rate:</span>
                    <span style={{ fontWeight: 600 }}>₹{(totalPrice / (selectedSlots.length || 1)).toFixed(2)}</span>
                  </div>
                )}

                {isExtension && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Additional Amount:</span>
                    <span style={{ fontWeight: 700 }}>₹{totalPrice.toFixed(2)}</span>
                  </div>
                )}

                {isExtension && originalStartTime && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.08)', padding: '8px 12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>New Total Match Time:</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                      {originalStartTime} – {selectedSlots[selectedSlots.length - 1]?.endTime}
                    </span>
                  </div>
                )}

                <div style={{ borderBottom: '2px solid var(--card-border)', paddingBottom: '12px', marginTop: '8px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {isExtension ? 'Final Additional Payment:' : 'Total Chargeable:'}
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{totalPrice.toFixed(2)}</span>
                </div>

                {isExtension && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    ℹ️ Only charging for the newly selected {selectedSlots.length} extension slot(s). Your current booking remains active.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>

      {/* Razorpay-style Modal */}
      {showModal && (
        <RazorpayModal
          totalPrice={totalPrice}
          merchantName={facilityName}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Feedback Popup Modal */}
      {showFeedbackModal && createdBookingIds.length > 0 && (
        <FeedbackModal
          bookingId={createdBookingIds[0]}
          facilityId={facilityId}
          facilityName={facilityName}
          onClose={() => setShowFeedbackModal(false)}
          onSuccess={() => setShowFeedbackModal(false)}
        />
      )}

      <style>{`
        @media (min-width: 992px) { .checkout-layout { grid-template-columns: 2fr 1.2fr !important; } }
      `}</style>
    </div>
  );
};
