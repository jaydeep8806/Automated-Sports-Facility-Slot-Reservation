import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, ShieldCheck, Zap, CalendarDays, Undo2 } from 'lucide-react';

const getFacilityImage = (images) => {
  const defaultImage = 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?q=80&w=800&auto=format&fit=crop';
  if (!images) return defaultImage;
  
  if (typeof images === 'string') {
    if (images.startsWith('{') && images.endsWith('}')) {
      const parsed = images.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      const first = parsed.find(Boolean);
      if (first) return first;
    } else {
      return images.trim() || defaultImage;
    }
  }
  
  if (Array.isArray(images)) {
    const first = images.find(img => img && typeof img === 'string' && img.trim() !== '');
    if (first) return first;
  }
  
  return defaultImage;
};


export const Home = () => {
  return (
    <div className="container animate-fade-in" style={{ marginTop: '20px', paddingBottom: '60px' }}>
      
      {/* Hero Section */}
      <section className="glass-card" style={{
        padding: '60px 40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(99, 102, 241, 0.05))',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '50px'
      }}>
        {/* Background glow effects */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }} />

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          lineHeight: '1.15',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #ffffff 40%, var(--primary), var(--secondary))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Book Sports Facilities <br />
          <span style={{ color: 'var(--primary)' }}>Instantly & Hassle-Free</span>
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          margin: '0 auto 40px',
          lineHeight: '1.6'
        }}>
          Check available real-time time slots, book professional cricket grounds, tennis courts, and pickleball arenas in Gujarat cities instantly.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to="/facilities" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            Book a Slot Now
            <ArrowRight size={18} />
          </Link>
          <a href="#sports-categories" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            Explore Sports
          </a>
        </div>
      </section>

      {/* Sports Categories Section */}
      <section id="sports-categories" style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Sports Categories</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Choose your sport to find premium available stadiums and courts.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          
          {/* Cricket Card */}
          <Link to="/facilities?type=cricket" className="glass-card sport-link-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-end',
            overflow: 'hidden', 
            textDecoration: 'none', 
            color: '#fff',
            height: '340px',
            position: 'relative',
            backgroundImage: 'linear-gradient(to top, rgba(9, 13, 22, 0.95) 45%, rgba(9, 13, 22, 0.2)), url("/main_cricket.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'all 0.3s ease',
            border: '1px solid var(--card-border)'
          }}>
            <div style={{ padding: '24px', zIndex: 2 }}>
              <div className="badge badge-success" style={{ display: 'inline-block', marginBottom: '12px' }}>Cricket</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Cricket Grounds</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0' }}>
                Book full-sized outfields or box cricket turfs with premium floodlights and nets.
              </p>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                Browse Grounds <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* Tennis Card */}
          <Link to="/facilities?type=tennis" className="glass-card sport-link-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-end',
            overflow: 'hidden', 
            textDecoration: 'none', 
            color: '#fff',
            height: '340px',
            position: 'relative',
            backgroundImage: 'linear-gradient(to top, rgba(9, 13, 22, 0.95) 45%, rgba(9, 13, 22, 0.2)), url("/main_tennis.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'all 0.3s ease',
            border: '1px solid var(--card-border)'
          }}>
            <div style={{ padding: '24px', zIndex: 2 }}>
              <div className="badge badge-success" style={{ display: 'inline-block', marginBottom: '12px' }}>Tennis</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Tennis Courts</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0' }}>
                Reserve indoor clay or outdoor synthetic hard courts for training and games.
              </p>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                Browse Courts <ArrowRight size={14} />
              </div>
            </div>
          </Link>

          {/* Pickleball Card */}
          <Link to="/facilities?type=pickleball" className="glass-card sport-link-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-end',
            overflow: 'hidden', 
            textDecoration: 'none', 
            color: '#fff',
            height: '340px',
            position: 'relative',
            backgroundImage: 'linear-gradient(to top, rgba(9, 13, 22, 0.95) 45%, rgba(9, 13, 22, 0.2)), url("/main_pickleball.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'all 0.3s ease',
            border: '1px solid var(--card-border)'
          }}>
            <div style={{ padding: '24px', zIndex: 2 }}>
              <div className="badge badge-success" style={{ display: 'inline-block', marginBottom: '12px' }}>Pickleball</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>Pickleball Arenas</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0' }}>
                Play Gujarat's fastest-growing sport on USAPA-approved dedicated courts.
              </p>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                Browse Arenas <ArrowRight size={14} />
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '12px' }}>Why Choose SportSlot?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Experience a smooth, modern approach to venue reservations.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px'
        }}>
          <div className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
              <CalendarDays size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Real-Time Slots</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              View live, dynamic timetables. Choose exact hourly slots that fit your group schedule perfectly.
            </p>
          </div>
          <div className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: 'var(--secondary)', background: 'rgba(99, 102, 241, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Conflict-Free</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              No overlapping slots. Our atomic transactional check blocks double bookings instantaneously.
            </p>
          </div>
          <div className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
              <Undo2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Flexible Cancellations</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Plans changed? Cancel your booking easily from your profile page before the slot start time.
            </p>
          </div>
          <div className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Instant Processing</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Secure reservations with direct digital confirmation. No more phone tag or manual diaries.
            </p>
          </div>
        </div>
      </section>

      {/* About Us & Contact Us Sections */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginTop: '40px' }}>
        
        {/* About Us */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '16px', background: 'linear-gradient(to right, #fff, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            About Us
          </h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '16px' }}>
            At SportSlot, we are passionate about making professional sports venues accessible to local communities, clubs, and amateur athletes in Gujarat.
          </p>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
            Our platform allows users to find, filter, and reserve top-tier cricket, tennis, and pickleball grounds in seconds, complete with secure digital payments and automated slot confirmations. We are dedicated to building a healthier, more active lifestyle across cities like Ahmedabad, Surat, and Vadodara.
          </p>
        </div>

        {/* Contact Us */}
        <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', background: 'linear-gradient(to right, #fff, var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Contact Us
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Have questions? Send us a message or reach out directly.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            <div>📧 <strong>Email:</strong> support@sportslot.com</div>
            <div>📞 <strong>Phone:</strong> +91 98765 43210</div>
            <div>📍 <strong>Address:</strong> 404, Sports Tower, SG Highway, Ahmedabad, Gujarat, India</div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully! We will get back to you soon.'); e.target.reset(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input type="text" placeholder="Name" className="form-input" required style={{ padding: '10px' }} />
              <input type="email" placeholder="Email" className="form-input" required style={{ padding: '10px' }} />
            </div>
            <textarea placeholder="Your message..." className="form-input" required rows="3" style={{ padding: '10px', resize: 'none' }}></textarea>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 18px', width: '100%', fontSize: '0.85rem' }}>
              Send Message
            </button>
          </form>
        </div>

      </section>

    </div>
  );
};
