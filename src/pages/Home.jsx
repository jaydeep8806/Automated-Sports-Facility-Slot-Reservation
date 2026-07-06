import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ShieldCheck, Zap, CalendarDays, Undo2,
  MapPin, Star, Users, Trophy, Clock, ChevronDown,
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

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
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
  return (
    <>
      <div className="container animate-fade-in" style={{ marginTop: '20px' }}>

        {/* ── HERO ── */}
        <section className="home-hero-section">
          <div style={{ position: 'absolute', top: '-5%', right: '-5%', width: '340px', height: '340px', borderRadius: '50%', background: 'rgba(34,197,94,0.14)', filter: 'blur(90px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(59,130,246,0.12)', filter: 'blur(90px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="section-tag" style={{ marginBottom: '24px' }}>
              <Zap size={11} /> Book in under 60 seconds
            </div>
            <h1 className="hero-title">
              Book Sports Facilities<br />
              Instantly & Hassle-Free
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 36px', lineHeight: '1.7' }}>
              Real-time slot availability for cricket grounds, tennis courts, and pickleball arenas across Gujarat. No calls, no waiting — just book.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
        <div className="stats-row animate-stagger">
          {STATS.map(s => (
            <div key={s.label} className="stat-card">
              {s.icon}
              <div style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-main)', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── SPORTS CATEGORIES ── */}
        <section id="sports-categories" style={{ marginBottom: '80px' }}>
          <div className="section-header">
            <div className="section-tag"><Trophy size={11} /> Sports</div>
            <h2 className="section-title">Choose Your Sport</h2>
            <p className="section-subtitle">Find premium venues across Gujarat's top cities.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }} className="animate-stagger">
            {[
              { to: '/facilities?type=cricket', bg: '/main_cricket.jpg', label: 'Cricket', title: 'Cricket Grounds', desc: 'Full-sized outfields, box turfs, floodlights and professional nets.', cta: 'Browse Grounds' },
              { to: '/facilities?type=tennis', bg: '/main_tennis.jpg', label: 'Tennis', title: 'Tennis Courts', desc: 'Indoor clay and outdoor hard courts for practice and competition.', cta: 'Browse Courts' },
              { to: '/facilities?type=pickleball', bg: '/main_pickleball.jpg', label: 'Pickleball', title: 'Pickleball Arenas', desc: 'USAPA-approved dedicated courts for Gujarat\'s fastest-growing sport.', cta: 'Browse Arenas' },
            ].map(sport => (
              <Link key={sport.to} to={sport.to} className="sport-link-card"
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
          <div className="section-header">
            <div className="section-tag"><ShieldCheck size={11} /> Why Us</div>
            <h2 className="section-title">Why Choose SportSlot?</h2>
            <p className="section-subtitle">A modern, smooth approach to sports venue reservations.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }} className="animate-stagger">
            {[
              { icon: <CalendarDays size={22} />, iconBg: 'rgba(34,197,94,0.12)', iconColor: 'var(--primary)', title: 'Real-Time Slots', desc: 'Live dynamic timetables updated the moment a booking is confirmed. No stale data.' },
              { icon: <ShieldCheck size={22} />, iconBg: 'rgba(59,130,246,0.12)', iconColor: 'var(--secondary)', title: 'Conflict-Free', desc: 'Atomic transactional checks block double-bookings. Your slot is always guaranteed.' },
              { icon: <Undo2 size={22} />, iconBg: 'rgba(245,158,11,0.12)', iconColor: '#f59e0b', title: 'Easy Cancellations', desc: 'Plans changed? Cancel any upcoming booking from your profile before slot start time.' },
              { icon: <Zap size={22} />, iconBg: 'rgba(34,197,94,0.12)', iconColor: 'var(--primary)', title: 'Instant Confirmation', desc: 'Get a booking confirmation email the moment your reservation goes through.' },
            ].map(f => (
              <div key={f.title} className="glass-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.7' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section style={{ marginBottom: '80px' }}>
          <div className="section-header">
            <div className="section-tag"><Star size={11} /> Testimonials</div>
            <h2 className="section-title">What Players Say</h2>
            <p className="section-subtitle">Thousands of athletes across Gujarat trust SportSlot every week.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }} className="animate-stagger">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="glass-card testimonial-card">
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" stroke="none" />)}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.75', flex: 1 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="testimonial-avatar" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}aa)` }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ marginBottom: '80px' }}>
          <div className="section-header">
            <div className="section-tag"><Clock size={11} /> FAQ</div>
            <h2 className="section-title">Frequently Asked</h2>
            <p className="section-subtitle">Everything you need to know about booking with SportSlot.</p>
          </div>
          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </section>

        {/* ── ABOUT + CONTACT ── */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '14px', color: 'var(--text-main)' }}>About Us</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', fontSize: '0.9rem', marginBottom: '14px' }}>
              At SportSlot, we are passionate about making professional sports venues accessible to local communities, clubs, and amateur athletes in Gujarat.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.75', fontSize: '0.9rem' }}>
              Find, filter, and reserve top-tier grounds in seconds — complete with secure digital bookings and automated slot confirmations across Ahmedabad, Surat, and Vadodara.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
      <footer className="site-footer">
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
