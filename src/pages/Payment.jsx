import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Undo2, Calendar, Clock, MapPin, Wallet,
  Activity, UtensilsCrossed, CreditCard, QrCode, Landmark, Lock
} from 'lucide-react';
import RazorpayModal from '../components/RazorpayModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const bookingData = location.state || {};
  const { facilityId, facilityName, facilityLocation, date, selectedSlots = [], totalPrice = 0 } = bookingData;

  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdBookingIds, setCreatedBookingIds] = useState([]);
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
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wallet style={{ color: 'var(--primary)' }} /> Secure Checkout
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>Review your booking and complete the payment.</p>
      </div>

      {/* SUCCESS VIEW */}
      {success ? (
        <div className="glass-card animate-scale-up" style={{ padding: '48px 40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid rgb(16,185,129)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <ShieldCheck size={40} style={{ color: 'rgb(16,185,129)' }} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px', color: 'rgb(16,185,129)' }}>Booking Confirmed! 🎉</h2>
          <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 500, marginBottom: '6px' }}>Your slot at <strong>{facilityName}</strong> is reserved.</p>
          {createdBookingIds.length > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '32px' }}>Booking ID: {createdBookingIds.map(id => `#${id}`).join(', ')}</p>
          )}
          {errorMsg && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '16px' }}>{errorMsg}</p>}

          {/* Canteen CTA */}
          <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(239,68,68,0.08))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🍔</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Hungry? Order Food from the Canteen!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px' }}>Get snacks, fast food, and drinks delivered to your seat during the match.</p>
            <button
              onClick={() => navigate(`/canteen?bookingId=${createdBookingIds[0] || ''}&facilityId=${facilityId}&facilityName=${encodeURIComponent(facilityName || '')}`)}
              style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: '#fff', border: 'none', padding: '13px 28px', borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(245,158,11,0.3)', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <UtensilsCrossed size={18} /> Order Food from Canteen
            </button>
          </div>
          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>
            Skip — Go to my bookings
          </button>
        </div>
      ) : (
        /* CHECKOUT LAYOUT */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }} className="checkout-layout">

          {/* Left: Payment Trigger */}
          <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
              Complete Your Payment
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
              <button onClick={() => navigate(`/facilities/${facilityId}`)} className="btn"
                style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}>
                Cancel
              </button>
              <button onClick={() => setShowModal(true)} className="btn btn-primary"
                style={{ flex: 2, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem', fontWeight: 700 }}>
                <Lock size={16} /> Pay ₹{totalPrice.toFixed(2)} Securely
              </button>
            </div>
          </div>

          {/* Right: Booking Summary */}
          <div style={{ position: 'relative' }}>
            <div className="glass-card" style={{ padding: '32px', position: 'sticky', top: '110px', border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--primary)' }} /> Booking Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{facilityName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} /><span>{facilityLocation}</span>
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Date</span>
                  <span style={{ fontWeight: 600 }}>{date}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> Time Slots ({selectedSlots.length})</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '20px' }}>
                    {selectedSlots.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>• {s.startTime} - {s.endTime}</span>
                        <span style={{ fontWeight: 500 }}>₹{parseFloat(s.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ borderBottom: '2px solid var(--card-border)', paddingBottom: '12px', marginTop: '8px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Total Chargeable:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Razorpay-style Modal */}
      {showModal && (
        <RazorpayModal
          totalPrice={totalPrice}
          merchantName={facilityName}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowModal(false)}
        />
      )}

      <style>{`
        @media (min-width: 992px) { .checkout-layout { grid-template-columns: 2fr 1.2fr !important; } }
      `}</style>
    </div>
  );
};
