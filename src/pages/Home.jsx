import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Zap, CalendarDays, Undo2,
  MapPin, Star, Users, Trophy, Clock, ChevronDown, ChevronLeft, ChevronRight,
  Twitter, Instagram, Linkedin, Github, Mail, Phone, CheckCircle2
} from 'lucide-react';

const FAQS = [
  { q: 'How do I book a slot?', a: 'Browse facilities, select your ground, pick an available date and time slot, then confirm your booking. You will receive an email confirmation instantly.' },
  { q: 'Can I cancel my booking?', a: 'Yes — you can cancel any upcoming booking from your Profile page. Cancellations are free before the slot start time.' },
  { q: 'What payment methods are supported?', a: 'We currently support all major UPI apps, net banking, debit/credit cards, and wallet payments for hassle-free transactions.' },
  { q: 'How far in advance can I book?', a: 'You can book facilities up to 30 days in advance. Slots open at midnight for new dates.' },
  { q: 'Are there any membership benefits?', a: 'Registered users enjoy priority booking, exclusive discounts on repeat bookings, and early access to new facilities.' },
];

const TESTIMONIALS = [
  { name: 'Arjun Patel', role: 'Cricket Player, Ahmedabad', text: 'SportSlot made booking our weekly cricket practice so seamless. No more calling grounds early morning — just open the app and book in 30 seconds!', initials: 'AP', color: '#22c55e' },
  { name: 'Priya Sharma', role: 'Tennis Coach, Surat', text: 'My students and I use SportSlot every week to reserve courts. The real-time slot availability is incredibly accurate. Zero double-booking issues ever.', initials: 'PS', color: '#3b82f6' },
  { name: 'Rohan Mehta', role: 'Pickleball Enthusiast, Vadodara', text: 'Finally a platform that takes sports booking seriously! Clean UI, instant confirmation emails, and reliable slot management. Highly recommended.', initials: 'RM', color: '#8b5cf6' },
];

const STATS = [
  { value: '50+', label: 'Grounds', icon: <Trophy size={20} style={{ color: '#22c55e' }} /> },
  { value: '5K+', label: 'Players', icon: <Users size={20} style={{ color: '#3b82f6' }} /> },
  { value: '20K+', label: 'Bookings', icon: <CheckCircle2 size={20} style={{ color: '#8b5cf6' }} /> },
  { value: '4.9★', label: 'Rating', icon: <Star size={20} style={{ color: '#f59e0b' }} /> },
];

const FaqItem = ({ q, a, index = 0 }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item reveal-fade-up stagger-${(index % 5) + 1}${open ? ' open' : ''}`}>
      <button className="faq-trigger" onClick={() => setOpen(!open)}>
        <span>{q}</span>
        <ChevronDown size={18} className="faq-icon" />
      </button>
      <div className="faq-body">
        <div className="faq-content">{a}</div>
      </div>
    </div>
  );
};

export const Home = () => {
  const [liveReviews, setLiveReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const reviewsTrackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const checkScrollability = () => {
    if (!reviewsTrackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = reviewsTrackRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  const handleScrollReviews = (direction) => {
    if (!reviewsTrackRef.current) return;
    const container = reviewsTrackRef.current;
    const card = container.querySelector('.review-carousel-card');
    const cardWidth = card ? card.offsetWidth : 280;
    const scrollAmount = cardWidth + 20;

    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(checkScrollability, 350);
  };

  useEffect(() => {
    const fetchRecentReviews = async () => {
      try {
        const res = await fetch(API_BASE_URL + '/api/reviews/recent');
        if (res.ok) {
          const data = await res.json();
          setLiveReviews(data);
        }
      } catch (err) {
        console.error('Fetch recent reviews error:', err);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchRecentReviews();

    // Live update when new feedback is submitted
    const handleNewFeedback = (e) => {
      if (e.detail) {
        setLiveReviews(prev => {
          const exists = prev.some(r => r.id === e.detail.id || (e.detail.booking_id && r.booking_id === e.detail.booking_id));
          if (exists) return prev;
          return [e.detail, ...prev];
        });
      } else {
        fetchRecentReviews();
      }
    };

    window.addEventListener('new-feedback-submitted', handleNewFeedback);
    return () => window.removeEventListener('new-feedback-submitted', handleNewFeedback);
  }, []);

  useEffect(() => {
    checkScrollability();
    const track = reviewsTrackRef.current;
    if (track) {
      track.addEventListener('scroll', checkScrollability, { passive: true });
      window.addEventListener('resize', checkScrollability);
    }
    // Also re-check after brief render delay
    const timer = setTimeout(checkScrollability, 500);
    return () => {
      clearTimeout(timer);
      if (track) track.removeEventListener('scroll', checkScrollability);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [liveReviews]);

  // Scroll Reveal IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal-on-scroll, .reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-scale-up').forEach(el => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08
    });

    const elements = document.querySelectorAll('.reveal-on-scroll, .reveal-fade-up, .reveal-fade-left, .reveal-fade-right, .reveal-scale-up');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, [reviewsLoading, liveReviews]);

  return (
    <>
      <div className="container animate-fade-in" style={{ marginTop: '20px' }}>

        {/* ── HERO ── */}
        <section className="home-hero-section">
          <div className="hero-glow-1" style={{ position: 'absolute', top: '-5%', right: '-5%', width: '340px', height: '340px', borderRadius: '50%', background: 'rgba(34,197,94,0.14)', filter: 'blur(90px)', pointerEvents: 'none' }} />
          <div className="hero-glow-2" style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(59,130,246,0.12)', filter: 'blur(90px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-tag hero-anim-tag" style={{ marginBottom: '24px' }}>
              <Zap size={11} /> Book in under 60 seconds
            </div>
            <h1 className="hero-title hero-anim-title">
              Book Sports Facilities<br />
              Instantly & Hassle-Free
            </h1>
            <p className="hero-anim-desc" style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 36px', lineHeight: '1.7' }}>
              Real-time slot availability for cricket grounds, tennis courts, and pickleball arenas across Gujarat. No calls, no waiting — just book.
            </p>
            <div className="hero-anim-cta" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/facilities" className="btn btn-primary" style={{ padding: '13px 28px', fontSize: '0.9375rem' }}>
                Book a Slot Now <ArrowRight size={17} />
              </Link>
              <a href="#sports-categories" className="btn btn-secondary" style={{ padding: '13px 24px', fontSize: '0.9375rem' }}>
                Explore Sports
              </a>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="stats-row reveal-on-scroll">
          {STATS.map((s, idx) => (
            <div key={s.label} className={`stat-card reveal-fade-up stagger-${idx + 1}`}>
              {s.icon}
              <div style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── SPORTS CATEGORIES ── */}
        <section id="sports-categories" style={{ marginBottom: '80px' }}>
          <div className="section-header reveal-fade-up">
            <div className="section-tag"><Trophy size={11} /> Sports</div>
            <h2 className="section-title">Choose Your Sport</h2>
            <p className="section-subtitle">Find premium venues across Gujarat's top cities.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }} className="reveal-on-scroll">
            {[
              { to: '/facilities?type=cricket', bg: '/main_cricket.jpg', label: 'Cricket', title: 'Cricket Grounds', desc: 'Full-sized outfields, box turfs, floodlights and professional nets.', cta: 'Browse Grounds' },
              { to: '/facilities?type=tennis', bg: '/main_tennis.jpg', label: 'Tennis', title: 'Tennis Courts', desc: 'Indoor clay and outdoor hard courts for practice and competition.', cta: 'Browse Courts' },
              { to: '/facilities?type=pickleball', bg: '/main_pickleball.jpg', label: 'Pickleball', title: 'Pickleball Arenas', desc: 'USAPA-approved dedicated courts for Gujarat\'s fastest-growing sport.', cta: 'Browse Arenas' },
            ].map((sport, idx) => (
              <Link key={sport.to} to={sport.to} className={`sport-link-card reveal-scale-up stagger-${idx + 1}`}
                style={{ backgroundImage: `url("${sport.bg}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="sport-card-overlay" />
                <div style={{ padding: '24px', position: 'relative', zIndex: 2 }}>
                  <div className="badge badge-success" style={{ marginBottom: '12px' }}>{sport.label}</div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>{sport.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '0' }}>{sport.desc}</p>
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                    {sport.cta} <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── WHY CHOOSE SPORTSLOT ── */}
        <section id="features" style={{ marginBottom: '80px' }}>
          <div className="section-header reveal-fade-up">
            <div className="section-tag"><ShieldCheck size={11} /> Why Us</div>
            <h2 className="section-title">Why Choose SportSlot?</h2>
            <p className="section-subtitle">A modern, smooth approach to sports venue reservations.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }} className="reveal-on-scroll">
            {[
              { icon: <CalendarDays size={22} />, iconBg: 'rgba(34,197,94,0.12)', iconColor: 'var(--primary)', title: 'Real-Time Slots', desc: 'Live dynamic timetables updated the moment a booking is confirmed. No stale data.' },
              { icon: <ShieldCheck size={22} />, iconBg: 'rgba(59,130,246,0.12)', iconColor: 'var(--secondary)', title: 'Conflict-Free', desc: 'Atomic transactional checks block double-bookings. Your slot is always guaranteed.' },
              { icon: <Undo2 size={22} />, iconBg: 'rgba(245,158,11,0.12)', iconColor: '#f59e0b', title: 'Easy Cancellations', desc: 'Plans changed? Cancel any upcoming booking from your profile before slot start time.' },
              { icon: <Zap size={22} />, iconBg: 'rgba(34,197,94,0.12)', iconColor: 'var(--primary)', title: 'Instant Confirmation', desc: 'Get a booking confirmation email the moment your reservation goes through.' },
            ].map((f, idx) => (
              <div key={f.title} className={`glass-card reveal-fade-up stagger-${idx + 1}`} style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.7' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIALS & LIVE USER REVIEWS ── */}
        <section style={{ marginBottom: '80px', position: 'relative' }}>
          <div className="reveal-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div className="section-header" style={{ marginBottom: 0, textAlign: 'left' }}>
              <div className="section-tag"><Star size={11} /> Live Reviews</div>
              <h2 className="section-title" style={{ margin: '4px 0 6px' }}>What Players Say</h2>
              <p className="section-subtitle" style={{ margin: 0 }}>Real feedback from athletes after completing their ground reservations.</p>
            </div>

            {/* Header Left/Right Scroll Controls */}
            {Array.isArray(liveReviews) && liveReviews.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleScrollReviews('left')}
                  disabled={!canScrollLeft}
                  className="review-header-nav-btn"
                  aria-label="Previous Review"
                  title="Scroll Left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollReviews('right')}
                  disabled={!canScrollRight}
                  className="review-header-nav-btn"
                  aria-label="Next Review"
                  title="Scroll Right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="reviews-carousel-container reveal-on-scroll">
            {/* Left Floating Arrow Button */}
            {Array.isArray(liveReviews) && liveReviews.length > 4 && (
              <button
                type="button"
                onClick={() => handleScrollReviews('left')}
                disabled={!canScrollLeft}
                className="review-carousel-nav-btn prev"
                aria-label="Scroll Left"
                title="Scroll Left"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* 1-Row Carousel Track */}
            <div
              ref={reviewsTrackRef}
              className="reviews-carousel-track"
              onScroll={checkScrollability}
            >
              {reviewsLoading ? (
                <div style={{ width: '100%', textAlign: 'center', padding: '36px 0' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : Array.isArray(liveReviews) && liveReviews.length > 0 ? (
                liveReviews.map((r, idx) => {
                  if (!r) return null;
                  const userName = r.user_name || 'Verified Athlete';
                  const initials = userName ? userName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'VA';
                  const dateObj = r.created_at ? new Date(r.created_at) : new Date();
                  const formattedDate = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  const ratingNum = parseInt(r.rating, 10) || 5;
                  const sportName = r.sport || r.facility_type || 'Sports';
                  const formattedSport = sportName.charAt(0).toUpperCase() + sportName.slice(1).toLowerCase();

                  return (
                    <div
                      key={r.id || idx}
                      className={`glass-card testimonial-card review-carousel-card reveal-fade-up stagger-${(idx % 4) + 1}`}
                      style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid var(--card-border)',
                        background: 'var(--bg-surface)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={15}
                                fill={i < ratingNum ? "#f59e0b" : "none"}
                                stroke={i < ratingNum ? "none" : "var(--text-muted)"}
                                style={{ filter: i < ratingNum ? 'drop-shadow(0 0 4px rgba(245,158,11,0.4))' : 'none' }}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>{formattedDate}</span>
                        </div>

                        <p style={{ color: 'var(--text-main)', opacity: 0.9, fontSize: '0.92rem', lineHeight: '1.7', margin: '0 0 16px 0', fontStyle: 'italic' }}>
                          "{r.comment || 'Great experience and seamless booking process.'}"
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden', minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            — {userName}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>
                            Sports: {formattedSport}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Facility: {r.facility_name || 'Sports Venue'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ width: '100%', textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  No player reviews yet. Complete a booking to leave the first review!
                </div>
              )}
            </div>

            {/* Right Floating Arrow Button */}
            {Array.isArray(liveReviews) && liveReviews.length > 4 && (
              <button
                type="button"
                onClick={() => handleScrollReviews('right')}
                disabled={!canScrollRight}
                className="review-carousel-nav-btn next"
                aria-label="Scroll Right"
                title="Scroll Right"
              >
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ marginBottom: '80px' }}>
          <div className="section-header reveal-fade-up">
            <div className="section-tag"><Clock size={11} /> FAQ</div>
            <h2 className="section-title">Frequently Asked</h2>
            <p className="section-subtitle">Everything you need to know about booking with SportSlot.</p>
          </div>
          <div className="reveal-on-scroll" style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FAQS.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} index={i} />)}
          </div>
        </section>

        {/* ── ABOUT + CONTACT ── */}
        <section className="reveal-on-scroll" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div className="glass-card reveal-fade-left" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '14px', color: 'var(--text-main)' }}>About Us</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', fontSize: '0.9rem', marginBottom: '14px' }}>
              At SportSlot, we are passionate about making professional sports venues accessible to local communities, clubs, and amateur athletes in Gujarat.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', fontSize: '0.9rem' }}>
              Find, filter, and reserve top-tier grounds in seconds — complete with secure digital bookings and automated slot confirmations across Ahmedabad, Surat, and Vadodara.
            </p>
          </div>

          <div className="glass-card reveal-fade-right" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>Contact Us</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Questions? We're here to help.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: <Mail size={15} />, text: 'support@sportslot.com' },
                { icon: <Phone size={15} />, text: '+91 98765 43210' },
                { icon: <MapPin size={15} />, text: '404, Sports Tower, SG Highway, Ahmedabad' },
              ].map(c => (
                <div key={c.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{c.icon}</span>
                  {c.text}
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); e.target.reset(); }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="text" placeholder="Name" className="form-input" required />
                <input type="email" placeholder="Email" className="form-input" required />
              </div>
              <textarea placeholder="Your message..." className="form-input" required rows={3} style={{ resize: 'none', minHeight: 'auto' }} />
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '11px' }}>
                Send Message <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* ── FOOTER ── */}
      <footer className="site-footer reveal-fade-up">
        <div className="container">
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '14px' }}>
                <div className="navbar-logo-icon"><span style={{ fontSize: '16px' }}>⚡</span></div>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>Sport<span style={{ color: 'var(--primary)' }}>Slot</span></span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.7', maxWidth: '260px', marginBottom: '20px' }}>
                The easiest way to find and book professional sports venues across Gujarat.
              </p>
              <div className="footer-social">
                {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                  <div key={i} className="social-icon"><Icon size={15} /></div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <div className="footer-heading">Platform</div>
              <Link to="/facilities" className="footer-link">Browse Facilities</Link>
              <Link to="/facilities?type=cricket" className="footer-link">Cricket Grounds</Link>
              <Link to="/facilities?type=tennis" className="footer-link">Tennis Courts</Link>
              <Link to="/facilities?type=pickleball" className="footer-link">Pickleball Arenas</Link>
            </div>

            {/* Account */}
            <div>
              <div className="footer-heading">Account</div>
              <Link to="/register" className="footer-link">Sign Up</Link>
              <Link to="/login" className="footer-link">Log In</Link>
              <Link to="/profile" className="footer-link">My Bookings</Link>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} SportSlot. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <span className="footer-link" style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span className="footer-link" style={{ cursor: 'pointer' }}>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
