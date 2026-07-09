import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Landmark, QrCode, ShieldCheck, Undo2, Calendar, Clock, MapPin, DollarSign, Wallet, Activity, UtensilsCrossed } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


export const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();

  // Retrieve booking details from state
  const bookingData = location.state || {};
  const { facilityId, facilityName, facilityLocation, date, selectedSlots = [], totalPrice = 0 } = bookingData;

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi', 'netbanking'
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');

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

  const [createdBookingIds, setCreatedBookingIds] = useState([]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Simulate network delay for verification
    setTimeout(async () => {
      try {
        const response = await fetch(API_BASE_URL + '/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            facilityId,
            date,
            slots: selectedSlots.map(s => ({
              startTime: s.startTime,
              endTime: s.endTime,
              price: s.price
            })),
            totalPrice
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Payment authentication succeeded, but booking reservation failed.');
        }

        // Store the first booking ID for canteen link
        const ids = data.bookings ? data.bookings.map(b => b.id) : (data.booking ? [data.booking.id] : []);
        setCreatedBookingIds(ids);
        setSuccess(true);

      } catch (err) {
        setErrorMsg(err.message || 'Payment processing error.');
        setLoading(false);
      }
    }, 2000);
  };

  const handleCancel = () => {
    alert('Payment Cancelled. You will be redirected back to the venue detail page.');
    navigate(`/facilities/${facilityId}`);
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wallet style={{ color: 'var(--primary)' }} />
          Secure Checkout Gateway
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>Complete your transaction to finalize your reservation.</p>
      </div>

      {success ? (
        <div className="glass-card animate-scale-up" style={{ padding: '48px 40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '2px solid rgb(16, 185, 129)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px auto'
          }}>
            <ShieldCheck size={40} style={{ color: 'rgb(16, 185, 129)' }} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px', color: 'rgb(16, 185, 129)' }}>Booking Confirmed! 🎉</h2>
          <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 500, marginBottom: '6px' }}>Your slot at <strong>{facilityName}</strong> is reserved.</p>
          {createdBookingIds.length > 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '32px' }}>Booking ID: {createdBookingIds.map(id => `#${id}`).join(', ')}</p>
          )}

          {/* Canteen CTA */}
          <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.08))', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🍔</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Hungry? Order Food from the Canteen!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '18px' }}>Get snacks, fast food, and drinks delivered to your seat during the match.</p>
            <button
              onClick={() => navigate(`/canteen?bookingId=${createdBookingIds[0] || ''}&facilityId=${facilityId}&facilityName=${encodeURIComponent(facilityName || '')}`)}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                color: '#fff', border: 'none', padding: '13px 28px',
                borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                gap: '8px', boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.4)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,0.3)'; }}
            >
              <UtensilsCrossed size={18} /> Order Food from Canteen
            </button>
          </div>

          <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>
            Skip — Go to my bookings
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px'
        }} className="checkout-layout">
          
          {/* Left Column: Form */}
          <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
              Choose Payment Method
            </h2>

            {/* Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <button 
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'card' ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                  background: paymentMethod === 'card' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                  color: paymentMethod === 'card' ? 'var(--primary)' : 'var(--text-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <CreditCard size={20} />
                <span>Card</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod('upi')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'upi' ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                  background: paymentMethod === 'upi' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                  color: paymentMethod === 'upi' ? 'var(--primary)' : 'var(--text-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <QrCode size={20} />
                <span>UPI QR / ID</span>
              </button>

              <button 
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'netbanking' ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                  background: paymentMethod === 'netbanking' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.01)',
                  color: paymentMethod === 'netbanking' ? 'var(--primary)' : 'var(--text-main)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Landmark size={20} />
                <span>Net Banking</span>
              </button>
            </div>

            {/* Forms Panel */}
            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
              
              {paymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Name on Card</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. John Doe"
                      required
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Card Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      maxLength="19"
                      placeholder="xxxx xxxx xxxx xxxx"
                      required
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">Expiry Date</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        maxLength={7}
                        placeholder="MM / YY"
                        required
                        value={cardExpiry}
                        onChange={(e) => {
                          // Strip everything except digits
                          const raw = e.target.value.replace(/\D/g, '');
                          if (raw.length === 0) {
                            setCardExpiry('');
                            return;
                          }
                          // Validate month (01–12) as user types 2nd digit
                          if (raw.length >= 2) {
                            const month = parseInt(raw.slice(0, 2), 10);
                            if (month < 1 || month > 12) return; // block invalid month
                          }
                          // Auto-insert ' / ' separator after 2 month digits
                          if (raw.length <= 2) {
                            setCardExpiry(raw);
                          } else {
                            setCardExpiry(raw.slice(0, 2) + ' / ' + raw.slice(2, 4));
                          }
                        }}
                        onKeyDown={(e) => {
                          // Allow backspace to clear separator nicely
                          if (e.key === 'Backspace' && cardExpiry.endsWith(' / ')) {
                            e.preventDefault();
                            setCardExpiry(cardExpiry.slice(0, 2));
                          }
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">CVV</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        maxLength="3"
                        placeholder="xxx"
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
                  {/* QR Code Display */}
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{
                      padding: '16px',
                      background: '#fff',
                      borderRadius: '16px',
                      border: '3px solid rgba(99, 102, 241, 0.5)',
                      boxShadow: '0 0 24px rgba(99, 102, 241, 0.25)',
                      animation: 'qrPulse 2s ease-in-out infinite',
                      display: 'inline-block'
                    }}>
                      <img
                        src="/demo_qr.png"
                        alt="Demo UPI QR Code"
                        style={{ width: '180px', height: '180px', objectFit: 'contain', display: 'block', borderRadius: '6px' }}
                      />
                    </div>
                    {/* DEMO badge */}
                    <span style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      letterSpacing: '0.05em',
                      boxShadow: '0 2px 8px rgba(239,68,68,0.4)'
                    }}>DEMO</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 600 }}>
                      Scan with any UPI app
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      BHIM · GPay · PhonePe · Paytm
                    </p>
                  </div>
                  
                  <div style={{ width: '100%', borderBottom: '1px solid rgba(255,255,255,0.05)', margin: '4px 0' }}></div>
                  
                  <div className="form-group" style={{ width: '100%', textAlign: 'left' }}>
                    <label className="form-label">Or enter UPI ID</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. john@okaxis"
                      required={paymentMethod === 'upi'}
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Select Your Bank</label>
                    <select 
                      className="form-input"
                      required={paymentMethod === 'netbanking'}
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                    >
                      <option value="">-- Select Bank --</option>
                      <option value="sbi">State Bank of India</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Holder Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. John Doe"
                      required={paymentMethod === 'netbanking'}
                      value={bankHolderName}
                      onChange={(e) => setBankHolderName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter 9-18 digit account number"
                      maxLength="18"
                      pattern="\d{9,18}"
                      title="Account number should be 9 to 18 digits"
                      required={paymentMethod === 'netbanking'}
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. SBIN0001234"
                      maxLength="11"
                      pattern="^[A-Z]{4}0[A-Z0-9]{6}$"
                      title="Invalid IFSC code format (e.g., SBIN0001234)"
                      required={paymentMethod === 'netbanking'}
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="badge-danger" style={{ padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', display: 'flex', gap: '8px' }}>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={handleCancel}
                  className="btn" 
                  disabled={loading}
                  style={{ flex: 1, padding: '14px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ flex: 2, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    `Pay ₹${totalPrice.toFixed(2)}`
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Right Column: Checkout Summary */}
          <div style={{ position: 'relative' }}>
            <div className="glass-card" style={{
              padding: '32px',
              position: 'sticky',
              top: '110px',
              border: '1px solid var(--card-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--primary)' }} />
                Booking Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Stadium/Ground Info */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px' }}>{facilityName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} />
                    <span>{facilityLocation}</span>
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}></div>

                {/* Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Date
                  </span>
                  <span style={{ fontWeight: 600 }}>{date}</span>
                </div>

                {/* Selected Slots list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> Time Slots ({selectedSlots.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '20px' }}>
                    {selectedSlots.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>• {s.startTime} - {s.endTime}</span>
                        <span style={{ fontWeight: 500 }}>₹{parseFloat(s.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ borderBottom: '2px solid var(--card-border)', paddingBottom: '12px', marginTop: '8px' }}></div>

                {/* Final total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Total Chargeable:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{totalPrice.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'rgb(16, 185, 129)', marginTop: '8px' }}>
                  <ShieldCheck size={16} />
                  <span>256-bit SSL Encrypted Transaction</span>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

      <style>{`
        @media (min-width: 992px) {
          .checkout-layout {
            grid-template-columns: 2fr 1.2fr !important;
          }
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes qrPulse {
          0%, 100% { box-shadow: 0 0 16px rgba(99, 102, 241, 0.2); border-color: rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 32px rgba(99, 102, 241, 0.5); border-color: rgba(99, 102, 241, 0.8); }
        }
      `}</style>
    </div>
  );
};
