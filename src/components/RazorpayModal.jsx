import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard, QrCode, Landmark, Wallet, ChevronRight, Lock,
  X, CheckCircle, AlertCircle, Smartphone, RefreshCw, Eye, EyeOff, ShieldCheck
} from 'lucide-react';

/* ─── Razorpay Brand Colours ─── */
export const RZP = {
  blue: '#3395FF',
  darkBlue: '#1A6FCC',
  bg: '#FFFFFF',
  sidebar: '#F8FAFE',
  border: '#E8EEF8',
  text: '#1A1A2E',
  muted: '#6B7280',
  success: '#10B981',
  danger: '#EF4444',
};

const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExpiry = (v) => {
  const raw = v.replace(/\D/g, '').slice(0, 4);
  return raw.length > 2 ? raw.slice(0, 2) + ' / ' + raw.slice(2) : raw;
};

/**
 * RazorpayModal
 * Props:
 *   totalPrice  {number}   - amount to show
 *   merchantName {string}  - shown in sidebar (facility or canteen name)
 *   onSuccess   {async fn} - called after simulated payment; should do the real API call; throw to trigger failure screen
 *   onClose     {fn}       - called when user closes modal without paying
 */
const RazorpayModal = ({ totalPrice, merchantName, onSuccess, onClose }) => {
  const [activeMethod, setActiveMethod] = useState('card');
  const [step, setStep] = useState('form'); // form | otp | processing | done | failed
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [upiTimer, setUpiTimer] = useState(120);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const methods = [
    { id: 'card', label: 'Card', icon: <CreditCard size={16} /> },
    { id: 'upi', label: 'UPI', icon: <QrCode size={16} /> },
    { id: 'netbanking', label: 'Net Banking', icon: <Landmark size={16} /> },
    { id: 'wallet', label: 'Wallets', icon: <Wallet size={16} /> },
  ];

  const banks = [
    { id: 'sbi', label: 'State Bank of India', logo: '🏦' },
    { id: 'hdfc', label: 'HDFC Bank', logo: '🔵' },
    { id: 'icici', label: 'ICICI Bank', logo: '🟠' },
    { id: 'axis', label: 'Axis Bank', logo: '🟣' },
    { id: 'kotak', label: 'Kotak Mahindra', logo: '🔴' },
    { id: 'pnb', label: 'Punjab National Bank', logo: '🟡' },
  ];

  const wallets = [
    { id: 'paytm', label: 'Paytm', color: '#00BAF2' },
    { id: 'phonepe', label: 'PhonePe', color: '#5F259F' },
    { id: 'gpay', label: 'Google Pay', color: '#4285F4' },
    { id: 'mobikwik', label: 'MobiKwik', color: '#1BBBEC' },
  ];

  /* UPI countdown */
  useEffect(() => {
    if (activeMethod === 'upi' && step === 'form') {
      timerRef.current = setInterval(() => {
        setUpiTimer(t => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [activeMethod, step]);

  const handleMethodChange = (id) => {
    setActiveMethod(id);
    setStep('form');
    setUpiTimer(120);
    clearInterval(timerRef.current);
  };

  /* OTP input handlers */
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const runProcessing = async (afterFn) => {
    setStep('processing');
    const msgs = [
      'Connecting to payment network...',
      'Authenticating your details...',
      'Verifying transaction...',
      'Confirming with bank...',
      'Finalizing...',
    ];
    for (let m of msgs) {
      setProcessingMsg(m);
      await new Promise(r => setTimeout(r, 600));
    }
    await afterFn();
  };

  const finalizePayment = async () => {
    try {
      await onSuccess();
      setStep('done');
    } catch {
      setStep('failed');
    }
  };

  const handleCardPay = (e) => { e.preventDefault(); setStep('otp'); };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Please enter all 6 digits.'); return; }
    setOtpError('');
    await runProcessing(finalizePayment);
  };

  const handleUpiPay = async (e) => {
    e.preventDefault();
    if (!upiId.includes('@')) return;
    await runProcessing(finalizePayment);
  };

  const handleNetbankingPay = async (e) => {
    e.preventDefault();
    if (!selectedBank) return;
    await runProcessing(finalizePayment);
  };

  const handleWalletPay = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    await runProcessing(finalizePayment);
  };

  /* ─── Shared Styles ─── */
  const S = {
    overlay: {
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'rzpFadeIn 0.2s ease',
    },
    modal: {
      width: '100%', maxWidth: '820px',
      display: 'flex', borderRadius: '12px', overflow: 'hidden',
      boxShadow: '0 25px 80px rgba(0,0,0,0.5)',
      animation: 'rzpSlideUp 0.3s ease', maxHeight: '90vh',
    },
    sidebar: {
      width: '240px', minWidth: '240px',
      background: RZP.sidebar, borderRight: `1px solid ${RZP.border}`,
      display: 'flex', flexDirection: 'column',
    },
    sidebarHeader: { padding: '20px 16px', borderBottom: `1px solid ${RZP.border}`, background: '#fff' },
    content: { flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'auto' },
    contentHeader: {
      padding: '16px 24px', borderBottom: `1px solid ${RZP.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff',
    },
    formArea: { padding: '24px', flex: 1 },
    input: {
      width: '100%', border: `1.5px solid ${RZP.border}`, borderRadius: '8px',
      padding: '10px 14px', fontSize: '14px', color: RZP.text, background: '#fff',
      outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
    },
    label: { fontSize: '12px', fontWeight: 600, color: RZP.muted, marginBottom: '6px', display: 'block', letterSpacing: '0.03em' },
    btn: {
      width: '100%', background: `linear-gradient(135deg, ${RZP.blue}, ${RZP.darkBlue})`,
      color: '#fff', border: 'none', borderRadius: '8px', padding: '13px',
      fontWeight: 700, fontSize: '15px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      transition: 'opacity 0.2s', marginTop: '20px',
    },
    methodBtn: (active) => ({
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '12px 16px', cursor: 'pointer',
      borderLeft: `3px solid ${active ? RZP.blue : 'transparent'}`,
      background: active ? '#EBF3FF' : 'transparent',
      color: active ? RZP.blue : RZP.text, fontWeight: active ? 700 : 500, fontSize: '13px',
      transition: 'all 0.15s', border: 'none', width: '100%', textAlign: 'left',
      borderLeftWidth: '3px', borderLeftStyle: 'solid',
    }),
  };

  /* ── PROCESSING ── */
  if (step === 'processing') return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: '360px', borderRadius: '16px' }}>
        <div style={{ background: '#fff', padding: '48px 32px', textAlign: 'center', flex: 1 }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 24px', position: 'relative' }}>
            <svg viewBox="0 0 64 64" style={{ width: '100%', height: '100%', animation: 'rzpSpin 1s linear infinite' }}>
              <circle cx="32" cy="32" r="28" fill="none" stroke="#E8EEF8" strokeWidth="4" />
              <circle cx="32" cy="32" r="28" fill="none" stroke={RZP.blue} strokeWidth="4" strokeDasharray="44 132" strokeLinecap="round" />
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: '15px', color: RZP.text, marginBottom: '8px' }}>Processing Payment</p>
          <p style={{ fontSize: '13px', color: RZP.muted }}>{processingMsg}</p>
          <div style={{ marginTop: '24px', display: 'flex', gap: '6px', justifyContent: 'center' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: RZP.blue, animation: `rzpBounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── SUCCESS ── */
  if (step === 'done') return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: '360px', borderRadius: '16px' }}>
        <div style={{ background: '#fff', padding: '48px 32px', textAlign: 'center', flex: 1 }}>
          <div style={{ width: '72px', height: '72px', margin: '0 auto 20px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'rzpScaleIn 0.4s ease' }}>
            <CheckCircle size={36} style={{ color: '#10B981' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: RZP.text, marginBottom: '8px' }}>Payment Successful!</h2>
          <p style={{ color: RZP.muted, fontSize: '14px', marginBottom: '4px' }}>₹{totalPrice.toFixed(2)} paid successfully</p>
          <p style={{ color: RZP.muted, fontSize: '13px', marginBottom: '28px' }}><strong style={{ color: RZP.text }}>{merchantName}</strong></p>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#166534' }}>
            ✅ Confirmation has been sent to your inbox.
          </div>
        </div>
      </div>
    </div>
  );

  /* ── FAILED ── */
  if (step === 'failed') return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: '360px', borderRadius: '16px' }}>
        <div style={{ background: '#fff', padding: '48px 32px', textAlign: 'center', flex: 1 }}>
          <div style={{ width: '72px', height: '72px', margin: '0 auto 20px', borderRadius: '50%', background: '#FEF2F2', border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={36} style={{ color: '#EF4444' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: RZP.text, marginBottom: '8px' }}>Payment Failed</h2>
          <p style={{ color: RZP.muted, fontSize: '14px', marginBottom: '28px' }}>Something went wrong. Please try again.</p>
          <button style={{ ...S.btn, background: '#EF4444', marginTop: 0 }} onClick={() => setStep('form')}>
            <RefreshCw size={16} /> Try Again
          </button>
          <button onClick={onClose} style={{ marginTop: '12px', background: 'none', border: 'none', color: RZP.muted, cursor: 'pointer', fontSize: '13px' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  /* ── OTP ── */
  if (step === 'otp') return (
    <div style={S.overlay}>
      <div style={{ ...S.modal, maxWidth: '420px', borderRadius: '16px' }}>
        <div style={{ background: '#fff', flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${RZP.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: RZP.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={14} color="#fff" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '13px', color: RZP.text }}>Secure 3D Authentication</p>
              <p style={{ fontSize: '11px', color: RZP.muted }}>Powered by your bank</p>
            </div>
          </div>
          <div style={{ padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#EBF3FF', border: `2px solid ${RZP.blue}`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={22} style={{ color: RZP.blue }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '16px', color: RZP.text, marginBottom: '6px' }}>Enter OTP</h3>
            <p style={{ fontSize: '13px', color: RZP.muted, marginBottom: '24px' }}>
              A 6-digit OTP has been sent to your registered mobile number linked with your card.
            </p>
            <form onSubmit={handleOtpSubmit}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '16px' }}>
                {otp.map((digit, i) => (
                  <input key={i} ref={el => otpRefs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    style={{ width: '44px', height: '52px', textAlign: 'center', fontSize: '20px', fontWeight: 700, border: `2px solid ${digit ? RZP.blue : RZP.border}`, borderRadius: '10px', outline: 'none', color: RZP.text, background: digit ? '#EBF3FF' : '#fff', transition: 'all 0.15s' }}
                  />
                ))}
              </div>
              {otpError && <p style={{ color: RZP.danger, fontSize: '12px', marginBottom: '12px' }}>{otpError}</p>}
              <p style={{ fontSize: '11px', color: RZP.muted, marginBottom: '20px' }}>
                Demo: Enter any 6 digits (e.g. <strong>123456</strong>)
              </p>
              <button type="submit" style={S.btn}>
                <Lock size={15} /> Verify & Pay ₹{totalPrice.toFixed(2)}
              </button>
            </form>
            <button onClick={() => setStep('form')} style={{ marginTop: '12px', background: 'none', border: 'none', color: RZP.muted, cursor: 'pointer', fontSize: '12px' }}>
              ← Back to payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── MAIN MODAL ── */
  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>

        {/* SIDEBAR */}
        <div style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: RZP.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={13} color="#fff" />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '13px', color: RZP.text }}>SportSlot Pay</p>
                <p style={{ fontSize: '10px', color: RZP.muted }}>Secure Checkout</p>
              </div>
            </div>
            <div style={{ background: '#EBF3FF', borderRadius: '8px', padding: '10px 12px' }}>
              <p style={{ fontSize: '11px', color: RZP.muted, marginBottom: '2px' }}>Amount Due</p>
              <p style={{ fontWeight: 800, fontSize: '20px', color: RZP.text }}>₹{totalPrice.toFixed(2)}</p>
              <p style={{ fontSize: '11px', color: RZP.muted, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{merchantName}</p>
            </div>
          </div>

          <div style={{ flex: 1, paddingTop: '8px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: RZP.muted, padding: '8px 16px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Payment Methods</p>
            {methods.map(m => (
              <button key={m.id} style={S.methodBtn(activeMethod === m.id)} onClick={() => handleMethodChange(m.id)}>
                <span style={{ opacity: activeMethod === m.id ? 1 : 0.6 }}>{m.icon}</span>
                {m.label}
                {activeMethod === m.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 16px', borderTop: `1px solid ${RZP.border}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={11} style={{ color: RZP.muted }} />
            <span style={{ fontSize: '10px', color: RZP.muted }}>256-bit SSL Encrypted</span>
          </div>
        </div>

        {/* CONTENT */}
        <div style={S.content}>
          <div style={S.contentHeader}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px', color: RZP.text }}>
                {activeMethod === 'card' && 'Pay with Card'}
                {activeMethod === 'upi' && 'UPI Payment'}
                {activeMethod === 'netbanking' && 'Net Banking'}
                {activeMethod === 'wallet' && 'Wallets'}
              </p>
              <p style={{ fontSize: '11px', color: RZP.muted }}>All transactions are secure and encrypted</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}>
              <X size={18} style={{ color: RZP.muted }} />
            </button>
          </div>

          <div style={S.formArea}>

            {/* CARD */}
            {activeMethod === 'card' && (
              <form onSubmit={handleCardPay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={S.label}>CARD NUMBER</label>
                  <input style={S.input} placeholder="1234 5678 9012 3456" value={cardNum}
                    onChange={e => setCardNum(fmtCard(e.target.value))} required
                    onFocus={e => e.target.style.borderColor = RZP.blue}
                    onBlur={e => e.target.style.borderColor = RZP.border} />
                </div>
                <div>
                  <label style={S.label}>NAME ON CARD</label>
                  <input style={S.input} placeholder="John Doe" value={cardName}
                    onChange={e => setCardName(e.target.value)} required
                    onFocus={e => e.target.style.borderColor = RZP.blue}
                    onBlur={e => e.target.style.borderColor = RZP.border} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={S.label}>EXPIRY</label>
                    <input style={S.input} placeholder="MM / YY" value={expiry} maxLength={7}
                      onChange={e => setExpiry(fmtExpiry(e.target.value))} required
                      onFocus={e => e.target.style.borderColor = RZP.blue}
                      onBlur={e => e.target.style.borderColor = RZP.border} />
                  </div>
                  <div>
                    <label style={S.label}>CVV</label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...S.input, paddingRight: '36px' }}
                        type={showCvv ? 'text' : 'password'} placeholder="•••" value={cvv}
                        onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} required
                        onFocus={e => e.target.style.borderColor = RZP.blue}
                        onBlur={e => e.target.style.borderColor = RZP.border} />
                      <button type="button" onClick={() => setShowCvv(!showCvv)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: RZP.muted }}>
                        {showCvv ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {['VISA', 'MC', 'AMEX', 'RuPay'].map(c => (
                    <div key={c} style={{ padding: '3px 8px', border: `1px solid ${RZP.border}`, borderRadius: '4px', fontSize: '9px', fontWeight: 800, color: RZP.muted, letterSpacing: '0.05em' }}>{c}</div>
                  ))}
                </div>
                <button type="submit" style={S.btn}>
                  <Lock size={15} /> Pay ₹{totalPrice.toFixed(2)}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '8px 12px' }}>
                  <ShieldCheck size={13} style={{ color: '#10B981', flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: '#166534' }}>Your card details are never stored. 3D Secure authentication will be triggered.</span>
                </div>
              </form>
            )}

            {/* UPI */}
            {activeMethod === 'upi' && (
              <form onSubmit={handleUpiPay} style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '160px', height: '160px', margin: '0 auto', border: `3px solid ${RZP.blue}`, borderRadius: '16px', background: '#fff', padding: '12px', boxShadow: `0 0 20px rgba(51,149,255,0.2)`, animation: upiTimer > 0 ? 'rzpQrPulse 2s ease-in-out infinite' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: '2px', width: '120px', height: '120px' }}>
                      {Array.from({ length: 64 }, (_, i) => (
                        <div key={i} style={{ borderRadius: '1px', background: ([3,4,5,8,9,10,24,25,26,40,41,42,56,57,58,11,27,43].includes(i) || i % 7 === 0 || i % 11 === 0) ? '#1A1A2E' : 'transparent', width: '100%', aspectRatio: '1' }} />
                      ))}
                    </div>
                    {upiTimer === 0 && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <RefreshCw size={20} style={{ color: RZP.blue }} />
                        <span style={{ fontSize: '11px', fontWeight: 700, color: RZP.blue }}>QR Expired</span>
                      </div>
                    )}
                  </div>
                  <p style={{ marginTop: '10px', fontSize: '12px', color: RZP.muted }}>Scan with BHIM · GPay · PhonePe · Paytm</p>
                  {upiTimer > 0 && (
                    <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 700, color: upiTimer < 30 ? RZP.danger : RZP.blue }}>
                      ⏱ {String(Math.floor(upiTimer / 60)).padStart(2, '0')}:{String(upiTimer % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>
                <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: RZP.border }} />
                  <span style={{ fontSize: '12px', color: RZP.muted, fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: RZP.border }} />
                </div>
                <div style={{ width: '100%' }}>
                  <label style={S.label}>ENTER UPI ID</label>
                  <input style={S.input} placeholder="mobilenumber@upi" value={upiId}
                    onChange={e => setUpiId(e.target.value)} required
                    onFocus={e => e.target.style.borderColor = RZP.blue}
                    onBlur={e => e.target.style.borderColor = RZP.border} />
                  <p style={{ fontSize: '11px', color: RZP.muted, marginTop: '6px' }}>Example: 9876543210@paytm, yourname@okaxis</p>
                </div>
                <button type="submit" style={{ ...S.btn, width: '100%', marginTop: 0 }}>
                  <QrCode size={15} /> Verify & Pay ₹{totalPrice.toFixed(2)}
                </button>
              </form>
            )}

            {/* NET BANKING */}
            {activeMethod === 'netbanking' && (
              <form onSubmit={handleNetbankingPay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: RZP.text, fontWeight: 600 }}>Select your bank</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {banks.map(b => (
                    <button key={b.id} type="button" onClick={() => setSelectedBank(b.id)}
                      style={{ padding: '12px', border: `1.5px solid ${selectedBank === b.id ? RZP.blue : RZP.border}`, borderRadius: '8px', background: selectedBank === b.id ? '#EBF3FF' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s', textAlign: 'left' }}>
                      <span style={{ fontSize: '18px' }}>{b.logo}</span>
                      <span style={{ fontSize: '12px', fontWeight: selectedBank === b.id ? 700 : 500, color: selectedBank === b.id ? RZP.blue : RZP.text }}>{b.label}</span>
                      {selectedBank === b.id && <CheckCircle size={14} style={{ color: RZP.blue, marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
                {selectedBank && (
                  <div style={{ background: '#EBF3FF', borderRadius: '8px', padding: '12px', fontSize: '12px', color: RZP.blue, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} />
                    You will be redirected to {banks.find(b => b.id === selectedBank)?.label} for secure payment.
                  </div>
                )}
                <button type="submit" disabled={!selectedBank}
                  style={{ ...S.btn, opacity: selectedBank ? 1 : 0.5, cursor: selectedBank ? 'pointer' : 'not-allowed', marginTop: 0 }}>
                  <Landmark size={15} /> Pay ₹{totalPrice.toFixed(2)} via Net Banking
                </button>
              </form>
            )}

            {/* WALLETS */}
            {activeMethod === 'wallet' && (
              <form onSubmit={handleWalletPay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: RZP.text, fontWeight: 600 }}>Select your wallet</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {wallets.map(w => (
                    <button key={w.id} type="button" onClick={() => setSelectedWallet(w.id)}
                      style={{ padding: '14px 16px', border: `1.5px solid ${selectedWallet === w.id ? w.color : RZP.border}`, borderRadius: '8px', background: selectedWallet === w.id ? `${w.color}15` : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.15s', textAlign: 'left' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: w.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wallet size={18} color="#fff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: selectedWallet === w.id ? 700 : 500, fontSize: '14px', color: selectedWallet === w.id ? w.color : RZP.text }}>{w.label}</p>
                        <p style={{ fontSize: '11px', color: RZP.muted }}>Pay using {w.label} balance</p>
                      </div>
                      {selectedWallet === w.id && <CheckCircle size={18} style={{ color: w.color }} />}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={!selectedWallet}
                  style={{ ...S.btn, opacity: selectedWallet ? 1 : 0.5, cursor: selectedWallet ? 'pointer' : 'not-allowed', marginTop: 0 }}>
                  <Wallet size={15} /> Pay ₹{totalPrice.toFixed(2)}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes rzpFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rzpSlideUp { from { opacity: 0; transform: translateY(40px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes rzpSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes rzpScaleIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes rzpBounce { 0%, 80%, 100% { transform: scale(0) } 40% { transform: scale(1) } }
        @keyframes rzpQrPulse { 0%, 100% { box-shadow: 0 0 12px rgba(51,149,255,0.2) } 50% { box-shadow: 0 0 28px rgba(51,149,255,0.5) } }
      `}</style>
    </div>
  );
};

export default RazorpayModal;
