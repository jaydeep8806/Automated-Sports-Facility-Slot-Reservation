import React, { useState } from 'react';
import { Star, X, CheckCircle2, Sparkles, Send, MessageSquareHeart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RATING_LABELS = {
  1: '1 - Poor',
  2: '2 - Fair',
  3: '3 - Good',
  4: '4 - Very Good',
  5: '5 - Excellent!'
};

export const FeedbackModal = ({
  bookingId,
  facilityId,
  facilityName = 'Sports Facility',
  sport = 'Sports',
  onClose,
  onSuccess
}) => {
  const { token } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const activeRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!bookingId) {
      setErrorMessage('No active booking ID found to review.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingId: parseInt(bookingId, 10),
          rating: rating,
          comment: comment.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit feedback.');
      }

      setSubmitted(true);

      // Dispatch global event for instant live update across app
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('new-feedback-submitted', { detail: data.review }));
      }

      setTimeout(() => {
        if (onSuccess) onSuccess(data.review);
        if (onClose) onClose();
      }, 1400);

    } catch (err) {
      console.error('Feedback submit error:', err);
      setErrorMessage(err.message || 'Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 15, 29, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div className="glass-card animate-scale-up" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '32px 28px',
        position: 'relative',
        border: '1.5px solid var(--primary)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.45)',
        background: 'var(--bg-surface)'
      }}>

        {/* Close button */}
        {!submitted && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {submitted ? (
          /* Success State */
          <div style={{ textAlign: 'center', padding: '24px 0' }} className="animate-scale-up">
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#10b981'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>
              Thank You! 🎉
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Your review has been published and added to <strong>"What Players Say"</strong>.
            </p>
          </div>
        ) : (
          /* Feedback Form */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--primary-glow)',
                border: '1px solid var(--primary)',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--primary)',
                marginBottom: '10px'
              }}>
                <MessageSquareHeart size={14} /> Booking Confirmed & Verified
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
                How was your booking experience?
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Tell us about your experience with <strong>{facilityName}</strong>
              </p>
            </div>

            {/* Star Rating Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transform: (hoverRating === star || rating === star) ? 'scale(1.18)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                      }}
                      aria-label={`${star} Stars`}
                    >
                      <Star
                        size={32}
                        fill={isFilled ? '#f59e0b' : 'none'}
                        stroke={isFilled ? '#f59e0b' : 'var(--text-muted)'}
                        style={{
                          filter: isFilled ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.5))' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f59e0b', minHeight: '20px' }}>
                {RATING_LABELS[activeRating] || 'Select your rating'}
              </span>
            </div>

            {/* Comment Textarea */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Feedback / Comments (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience (e.g. ground condition, smooth booking, lighting, turf quality)..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  resize: 'none',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              />
            </div>

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '16px'
              }}>
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send size={16} /> Submit Feedback
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '6px',
                  textDecoration: 'underline'
                }}
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
