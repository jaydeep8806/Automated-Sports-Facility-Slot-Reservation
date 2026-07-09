import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Phone, AlertCircle } from 'lucide-react';

// Defined outside Register so React never re-creates this component type
// on re-renders, which would cause input fields to unmount/remount and lose focus.
const InputRow = ({ id, label, type = 'text', icon: Icon, placeholder, value, onChange, errorMsg }) => (
  <div className="form-group" style={{ marginBottom: 0 }}>
    <label className="form-label" htmlFor={id}>{label}</label>
    <div style={{ position: 'relative' }}>
      <Icon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      <input id={id} type={type} className="form-input" placeholder={placeholder} value={value} onChange={onChange} style={{ paddingLeft: '42px', borderColor: errorMsg ? 'var(--danger)' : undefined }} required />
    </div>
    {errorMsg && (
      <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <AlertCircle size={12} /> {errorMsg}
      </p>
    )}
  </div>
);

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Inline field errors
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Phone: allow only digits, max 10
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digits);
    if (digits.length > 0 && digits.length < 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  // Password: min 6, max 12
  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (val.length > 0 && val.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
    } else if (val.length > 12) {
      setPasswordError('Password must be at most 12 characters.');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (val && val !== password) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      setError('Please fix the errors above.');
      return;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      setError('Please fix the errors above.');
      return;
    }
    if (password.length > 12) {
      setPasswordError('Password must be at most 12 characters.');
      setError('Please fix the errors above.');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      setError('Please fix the errors above.');
      return;
    }

    setFormLoading(true);
    try {
      await register(name, email, password, phone);
      alert('Account created! Check your email for the verification OTP.');
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 140px)', padding: '32px 24px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '40px 36px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            width: '52px', height: '52px', borderRadius: '14px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', marginBottom: '16px', boxShadow: '0 4px 14px var(--primary-glow)'
          }}>
            <UserPlus size={24} />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text-main)', marginBottom: '6px' }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Join SportSlot to reserve grounds instantly.</p>
        </div>

        {/* Global Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <InputRow id="name" label="Full Name" icon={User} placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
          <InputRow id="email" label="Email Address" type="email" icon={Mail} placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

          {/* Phone — custom with numeric-only + 10-digit validation */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                className="form-input"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={handlePhoneChange}
                style={{ paddingLeft: '42px', borderColor: phoneError ? 'var(--danger)' : undefined }}
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

          {/* Password — min 6, max 12 */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="password">Password (6–12 characters)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                style={{ paddingLeft: '42px', borderColor: passwordError ? 'var(--danger)' : undefined }}
                required
              />
            </div>
            {passwordError ? (
              <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> {passwordError}
              </p>
            ) : password.length >= 6 && password.length <= 12 ? (
              <p style={{ color: '#10b981', fontSize: '0.78rem', marginTop: '4px' }}>✓ Valid password length</p>
            ) : null}
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                style={{ paddingLeft: '42px', borderColor: confirmPasswordError ? 'var(--danger)' : undefined }}
                required
              />
            </div>
            {confirmPasswordError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> {confirmPasswordError}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px', padding: '13px' }} disabled={formLoading}>
            {formLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
