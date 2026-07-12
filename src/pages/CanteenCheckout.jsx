import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Clock, ShoppingBag, ChevronLeft,
  Utensils, Wallet, MapPin, Check, AlertCircle, Lock,
  CreditCard, QrCode, Landmark
} from 'lucide-react';
import RazorpayModal from '../components/RazorpayModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = API_BASE_URL + '/api/canteen';

export const CanteenCheckout = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const { bookingId, facilityId, facilityName, cart = [], totalPrice = 0 } = state;

  const [deliveryTime, setDeliveryTime] = useState('before');
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'canteen'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="container" style={{ marginTop: '80px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px' }}>
          <Utensils size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No items in cart</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please go back and add items.</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">← Back to Menu</button>
        </div>
      </div>
    );
  }

  /* Real API call — triggered by modal after payment simulation */
  const placeOrderAPI = async () => {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        bookingId: bookingId || null,
        facilityId: facilityId || null,
        items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, is_veg: i.is_veg })),
        totalPrice,
        deliveryTime,
        paymentMethod: 'online'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to place order.');
    return data;
  };

  /* Called by RazorpayModal onSuccess */
  const handlePaymentSuccess = async () => {
    const data = await placeOrderAPI();
    setShowModal(false);
    navigate('/canteen/confirmation', {
      state: { order: data.order, facilityName, bookingId, cart, totalPrice, deliveryTime, paymentMethod: 'online' }
    });
  };

  /* Pay at Canteen (no payment modal) */
  const handleCanteenPay = async () => {
    if (!acknowledged) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          bookingId: bookingId || null,
          facilityId: facilityId || null,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, is_veg: i.is_veg })),
          totalPrice,
          deliveryTime,
          paymentMethod: 'canteen'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order.');
      navigate('/canteen/confirmation', {
        state: { order: data.order, facilityName, bookingId, cart, totalPrice, deliveryTime, paymentMethod: 'canteen' }
      });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const deliveryOptions = [
    { value: 'before', label: 'Before the Match', icon: '⚡', desc: 'Get your food ready before play starts' },
    { value: 'during', label: 'During the Match', icon: '🎮', desc: 'Delivered at half-time or mid-game break' },
    { value: 'after', label: 'After the Match', icon: '🏆', desc: 'Celebrate your game with a meal' },
  ];

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '32px', paddingBottom: '60px' }}>

      {/* Header */}
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginBottom: '24px', fontWeight: 600 }}>
        <ChevronLeft size={18} /> Back to Menu
      </button>
      <h1 className="page-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShoppingBag style={{ color: 'var(--primary)' }} /> Canteen Checkout
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Review your order and choose payment.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '28px' }} className="checkout-canteen-layout">

        {/* Left: Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Delivery Time */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--primary)' }} /> When do you want food?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {deliveryOptions.map(opt => (
                <label key={opt.value} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px', borderRadius: '12px', cursor: 'pointer',
                  border: deliveryTime === opt.value ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                  background: deliveryTime === opt.value ? 'rgba(99,102,241,0.07)' : 'transparent',
                  transition: 'all 0.2s'
                }}>
                  <input type="radio" name="delivery" value={opt.value} checked={deliveryTime === opt.value} onChange={() => setDeliveryTime(opt.value)} style={{ display: 'none' }} />
                  <span style={{ fontSize: '1.6rem' }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{opt.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{opt.desc}</div>
                  </div>
                  {deliveryTime === opt.value && (
                    <div style={{ marginLeft: 'auto', width: '22px', height: '22px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Check size={13} color="#fff" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="glass-card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={18} style={{ color: 'var(--primary)' }} /> Payment Method
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              {[
                { value: 'online', label: 'Pay Online', icon: <Lock size={22} />, desc: 'Card · UPI · NetBanking · Wallet' },
                { value: 'canteen', label: 'Pay at Canteen', icon: <Utensils size={22} />, desc: 'Cash / Card at counter' }
              ].map(pm => (
                <button key={pm.value} onClick={() => setPaymentMethod(pm.value)} style={{
                  padding: '18px 12px', borderRadius: '12px', cursor: 'pointer',
                  border: paymentMethod === pm.value ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                  background: paymentMethod === pm.value ? 'rgba(99,102,241,0.08)' : 'transparent',
                  color: paymentMethod === pm.value ? 'var(--primary)' : 'var(--text-main)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  fontWeight: 600, transition: 'all 0.2s'
                }}>
                  {pm.icon}
                  <span style={{ fontSize: '0.85rem' }}>{pm.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{pm.desc}</span>
                </button>
              ))}
            </div>

            {/* Online: show accepted methods preview */}
            {paymentMethod === 'online' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                  {[
                    { icon: <CreditCard size={16} />, label: 'Cards' },
                    { icon: <QrCode size={16} />, label: 'UPI' },
                    { icon: <Landmark size={16} />, label: 'Net Banking' },
                    { icon: <Wallet size={16} />, label: 'Wallets' },
                  ].map(m => (
                    <div key={m.label} style={{ padding: '10px 6px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      <span style={{ color: 'var(--primary)' }}>{m.icon}</span>{m.label}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  🔒 Secure payment popup will open after confirming your order.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--danger)', fontSize: '0.875rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div>
          <div className="glass-card" style={{ padding: '28px', position: 'sticky', top: '110px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Utensils size={18} style={{ color: 'var(--primary)' }} /> Order Summary
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <MapPin size={14} style={{ color: 'var(--primary)' }} /> {facilityName}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.is_veg ? 'var(--primary)' : 'var(--danger)', flexShrink: 0 }} />
                    <span>{item.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>× {item.qty}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>₹{(item.qty * parseFloat(item.price)).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '2px solid var(--card-border)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            {/* Cancellation Notice */}
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px', fontSize: '0.8rem', lineHeight: '1.5', textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> Important Notice
              </h3>
              <ul style={{ paddingLeft: '16px', margin: 0, color: 'var(--text-muted)' }}>
                <li>Food orders can only be cancelled while the status is <strong>Order Placed</strong>.</li>
                <li>Once the order status changes to <strong>Preparing</strong>, cancellation will not be possible.</li>
                <li>Please review your order carefully before confirming.</li>
              </ul>
            </div>

            {/* Acknowledgment */}
            <label style={{ display: 'flex', alignItems: 'start', gap: '10px', marginBottom: '20px', cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left' }}>
              <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}
                style={{ marginTop: '3px', cursor: 'pointer', accentColor: 'var(--primary)' }} />
              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                I acknowledge the cancellation policy and have reviewed my order.
              </span>
            </label>

            {/* Confirm Button */}
            {paymentMethod === 'online' ? (
              <button
                onClick={() => { if (acknowledged) setShowModal(true); }}
                className="btn btn-primary"
                disabled={!acknowledged}
                style={{ width: '100%', padding: '14px', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: acknowledged ? 1 : 0.5, cursor: acknowledged ? 'pointer' : 'not-allowed' }}
              >
                <Lock size={16} /> Pay ₹{totalPrice.toFixed(2)} Securely
              </button>
            ) : (
              <button
                onClick={handleCanteenPay}
                className="btn btn-primary"
                disabled={loading || !acknowledged}
                style={{ width: '100%', padding: '14px', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Placing Order...
                  </>
                ) : (
                  `Confirm Order · ₹${totalPrice.toFixed(2)}`
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Razorpay-style Payment Modal */}
      {showModal && (
        <RazorpayModal
          totalPrice={totalPrice}
          merchantName={`Canteen · ${facilityName}`}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowModal(false)}
        />
      )}

      <style>{`
        @media (min-width: 900px) { .checkout-canteen-layout { grid-template-columns: 1.4fr 1fr !important; } }
        @keyframes spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
};
