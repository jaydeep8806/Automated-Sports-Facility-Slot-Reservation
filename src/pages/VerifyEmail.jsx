import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, KeyRound, AlertCircle, RefreshCw, Timer, CheckCircle2, ArrowLeft } from 'lucide-react';

export const VerifyEmail = () => {
  const { verifyEmail, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || '';
  const otpParam = queryParams.get('otp') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(otpParam);
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown handler
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle auto-verification if email and OTP are provided via URL link
  useEffect(() => {
    if (emailParam && otpParam) {
      handleVerify(emailParam, otpParam);
    }
  }, [emailParam, otpParam]);

  const handleVerify = async (emailToVerify = email, otpToVerify = otp) => {
    if (!emailToVerify || !otpToVerify) {
      setErrorMsg('Please enter both email and OTP code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await verifyEmail(emailToVerify, otpToVerify);
      setSuccess(true);
      setSuccessMsg('Email verified successfully! Redirecting you to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed. Please check your OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMsg('Please enter your email to request a new OTP.');
      return;
    }

    setResending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await resendOtp(email);
      setSuccessMsg('A fresh verification OTP has been sent to your email.');
      setResendTimer(60); // disable resend for 60 seconds
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '40px 32px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'var(--primary)',
          opacity: 0.1,
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }}></div>

        {/* Title & Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            padding: '14px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '16px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
          }}>
            {success ? <CheckCircle2 size={28} /> : <ShieldCheck size={28} />}
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {success ? 'Account Verified!' : 'Verify Your Email'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            {success 
              ? 'Thank you! Your email is now verified.' 
              : 'Enter the 6-digit verification code sent to your registered Gmail address.'}
          </p>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="badge-danger" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '24px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            background: 'rgba(239, 68, 68, 0.1)'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, color: 'var(--danger)' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="badge-success" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '24px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            background: 'rgba(16, 185, 129, 0.1)'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, color: 'var(--primary)' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Verification Form */}
        {!success && (
          <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group">
              <label className="form-label" htmlFor="verify-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                <input 
                  id="verify-email"
                  type="email" 
                  className="form-input" 
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '48px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="verify-otp">6-Digit OTP Verification Code</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
                <input 
                  id="verify-otp"
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 123456"
                  maxLength="6"
                  pattern="\d{6}"
                  title="OTP must be exactly 6 digits"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ paddingLeft: '48px', letterSpacing: '4px', fontWeight: 'bold' }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '8px', padding: '14px' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Verifying Code...</span>
                </>
              ) : (
                'Verify & Activate'
              )}
            </button>
            
            {/* Resend Action */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '4px' }}>
              {resendTimer > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <Timer size={14} />
                  <span>Resend code in {resendTimer}s</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || !email}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: email ? 'var(--primary)' : 'var(--text-dark)',
                    cursor: email ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <RefreshCw size={14} style={{ animation: resending ? 'spin 1s linear infinite' : 'none' }} />
                  <span>{resending ? 'Resending...' : 'Resend OTP Verification'}</span>
                </button>
              )}
            </div>

          </form>
        )}

        {/* Success state additional helper */}
        {success && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.05)', margin: '20px 0' }}></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Redirecting you automatically, or click below to log in.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', width: '100%', padding: '14px', marginTop: '12px' }}>
              Go to Login
            </Link>
          </div>
        )}

        {/* Back Link */}
        {!success && (
          <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px' }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
