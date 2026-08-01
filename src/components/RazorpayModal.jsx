import React, { useState, useRef, useEffect } from 'react';
import {
  CreditCard, QrCode, Landmark, Wallet, ChevronRight, Lock,
  X, CheckCircle, AlertCircle, Smartphone, Eye, EyeOff, ShieldCheck, RefreshCw, Search
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
  warning: '#F59E0B',
};

/* ─── Formatters ─── */
const fmtCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExpiry = (v) => {
  const raw = v.replace(/\D/g, '').slice(0, 4);
  return raw.length > 2 ? raw.slice(0, 2) + ' / ' + raw.slice(2) : raw;
};

/* ─── Validators ─── */
const validateCardName = (name) => {
  if (!name.trim()) return 'Name is required.';
  if (!/^[a-zA-Z ]+$/.test(name)) return 'Only letters and spaces allowed. No numbers or symbols.';
  const trimmed = name.trim();
  if (trimmed.length < 3) return 'Name must be at least 3 characters.';
  if (trimmed.length > 22) return 'Name must be at most 22 characters.';
  return '';
};

const validateExpiry = (expiry) => {
  const raw = expiry.replace(/\D/g, '');
  if (raw.length < 4) return 'Enter full expiry as MM/YY.';
  const month = parseInt(raw.slice(0, 2), 10);
  if (month < 1 || month > 12) return 'Month must be between 01 and 12.';
  return '';
};

const validateCvv = (cvv) => {
  if (!/^\d{3}$/.test(cvv)) return 'CVV must be exactly 3 digits.';
  return '';
};

const UPI_PROVIDERS = [
  'okaxis', 'okhdfcbank', 'okicici', 'oksbi', 'ybl', 'ibl', 'axl',
  'paytm', 'upi', 'apl', 'barodampay', 'cnrb', 'federal', 'freecharge',
  'hdfcbank', 'icici', 'indus', 'kotak', 'mahb', 'pnb', 'sbi',
  'aubank', 'jupiteraxis', 'naviaxis', 'razer', 'timecosmos',
];

const validateUpi = (upiId) => {
  if (!upiId.includes('@')) return 'UPI ID must contain @. Example: name@okaxis';
  const [username, provider] = upiId.split('@');
  if (!username) return 'Username is required before @.';
  if (!/^[a-zA-Z]/.test(username)) return 'UPI ID must start with a letter.';
  if (!/^[a-zA-Z]+$/.test(username)) return 'Username must contain only alphabets (no numbers or symbols).';
  if (username.length < 6) return 'Username must be at least 6 alphabetic characters.';
  if (username.length > 18) return 'Username must be at most 18 characters.';
  if (!provider) return 'Provider is required after @. Example: @okaxis';
  const validProvider = UPI_PROVIDERS.some(p => p === provider.toLowerCase());
  if (!validProvider) return `"${provider}" is not a valid UPI provider. Try: okaxis, ybl, paytm, etc.`;
  return '';
};

/* ─── Module-level style constants ─── */
const INPUT_STYLE = {
  width: '100%',
  border: `1.5px solid ${RZP.border}`,
  borderRadius: '8px',
  padding: '9px 12px',
  fontSize: '13px',
  color: RZP.text,
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};
const INPUT_ERROR_STYLE = {
  ...INPUT_STYLE,
  borderColor: RZP.danger,
};
const LABEL_STYLE = {
  fontSize: '11px', fontWeight: 600, color: RZP.muted,
  marginBottom: '4px', display: 'block', letterSpacing: '0.03em',
};
const BTN_STYLE = {
  width: '100%',
  background: `linear-gradient(135deg, ${RZP.blue}, ${RZP.darkBlue})`,
  color: '#fff', border: 'none', borderRadius: '8px', padding: '12px',
  fontWeight: 700, fontSize: '14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  transition: 'opacity 0.2s', marginTop: '12px',
};
const ERR_STYLE = {
  fontSize: '11px', color: RZP.danger, marginTop: '4px', display: 'flex',
  alignItems: 'center', gap: '4px',
};
const methodBtnStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '10px 14px', cursor: 'pointer',
  background: active ? '#EBF3FF' : 'transparent',
  color: active ? RZP.blue : RZP.text,
  fontWeight: active ? 700 : 500, fontSize: '13px',
  transition: 'all 0.15s', border: 'none', width: '100%', textAlign: 'left',
  borderLeft: `3px solid ${active ? RZP.blue : 'transparent'}`,
});

/* ─── Overlay ─── */
const Overlay = ({ children, onClose: handleClose }) => (
  <div
    style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 99999,
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '20px 16px 20px',
      overflowY: 'auto',
      boxSizing: 'border-box',
    }}
    onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
  >
    {children}
  </div>
);

/* ─── FieldError helper ─── */
const FieldError = ({ msg }) => msg ? (
  <p style={ERR_STYLE}><AlertCircle size={11} />{msg}</p>
) : null;

/**
 * RazorpayModal
 */
const RazorpayModal = ({ totalPrice, merchantName, onSuccess, onClose }) => {
  const [activeMethod, setActiveMethod] = useState('card');
  const [step, setStep] = useState('form');

  // Card fields + errors
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardNameErr, setCardNameErr] = useState('');
  const [expiry, setExpiry] = useState('');
  const [expiryErr, setExpiryErr] = useState('');
  const [cvv, setCvv] = useState('');
  const [cvvErr, setCvvErr] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [cardSubmitAttempted, setCardSubmitAttempted] = useState(false);

  // UPI fields + errors
  const [upiId, setUpiId] = useState('');
  const [upiErr, setUpiErr] = useState('');
  const [upiSubmitAttempted, setUpiSubmitAttempted] = useState(false);

  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef([]);

  // Net Banking — searchable
  const [selectedBank, setSelectedBank] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankErr, setBankErr] = useState('');
  const bankInputRef = useRef(null);

  // Wallet
  const [selectedWallet, setSelectedWallet] = useState('');
  const [processingMsg, setProcessingMsg] = useState('');

  const methods = [
    { id: 'card', label: 'Card', icon: <CreditCard size={16} /> },
    { id: 'upi', label: 'UPI', icon: <QrCode size={16} /> },
    { id: 'netbanking', label: 'Net Banking', icon: <Landmark size={16} /> },
    { id: 'wallet', label: 'Wallets', icon: <Wallet size={16} /> },
  ];

  const ALL_BANKS = [
    { id: 'sbi', label: 'State Bank of India', logo: '🏦' },
    { id: 'hdfc', label: 'HDFC Bank', logo: '🔵' },
    { id: 'icici', label: 'ICICI Bank', logo: '🟠' },
    { id: 'axis', label: 'Axis Bank', logo: '🟣' },
    { id: 'kotak', label: 'Kotak Mahindra Bank', logo: '🔴' },
    { id: 'pnb', label: 'Punjab National Bank', logo: '🟡' },
    { id: 'bob', label: 'Bank of Baroda', logo: '🟤' },
    { id: 'canara', label: 'Canara Bank', logo: '🟢' },
    { id: 'union', label: 'Union Bank of India', logo: '⚫' },
    { id: 'idfc', label: 'IDFC First Bank', logo: '🔶' },
    { id: 'yes', label: 'Yes Bank', logo: '🔷' },
    { id: 'indusind', label: 'IndusInd Bank', logo: '🔸' },
    { id: 'federal', label: 'Federal Bank', logo: '🏛️' },
    { id: 'rbl', label: 'RBL Bank', logo: '🏧' },
    { id: 'indian', label: 'Indian Bank', logo: '🇮🇳' },
    { id: 'central', label: 'Central Bank of India', logo: '🏣' },
  ];

  const filteredBanks = bankSearch.trim()
    ? ALL_BANKS.filter(b => b.label.toLowerCase().includes(bankSearch.toLowerCase()))
    : ALL_BANKS;

  const wallets = [
    { id: 'paytm', label: 'Paytm', color: '#00BAF2' },
    { id: 'phonepe', label: 'PhonePe', color: '#5F259F' },
    { id: 'gpay', label: 'Google Pay', color: '#4285F4' },
    { id: 'mobikwik', label: 'MobiKwik', color: '#1BBBEC' },
  ];

  const handleMethodChange = (id) => {
    setActiveMethod(id);
    setStep('form');
    // reset errors
    setCardNameErr(''); setExpiryErr(''); setCvvErr('');
    setUpiErr(''); setBankErr('');
    setCardSubmitAttempted(false); setUpiSubmitAttempted(false);
  };

  /* OTP handlers */
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

  /* ── Card submit ── */
  const handleCardPay = (e) => {
    e.preventDefault();
    setCardSubmitAttempted(true);
    const nameErr = validateCardName(cardName);
    const expErr = validateExpiry(expiry);
    const cvvE = validateCvv(cvv);
    setCardNameErr(nameErr);
    setExpiryErr(expErr);
    setCvvErr(cvvE);
    if (nameErr || expErr || cvvE || cardNum.replace(/\s/g, '').length < 16) return;
    setStep('otp');
  };

  /* ── OTP submit ── */
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Please enter all 6 digits.'); return; }
    setOtpError('');
    await runProcessing(finalizePayment);
  };

  /* ── UPI submit ── */
  const handleUpiPay = async (e) => {
    e.preventDefault();
    setUpiSubmitAttempted(true);
    const err = validateUpi(upiId);
    setUpiErr(err);
    if (err) return;
    await runProcessing(finalizePayment);
  };

  /* ── Net Banking submit ── */
  const handleNetbankingPay = async (e) => {
    e.preventDefault();
    if (!selectedBank) { setBankErr('Please select a bank to continue.'); return; }
    setBankErr('');
    await runProcessing(finalizePayment);
  };

  /* ── Wallet submit ── */
  const handleWalletPay = async (e) => {
    e.preventDefault();
    if (!selectedWallet) return;
    await runProcessing(finalizePayment);
  };

  /* ── Close bank dropdown on outside click ── */
  useEffect(() => {
    const handleClick = (e) => {
      if (bankInputRef.current && !bankInputRef.current.contains(e.target)) {
        setBankDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Block body scroll on mount ── */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── PROCESSING ── */
  if (step === 'processing') return (
    <Overlay onClose={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '48px 32px', textAlign: 'center', width: '100%', maxWidth: '360px', boxShadow: '0 25px 80px rgba(0,0,0,0.55)' }}>
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
    </Overlay>
  );

  /* ── SUCCESS ── */
  if (step === 'done') return (
    <Overlay onClose={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '48px 32px', textAlign: 'center', width: '100%', maxWidth: '360px', boxShadow: '0 25px 80px rgba(0,0,0,0.55)' }}>
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
    </Overlay>
  );

  /* ── FAILED ── */
  if (step === 'failed') return (
    <Overlay onClose={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '48px 32px', textAlign: 'center', width: '100%', maxWidth: '360px', boxShadow: '0 25px 80px rgba(0,0,0,0.55)' }}>
        <div style={{ width: '72px', height: '72px', margin: '0 auto 20px', borderRadius: '50%', background: '#FEF2F2', border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={36} style={{ color: '#EF4444' }} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: RZP.text, marginBottom: '8px' }}>Payment Failed</h2>
        <p style={{ color: RZP.muted, fontSize: '14px', marginBottom: '28px' }}>Something went wrong. Please try again.</p>
        <button style={{ ...BTN_STYLE, background: '#EF4444', marginTop: 0 }} onClick={() => setStep('form')}>
          <RefreshCw size={16} /> Try Again
        </button>
        <button onClick={onClose} style={{ marginTop: '12px', background: 'none', border: 'none', color: RZP.muted, cursor: 'pointer', fontSize: '13px' }}>
          Cancel
        </button>
      </div>
    </Overlay>
  );

  /* ── OTP ── */
  if (step === 'otp') return (
    <Overlay onClose={onClose}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.55)' }}>
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
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
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
            <button type="submit" style={BTN_STYLE}>
              <Lock size={15} /> Verify &amp; Pay ₹{totalPrice.toFixed(2)}
            </button>
          </form>
          <button onClick={() => setStep('form')} style={{ marginTop: '12px', background: 'none', border: 'none', color: RZP.muted, cursor: 'pointer', fontSize: '12px' }}>
            ← Back to payment
          </button>
        </div>
      </div>
    </Overlay>
  );

  /* ── MAIN MODAL ── */
  const selectedBankObj = ALL_BANKS.find(b => b.id === selectedBank);

  return (
    <Overlay onClose={onClose}>
      <div
        className="rzp-modal-root"
        style={{
          width: '100%',
          maxWidth: '780px',
          display: 'flex',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          animation: 'rzpSlideUp 0.3s ease',
          maxHeight: 'calc(100vh - 44px)',
        }}
      >

        {/* ── SIDEBAR ── */}
        <div
          className="rzp-sidebar"
          style={{
            width: '220px', minWidth: '220px',
            background: RZP.sidebar,
            borderRight: `1px solid ${RZP.border}`,
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div className="rzp-sidebar-header" style={{ padding: '12px 14px', borderBottom: `1px solid ${RZP.border}`, background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: RZP.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={12} color="#fff" />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: '12px', color: RZP.text, lineHeight: 1.2 }}>SportSlot Pay</p>
                <p style={{ fontSize: '10px', color: RZP.muted }}>Secure Checkout</p>
              </div>
            </div>
            <div style={{ background: '#EBF3FF', borderRadius: '8px', padding: '8px 10px' }}>
              <p style={{ fontSize: '10px', color: RZP.muted, marginBottom: '1px' }}>Amount Due</p>
              <p style={{ fontWeight: 800, fontSize: '18px', color: RZP.text, lineHeight: 1.2 }}>₹{totalPrice.toFixed(2)}</p>
              <p style={{ fontSize: '10px', color: RZP.muted, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{merchantName}</p>
            </div>
          </div>

          <div className="rzp-sidebar-methods" style={{ flex: 1, paddingTop: '8px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: RZP.muted, padding: '8px 16px 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Payment Methods
            </p>
            {methods.map(m => (
              <button
                key={m.id}
                className="rzp-method-btn"
                data-active={activeMethod === m.id}
                style={methodBtnStyle(activeMethod === m.id)}
                onClick={() => handleMethodChange(m.id)}
              >
                <span style={{ opacity: activeMethod === m.id ? 1 : 0.6 }}>{m.icon}</span>
                {m.label}
                {activeMethod === m.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </button>
            ))}
          </div>

          <div className="rzp-sidebar-footer" style={{ padding: '10px 14px', borderTop: `1px solid ${RZP.border}`, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={11} style={{ color: RZP.muted }} />
            <span style={{ fontSize: '10px', color: RZP.muted }}>256-bit SSL Encrypted</span>
          </div>
        </div>

        {/* ── CONTENT PANEL ── */}
        <div style={{ flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0 }}>

          <div style={{ padding: '10px 18px', borderBottom: `1px solid ${RZP.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', flexShrink: 0 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '13px', color: RZP.text }}>
                {activeMethod === 'card' && 'Pay with Card'}
                {activeMethod === 'upi' && 'UPI Payment'}
                {activeMethod === 'netbanking' && 'Net Banking'}
                {activeMethod === 'wallet' && 'Wallets'}
              </p>
              <p style={{ fontSize: '10px', color: RZP.muted }}>All transactions are secure and encrypted</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}>
              <X size={16} style={{ color: RZP.muted }} />
            </button>
          </div>

          <div style={{ padding: '14px 18px', flex: 1, overflowY: 'auto' }}>

            {/* ── CARD ── */}
            {activeMethod === 'card' && (
              <form onSubmit={handleCardPay} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} noValidate>

                {/* Card Number */}
                <div>
                  <label style={LABEL_STYLE}>CARD NUMBER</label>
                  <input
                    style={cardNum.replace(/\s/g, '').length > 0 && cardNum.replace(/\s/g, '').length < 16 ? INPUT_ERROR_STYLE : INPUT_STYLE}
                    placeholder="1234 5678 9012 3456" value={cardNum}
                    onChange={e => setCardNum(fmtCard(e.target.value))} required
                    onFocus={e => e.target.style.borderColor = RZP.blue}
                    onBlur={e => e.target.style.borderColor = cardNum.replace(/\s/g, '').length > 0 && cardNum.replace(/\s/g, '').length < 16 ? RZP.danger : RZP.border}
                  />
                  {cardSubmitAttempted && cardNum.replace(/\s/g, '').length < 16 && (
                    <FieldError msg="Please enter a valid 16-digit card number." />
                  )}
                </div>

                {/* Name on Card */}
                <div>
                  <label style={LABEL_STYLE}>NAME ON CARD</label>
                  <input
                    style={cardNameErr ? INPUT_ERROR_STYLE : INPUT_STYLE}
                    placeholder="e.g. Jaydeep Baldaniya" value={cardName}
                    maxLength={22}
                    onChange={e => {
                      const val = e.target.value;
                      setCardName(val);
                      if (cardSubmitAttempted) setCardNameErr(validateCardName(val));
                    }}
                    onBlur={e => setCardNameErr(validateCardName(e.target.value))}
                    onFocus={e => e.target.style.borderColor = RZP.blue}
                    required
                  />
                  <FieldError msg={cardNameErr} />
                  <p style={{ fontSize: '10px', color: RZP.muted, marginTop: '3px' }}>
                    Letters and spaces only · 3–22 characters
                  </p>
                </div>

                {/* Expiry + CVV */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={LABEL_STYLE}>EXPIRY</label>
                    <input
                      style={expiryErr ? INPUT_ERROR_STYLE : INPUT_STYLE}
                      placeholder="MM / YY" value={expiry} maxLength={7}
                      onChange={e => {
                        const val = fmtExpiry(e.target.value);
                        setExpiry(val);
                        if (cardSubmitAttempted) setExpiryErr(validateExpiry(val));
                      }}
                      onBlur={e => setExpiryErr(validateExpiry(e.target.value))}
                      onFocus={e => e.target.style.borderColor = RZP.blue}
                      required
                    />
                    <FieldError msg={expiryErr} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>CVV</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={{ ...(cvvErr ? INPUT_ERROR_STYLE : INPUT_STYLE), paddingRight: '36px' }}
                        type={showCvv ? 'text' : 'password'}
                        placeholder="•••" value={cvv}
                        maxLength={3}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setCvv(val);
                          if (cardSubmitAttempted) setCvvErr(validateCvv(val));
                        }}
                        onBlur={e => setCvvErr(validateCvv(cvv))}
                        onFocus={e => e.target.style.borderColor = RZP.blue}
                        required
                      />
                      <button type="button" onClick={() => setShowCvv(!showCvv)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: RZP.muted }}>
                        {showCvv ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <FieldError msg={cvvErr} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {['VISA', 'MC', 'AMEX', 'RuPay'].map(c => (
                    <div key={c} style={{ padding: '3px 7px', border: `1px solid ${RZP.border}`, borderRadius: '4px', fontSize: '9px', fontWeight: 800, color: RZP.muted, letterSpacing: '0.05em' }}>{c}</div>
                  ))}
                </div>

                <button type="submit" style={BTN_STYLE}>
                  <Lock size={14} /> Pay ₹{totalPrice.toFixed(2)}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '7px 10px' }}>
                  <ShieldCheck size={12} style={{ color: '#10B981', flexShrink: 0 }} />
                  <span style={{ fontSize: '10px', color: '#166534' }}>Your card details are never stored. 3D Secure authentication will be triggered.</span>
                </div>
              </form>
            )}

            {/* ── UPI ── */}
            {activeMethod === 'upi' && (
              <form onSubmit={handleUpiPay} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} noValidate>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: RZP.text, marginBottom: '12px' }}>Pay using any UPI app</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {[
                      { name: 'GPay', bg: '#4285F4', label: 'G' },
                      { name: 'PhonePe', bg: '#5F259F', label: 'Ph' },
                      { name: 'Paytm', bg: '#00BAF2', label: 'P' },
                      { name: 'BHIM', bg: '#008BD0', label: 'B' },
                    ].map(app => (
                      <div key={app.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: app.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', boxShadow: `0 4px 12px ${app.bg}55` }}>{app.label}</div>
                        <span style={{ fontSize: '10px', color: RZP.muted, fontWeight: 600 }}>{app.name}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: RZP.muted }}>BHIM · GPay · PhonePe · Paytm · Any UPI</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: RZP.border }} />
                  <span style={{ fontSize: '12px', color: RZP.muted, fontWeight: 600 }}>Enter UPI ID</span>
                  <div style={{ flex: 1, height: '1px', background: RZP.border }} />
                </div>

                <div>
                  <label style={LABEL_STYLE}>YOUR UPI ID</label>
                  <input
                    style={upiErr ? INPUT_ERROR_STYLE : INPUT_STYLE}
                    placeholder="e.g. jaydeepbaldan@okaxis"
                    value={upiId}
                    onChange={e => {
                      setUpiId(e.target.value);
                      if (upiSubmitAttempted) setUpiErr(validateUpi(e.target.value));
                    }}
                    onBlur={() => { if (upiId) setUpiErr(validateUpi(upiId)); }}
                    onFocus={e => e.target.style.borderColor = RZP.blue}
                    required
                  />
                  <FieldError msg={upiErr} />
                  <p style={{ fontSize: '10px', color: RZP.muted, marginTop: '4px' }}>
                    Format: <strong>name@okaxis</strong> · Must start with letters · No numbers in username
                  </p>
                </div>

                {/* Valid examples */}
                <div style={{ background: '#F8FAFE', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: RZP.muted }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px', color: RZP.text }}>Valid examples:</p>
                  <p style={{ color: '#10B981' }}>✅ name@okaxis</p>
                  <p style={{ color: RZP.danger }}>❌ 123@ybl (numbers not allowed)</p>
                </div>

                <div style={{ background: '#EBF3FF', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: RZP.blue, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={13} /> A payment request will be sent to your UPI app for approval.
                </div>

                <button type="submit" style={{ ...BTN_STYLE, marginTop: 0 }}>
                  <QrCode size={14} /> Pay ₹{totalPrice.toFixed(2)} via UPI
                </button>
              </form>
            )}

            {/* ── NET BANKING ── */}
            {activeMethod === 'netbanking' && (
              <form onSubmit={handleNetbankingPay} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} noValidate>
                <p style={{ fontSize: '13px', color: RZP.text, fontWeight: 600 }}>Search and select your bank</p>

                {/* Searchable bank input */}
                <div ref={bankInputRef} style={{ position: 'relative' }}>
                  <label style={LABEL_STYLE}>BANK NAME</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: RZP.muted, pointerEvents: 'none' }} />
                    <input
                      style={{ ...INPUT_STYLE, paddingLeft: '32px', borderColor: bankErr ? RZP.danger : selectedBank ? RZP.blue : RZP.border }}
                      placeholder="Type to search bank..."
                      value={selectedBank ? (selectedBankObj?.label || bankSearch) : bankSearch}
                      onChange={e => {
                        setBankSearch(e.target.value);
                        setSelectedBank('');
                        setBankErr('');
                        setBankDropdownOpen(true);
                      }}
                      onFocus={() => { setBankDropdownOpen(true); if (selectedBank) setBankSearch(''); setSelectedBank(''); }}
                    />
                    {selectedBank && (
                      <button type="button" onClick={() => { setSelectedBank(''); setBankSearch(''); setBankDropdownOpen(false); }}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: RZP.muted }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {bankDropdownOpen && !selectedBank && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                      background: '#fff', border: `1.5px solid ${RZP.border}`, borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '200px', overflowY: 'auto',
                      marginTop: '4px',
                    }}>
                      {filteredBanks.length === 0 ? (
                        <div style={{ padding: '12px 14px', fontSize: '12px', color: RZP.muted, textAlign: 'center' }}>
                          No bank found. Try a different name.
                        </div>
                      ) : (
                        filteredBanks.map(b => (
                          <button key={b.id} type="button"
                            onClick={() => { setSelectedBank(b.id); setBankSearch(''); setBankDropdownOpen(false); setBankErr(''); }}
                            style={{
                              width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                              fontSize: '12px', color: RZP.text, textAlign: 'left',
                              borderBottom: `1px solid ${RZP.border}`,
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F0F7FF'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ fontSize: '16px' }}>{b.logo}</span>
                            <span style={{ fontWeight: 500 }}>{b.label}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Selected bank confirmation */}
                {selectedBank && selectedBankObj && (
                  <div style={{ background: '#EBF3FF', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{selectedBankObj.logo}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: RZP.blue }}>{selectedBankObj.label}</p>
                      <p style={{ fontSize: '11px', color: RZP.muted }}>You will be redirected for secure payment.</p>
                    </div>
                    <CheckCircle size={16} style={{ color: RZP.blue }} />
                  </div>
                )}

                <FieldError msg={bankErr} />

                <button type="submit"
                  style={{ ...BTN_STYLE, opacity: selectedBank ? 1 : 0.55, cursor: selectedBank ? 'pointer' : 'not-allowed', marginTop: 0 }}>
                  <Landmark size={14} /> Pay ₹{totalPrice.toFixed(2)} via Net Banking
                </button>
              </form>
            )}

            {/* ── WALLETS ── */}
            {activeMethod === 'wallet' && (
              <form onSubmit={handleWalletPay} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '13px', color: RZP.text, fontWeight: 600 }}>Select your wallet</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {wallets.map(w => (
                    <button key={w.id} type="button" onClick={() => setSelectedWallet(w.id)}
                      style={{ padding: '12px 14px', border: `1.5px solid ${selectedWallet === w.id ? w.color : RZP.border}`, borderRadius: '8px', background: selectedWallet === w.id ? `${w.color}15` : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.15s', textAlign: 'left' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: w.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Wallet size={16} color="#fff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: selectedWallet === w.id ? 700 : 500, fontSize: '13px', color: selectedWallet === w.id ? w.color : RZP.text }}>{w.label}</p>
                        <p style={{ fontSize: '11px', color: RZP.muted }}>Pay using {w.label} balance</p>
                      </div>
                      {selectedWallet === w.id && <CheckCircle size={16} style={{ color: w.color }} />}
                    </button>
                  ))}
                </div>
                <button type="submit" disabled={!selectedWallet}
                  style={{ ...BTN_STYLE, opacity: selectedWallet ? 1 : 0.5, cursor: selectedWallet ? 'pointer' : 'not-allowed', marginTop: 0 }}>
                  <Wallet size={14} /> Pay ₹{totalPrice.toFixed(2)}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>

      {/* ── Global Keyframes + Responsive ── */}
      <style>{`
        @keyframes rzpFadeIn   { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rzpSlideUp  { from { opacity: 0; transform: translateY(24px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes rzpSpin     { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes rzpScaleIn  { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes rzpBounce   { 0%, 80%, 100% { transform: scale(0) } 40% { transform: scale(1) } }

        @media (max-width: 600px) {
          .rzp-modal-root   { flex-direction: column !important; max-height: calc(100vh - 24px) !important; }
          .rzp-sidebar      { width: 100% !important; min-width: unset !important; flex-direction: row !important; border-right: none !important; border-bottom: 1px solid #E8EEF8; overflow-x: auto; overflow-y: hidden !important; }
          .rzp-sidebar-header { display: none !important; }
          .rzp-sidebar-methods { display: flex !important; flex-direction: row !important; padding: 0 !important; flex: 1; }
          .rzp-sidebar-methods > p { display: none !important; }
          .rzp-method-btn   { flex-direction: column !important; gap: 3px !important; padding: 8px 12px !important; font-size: 11px !important; border-left: none !important; border-bottom: 3px solid transparent; white-space: nowrap; }
          .rzp-method-btn[data-active="true"] { border-bottom-color: #3395FF !important; border-left: none !important; }
          .rzp-sidebar-footer { display: none !important; }
        }
      `}</style>
    </Overlay>
  );
};

export default RazorpayModal;
