import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle2, Clock, Utensils, MapPin, Hash,
  ChefHat, Truck, PackageCheck, RefreshCw, BellRing, User
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const API = API_BASE_URL + '/api/canteen';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: <CheckCircle2 size={18} />, color: '#6366f1' },
  { key: 'preparing', label: 'Preparing', icon: <ChefHat size={18} />, color: '#f59e0b' },
  { key: 'ready', label: 'Ready for Pickup', icon: <PackageCheck size={18} />, color: '#10b981' },
  { key: 'delivered', label: 'Delivered', icon: <Truck size={18} />, color: '#10b981' },
];

const DELIVERY_LABELS = {
  before: '⚡ Before the Match',
  during: '🎮 During the Match',
  after: '🏆 After the Match'
};

export const CanteenConfirmation = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const { order: initialOrder, facilityName, bookingId, cart = [], totalPrice = 0, deliveryTime, paymentMethod } = state;

  const [order, setOrder] = useState(initialOrder || null);
  const [notification, setNotification] = useState('');
  const prevStatusRef = useRef(initialOrder?.order_status || '');
  const orderId = initialOrder?.id;

  // Poll every 5 seconds for order status updates
  useEffect(() => {
    if (!orderId || !token) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API}/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          // Notify on status change to 'ready' or 'delivered'
          if (prevStatusRef.current !== data.order_status) {
            if (data.order_status === 'ready') {
              setNotification('🔔 Your food is ready for pickup!');
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🍔 Canteen: Food Ready!', { body: 'Your order is ready for pickup at the canteen.' });
              }
            } else if (data.order_status === 'delivered') {
              setNotification('✅ Your food has been delivered. Enjoy your meal!');
            }
            prevStatusRef.current = data.order_status;
          }
        }
      } catch (err) {
        // Silently fail polls
      }
    };
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [orderId, token]);

  if (!initialOrder) {
    return (
      <div className="container" style={{ marginTop: '80px', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '40px' }}>
          <Utensils size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No order data found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please place an order first.</p>
          <button onClick={() => navigate('/facilities')} className="btn btn-primary">Browse Venues</button>
        </div>
      </div>
    );
  }

  const currentStatus = order?.order_status || 'pending';
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === currentStatus);

  const orderItems = order?.items || cart;

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '32px', paddingBottom: '60px', maxWidth: '720px', margin: '0 auto' }}>

      {/* Notification Banner */}
      {notification && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 20px', borderRadius: '12px', marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
          border: '1px solid rgba(16,185,129,0.4)', color: 'var(--text-main)',
          animation: 'fadeIn 0.4s ease'
        }}>
          <BellRing size={20} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ fontWeight: 600 }}>{notification}</span>
          <button onClick={() => setNotification('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}>×</button>
        </div>
      )}

      {/* Success Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(16,185,129,0.1)', border: '2px solid #10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', animation: 'scaleIn 0.4s ease'
        }}>
          <CheckCircle2 size={40} style={{ color: '#10b981' }} />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
          Order Confirmed! 🎉
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Your food order has been placed successfully.</p>
      </div>

      {/* Order Status Stepper */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} style={{ color: 'var(--primary)' }} /> Live Order Status
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>Updates every 5s</span>
        </h2>
        <div className="status-stepper">
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx <= currentStepIdx;
            const isActive = idx === currentStepIdx;
            return (
              <React.Fragment key={step.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: isDone ? step.color : 'var(--bg-surface)',
                    border: isDone ? `2px solid ${step.color}` : '2px solid var(--card-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isDone ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.4s',
                    boxShadow: isActive ? `0 0 16px ${step.color}66` : 'none',
                    animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none'
                  }}>
                    {step.icon}
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: isDone ? 700 : 400, color: isDone ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                    {step.label}
                  </span>
                </div>
                {idx < STATUS_STEPS.length - 1 && (
                  <div style={{
                    flex: 1, height: '2px', marginTop: '-20px', alignSelf: 'flex-start', marginTop: '21px',
                    background: idx < currentStepIdx ? 'var(--primary)' : 'var(--card-border)',
                    transition: 'background 0.4s', borderRadius: '1px'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {currentStatus === 'cancelled' && (
          <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', color: 'var(--danger)', fontWeight: 600 }}>
            ❌ This order has been cancelled
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Order Details</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {[
            { label: 'Order ID', value: `#FO-${String(order?.id || '—').padStart(4, '0')}`, icon: <Hash size={14} /> },
            { label: 'Booking ID', value: bookingId ? `#${bookingId}` : '—', icon: <Hash size={14} /> },
            { label: 'Stadium', value: facilityName || order?.facility_name || '—', icon: <MapPin size={14} /> },
            { label: 'Delivery', value: DELIVERY_LABELS[order?.delivery_time || deliveryTime] || '—', icon: <Clock size={14} /> },
            { label: 'Payment', value: (order?.payment_method || paymentMethod) === 'online' ? '💳 Paid Online' : '💵 Pay at Canteen', icon: null },
            { label: 'Payment Status', value: (order?.payment_status || 'pending') === 'paid' ? '✅ Paid' : '⏳ Pending', icon: null },
          ].map(row => (
            <div key={row.label}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {row.icon} {row.label}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{row.value}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
          <div style={{ fontWeight: 700, marginBottom: '14px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ordered Items
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(Array.isArray(orderItems) ? orderItems : []).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: '10px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.is_veg ? '#10b981' : '#ef4444', flexShrink: 0 }} />
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>× {item.qty}</span>
                </div>
                <span style={{ fontWeight: 700 }}>₹{(parseFloat(item.price) * item.qty).toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px dashed var(--card-border)' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Amount</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{parseFloat(order?.total_price || totalPrice).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <Link to="/profile" style={{ flex: 1 }}>
          <button className="btn" style={{ width: '100%', padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--bg-surface)', border: '1px solid var(--card-border)', color: 'var(--text-main)', fontWeight: 600 }}>
            <User size={16} /> My Orders
          </button>
        </Link>
        <button onClick={() => navigate('/facilities')} className="btn btn-primary" style={{ flex: 1, padding: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600 }}>
          Book Another Slot
        </button>
      </div>

      <style>{`
        .status-stepper { display: flex; align-items: flex-start; }
        @keyframes scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); } 50% { box-shadow: 0 0 0 8px rgba(99,102,241,0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
