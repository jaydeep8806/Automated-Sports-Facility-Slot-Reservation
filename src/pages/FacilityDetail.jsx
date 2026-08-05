import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Info, CalendarCheck2, ShieldAlert, Sparkles, Check, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Mini Calendar Component ──────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MiniCalendar = ({ value, minDateStr, onChange }) => {
  // Parse value (YYYY-MM-DD)
  const parseDate = (str) => {
    if (!str) return new Date();
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const toStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const selected = parseDate(value);
  const minDate = parseDate(minDateStr);
  // Normalize minDate to midnight for comparison
  minDate.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(selected.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Disable prev button if current view is already at or before minDate's month
  const canGoPrev = viewYear > minDate.getFullYear() || (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth());

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--card-border)',
      borderRadius: '16px',
      overflow: 'hidden',
      userSelect: 'none',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        color: '#fff'
      }}>
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px',
            color: '#fff', cursor: canGoPrev ? 'pointer' : 'not-allowed',
            padding: '6px 8px', display: 'flex', alignItems: 'center',
            opacity: canGoPrev ? 1 : 0.35, transition: 'opacity 0.2s'
          }}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px',
            color: '#fff', cursor: 'pointer', padding: '6px 8px',
            display: 'flex', alignItems: 'center', transition: 'opacity 0.2s'
          }}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '10px 12px 4px',
        gap: '2px'
      }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '0.68rem', fontWeight: 700,
            color: 'var(--text-muted)', textTransform: 'uppercase', padding: '4px 0'
          }}>{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '0 12px 14px', gap: '4px'
      }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const thisDate = new Date(viewYear, viewMonth, day);
          thisDate.setHours(0, 0, 0, 0);
          const disabled = thisDate < minDate;
          const isSelected = toStr(thisDate) === value;
          const isToday = toStr(thisDate) === toStr(today);

          let bg = 'transparent';
          let color = 'var(--text-main)';
          let fontWeight = 500;
          let border = '1px solid transparent';
          let cursor = 'pointer';
          let opacity = 1;

          if (disabled) {
            color = 'var(--text-muted)'; cursor = 'not-allowed'; opacity = 0.35;
          } else if (isSelected) {
            bg = 'var(--primary)'; color = '#fff'; fontWeight = 800; border = '1px solid var(--primary)';
          } else if (isToday) {
            bg = 'var(--primary-glow)'; color = 'var(--primary)'; fontWeight = 700; border = '1px solid var(--primary)';
          }

          return (
            <button
              key={day}
              disabled={disabled}
              onClick={() => { if (!disabled) onChange(toStr(thisDate)); }}
              style={{
                background: bg, color, fontWeight, border, cursor,
                borderRadius: '8px', padding: '8px 0',
                fontSize: '0.82rem', textAlign: 'center',
                opacity: disabled ? 0.35 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { if (!disabled && !isSelected) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { if (!disabled && !isSelected) e.currentTarget.style.background = bg; }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const SPORT_IMAGES = {
  cricket: '/img_cricket.png',
  tennis: '/img_tennis.png',
  pickleball: '/img_pickleball.png',
  default: '/img_cricket.png',
};



const getFacilityImage = (images, type) => {
  const fallback = SPORT_IMAGES[type] || SPORT_IMAGES.default;
  if (!images) return fallback;

  if (typeof images === 'string') {
    if (images.startsWith('{') && images.endsWith('}')) {
      const parsed = images.slice(1, -1).split(',').map(s => s.trim().replace(/^"|"$/g, ''));
      const first = parsed.find(Boolean);
      if (first) return first;
    } else {
      return images.trim() || fallback;
    }
  }

  if (Array.isArray(images)) {
    const first = images.find(img => img && typeof img === 'string' && img.trim() !== '');
    if (first) return first;
  }

  return fallback;
};


export const FacilityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);

  // Server time (IST) for 2-hour booking rule
  const [serverTodayStr, setServerTodayStr] = useState('');

  // Date and Slots states
  const getTodayStr = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);

  // Booking submit states
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 0. Fetch server time on mount to determine today in IST
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/facilities/time`);
        if (res.ok) {
          const data = await res.json();
          setServerTodayStr(data.istDateStr);
          // Set selected date to server's IST today if it differs from local
          setSelectedDate(data.istDateStr);
        }
      } catch {
        // Fallback to local date
        setServerTodayStr(getTodayStr());
      }
    };
    fetchServerTime();
  }, []);

  // 1. Fetch Facility Details
  useEffect(() => {
    const fetchFacilityDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/facilities/${id}`);
        if (response.ok) {
          const data = await response.json();
          setFacility(data);
        } else {
          setErrorMessage('Facility not found.');
        }
      } catch (err) {
        console.error(err);
        setErrorMessage('Server connection error.');
      } finally {
        setLoading(false);
      }
    };
    fetchFacilityDetails();
  }, [id]);

  // 2. Fetch Availability Slots whenever date selection changes
  const fetchAvailability = async () => {
    setSlotsLoading(true);
    setSelectedSlots([]);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/facilities/${id}/slots?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots);
      } else {
        const data = await response.json();
        setErrorMessage(data.message || 'Error loading slot availability.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to connect to slot check API.');
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (facility) {
      fetchAvailability();
    }
  }, [selectedDate, facility]);

  const handleProceedToPayment = () => {
    if (selectedSlots.length === 0) return;
    const totalPrice = selectedSlots.reduce((sum, s) => sum + parseFloat(s.price), 0);
    navigate('/payment', {
      state: {
        facilityId: id,
        facilityName: facility.name,
        facilityLocation: facility.location,
        date: selectedDate,
        selectedSlots: selectedSlots,
        totalPrice: totalPrice
      }
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="container animate-fade-in" style={{ marginTop: '40px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <ShieldAlert size={40} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Facility Not Found</h2>
          <p style={{ color: 'var(--text-muted)' }}>The facility profile you requested is not active or has been removed.</p>
        </div>
      </div>
    );
  }

  const isToday = selectedDate === (serverTodayStr || getTodayStr());
  const hasTooSoonSlots = isToday && slots.some(s => s.isTooSoon && !s.booked);

  return (
    <div className="container animate-fade-in" style={{ marginTop: '20px' }}>

      {/* Banner / Showcase */}
      <section className="glass-card" style={{ overflow: 'hidden', padding: 0, border: '1px solid var(--card-border)', marginBottom: '32px' }}>
        <div style={{ position: 'relative', height: '320px' }}>
          <img
            src={getFacilityImage(facility.images, facility.type)}
            alt={facility.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = SPORT_IMAGES[facility.type] || SPORT_IMAGES.default;
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(9, 13, 22, 0.95) 30%, rgba(9, 13, 22, 0))',
            padding: '36px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '10px' }}>
                {facility.type === 'cricket' ? 'Cricket Ground' : facility.type === 'tennis' ? 'Tennis Court' : 'Pickleball Arena'}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{facility.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
                <MapPin size={16} style={{ color: 'var(--primary)' }} />
                <span>{facility.location}</span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>₹{facility.price_per_hour}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}> / hour</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Layout Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="detail-page-rows">

        {/* ── FIRST ROW: Venue Profile (Left) | Venue Perks & Info (Right) (COMPACT & SMALL) ── */}
        <div className="row-grid-equal">
          {/* Left: Venue Profile Card (Compact & Small) */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={16} style={{ color: 'var(--primary)' }} />
                Venue Profile
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.4', margin: 0 }}>
                {facility.description}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>Key Amenities Available</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {facility.amenities && facility.amenities.map((amenity, idx) => (
                  <div key={idx} className="amenity-tag" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Venue Perks & Information Card (Only Instant Booking & Live Slots) */}
          <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', margin: 0 }}>
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              Venue Perks & Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ background: 'var(--primary-glow)', border: '1px solid var(--primary)', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', color: 'var(--primary)', fontSize: '0.8rem', lineHeight: 1.2 }}>Instant Booking</strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>100% Confirmed</span>
                </div>
              </div>

              <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
                <div>
                  <strong style={{ display: 'block', color: '#3b82f6', fontSize: '0.8rem', lineHeight: 1.2 }}>Live Slots</strong>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Real-time sync</span>
                </div>
              </div>
            </div>

            {/* Bottom Support Banner */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <span>Need help with slot booking or events?</span>
              <strong style={{ color: 'var(--primary)', flexShrink: 0 }}>24/7 Support</strong>
            </div>
          </div>
        </div>

        {/* ── SECOND ROW: Reservation Timing (Left) | Calendar + Booking Details (Right) ── */}
        <div className="row-grid-align-top">
          {/* Left: Choose Reservation Timing Card (PROMINENT & SPACIOUS) */}
          <div className="glass-card" style={{ padding: '36px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalendarCheck2 size={22} style={{ color: 'var(--primary)' }} />
              Choose Reservation Timing
            </h2>

            {/* 2-Hour Advance Notice Banner (Today only) */}
            {isToday && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.35)',
                borderRadius: '12px',
                padding: '14px 18px',
                marginBottom: '24px',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
              }}>
                <Clock size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#f59e0b', fontSize: '0.92rem' }}>2-Hour Advance Booking Rule</strong>
                  <p style={{ color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                    Bookings must be made at least <strong>2 hours before</strong> the slot starts. Slots within the next 2 hours are unavailable.
                  </p>
                </div>
              </div>
            )}

            {/* Slots Grid */}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '18px' }}>Available Time Slots</h3>

            {slotsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '36px 0' }}>
                <div className="spinner" />
              </div>
            ) : slots.length === 0 ? (
              <p style={{ color: 'var(--text-dark)' }}>No operational hours configured for this venue.</p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '14px'
              }}>
                {slots.map((slot, index) => {
                  const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);

                  let cursor = 'pointer';
                  let border = '1px solid var(--border)';
                  let background = 'var(--bg-surface)';
                  let opacity = 1;
                  let textColor = 'var(--text-main)';
                  let statusLabel = null;
                  let statusColor = 'var(--primary)';
                  let tooltipText = '';

                  if (slot.booked) {
                    cursor = 'not-allowed';
                    background = 'var(--danger-glow)';
                    border = '1px solid rgba(239, 68, 68, 0.2)';
                    textColor = 'var(--text-muted)';
                    statusLabel = 'Booked';
                    statusColor = 'var(--danger)';
                  } else if (slot.isPast) {
                    cursor = 'not-allowed';
                    background = 'var(--bg-surface)';
                    border = '1px solid var(--border)';
                    textColor = 'var(--text-muted)';
                    opacity = 0.45;
                    statusLabel = 'Passed';
                    statusColor = 'var(--text-dark)';
                  } else if (slot.isTooSoon) {
                    cursor = 'not-allowed';
                    background = 'rgba(245,158,11,0.08)';
                    border = '1px solid rgba(245,158,11,0.35)';
                    textColor = 'var(--text-muted)';
                    opacity = 0.75;
                    statusLabel = 'Too Soon';
                    statusColor = '#f59e0b';
                    tooltipText = 'Bookings must be made at least 2 hours in advance.';
                  } else if (isSelected) {
                    background = 'var(--primary-glow)';
                    border = '2px solid var(--primary)';
                    textColor = 'var(--primary)';
                    statusLabel = 'Selected';
                    statusColor = 'var(--primary)';
                  } else {
                    statusLabel = 'Available';
                    statusColor = 'var(--primary)';
                  }

                  return (
                    <div key={index} style={{ position: 'relative' }} className="slot-wrapper">
                      <button
                        className={`time-slot-btn ${isSelected ? 'selected' : ''}`}
                        disabled={slot.booked || slot.isPast || slot.isTooSoon}
                        onClick={() => {
                          if (selectedSlots.some(s => s.startTime === slot.startTime)) {
                            setSelectedSlots(selectedSlots.filter(s => s.startTime !== slot.startTime));
                          } else {
                            setSelectedSlots([...selectedSlots, slot]);
                          }
                        }}
                        title={tooltipText}
                        style={{
                          width: '100%',
                          padding: '18px 10px',
                          borderRadius: 'var(--radius-md)',
                          border,
                          background,
                          cursor,
                          opacity,
                          color: textColor,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <span style={{ fontSize: '1rem', fontWeight: 800 }}>{slot.startTime}</span>
                        <span style={{ fontSize: '0.78rem', opacity: 0.65 }}>to {slot.endTime}</span>
                        {statusLabel && (
                          <span style={{ fontSize: '0.65rem', color: statusColor, fontWeight: 700, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {statusLabel}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            {slots.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '24px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--primary-glow)', border: '1.5px solid var(--primary)', display: 'inline-block' }} /> Available
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.5)', display: 'inline-block' }} /> Too Soon (2hr rule)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--danger-glow)', border: '1.5px solid rgba(239,68,68,0.3)', display: 'inline-block' }} /> Booked
                </span>
              </div>
            )}
          </div>

          {/* Right Column Stack: Calendar + Booking Details below (COMPACT STACK) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Calendar Card (Compact Padding) */}
            <div className="glass-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Select Date
                </span>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'var(--primary-glow)', border: '1.5px solid var(--primary)',
                  borderRadius: '999px', padding: '4px 12px',
                  fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)'
                }}>
                  <CalendarCheck2 size={13} />
                  {selectedDate
                    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                    : 'No date selected'
                  }
                </div>
              </div>
              <MiniCalendar
                value={selectedDate}
                minDateStr={serverTodayStr || getTodayStr()}
                onChange={(dateStr) => setSelectedDate(dateStr)}
              />
            </div>

            {/* Booking Details Card (Extended Height to Match Left Card Bottom Exactly) */}
            <div className="glass-card" style={{
              padding: '28px 24px',
              border: '1px solid var(--card-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Sparkles size={18} style={{ color: 'var(--primary)' }} />
                Booking Details
              </h2>

              {selectedSlots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Selected Date:</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{selectedDate}</span>
                  </div>

                  <div className="slots-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '133px', overflowY: 'auto', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Selected Slots ({selectedSlots.length}):</span>
                    {selectedSlots.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingLeft: '6px' }}>
                        <span>• {s.startTime} – {s.endTime}</span>
                        <span style={{ fontWeight: 600 }}>₹{parseFloat(s.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Duration:</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {selectedSlots.length * (facility.slot_duration / 60)} {selectedSlots.length * (facility.slot_duration / 60) === 1 ? 'hour' : 'hours'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hourly Rate:</span>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>₹{parseFloat(facility.price_per_hour).toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '10px', marginTop: '2px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total Amount:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{selectedSlots.reduce((sum, s) => sum + parseFloat(s.price), 0).toFixed(2)}
                    </span>
                  </div>

                  {errorMessage && (
                    <div className="badge-danger" style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                      <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="badge-success" style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem' }}>
                      <Check size={16} style={{ flexShrink: 0 }} />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <button
                    onClick={handleProceedToPayment}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '13px', fontSize: '0.92rem' }}
                  >
                    Book Now (Proceed to Payment)
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <p>Please select a date and one or more available time slots from the schedule list to view booking checkout details.</p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        /* ── Thin Custom Scrollbar for Selected Slots List ── */
        .slots-scroll-container::-webkit-scrollbar {
          width: 4px;
        }
        .slots-scroll-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .slots-scroll-container::-webkit-scrollbar-thumb {
          background: var(--primary);
          border-radius: 4px;
        }

        /* ── Desktop Row Grids ── */
        @media (min-width: 992px) {
          .row-grid-equal {
            display: grid;
            grid-template-columns: 1.8fr 1fr;
            gap: 32px;
            align-items: stretch;
          }
          .row-grid-align-top {
            display: grid;
            grid-template-columns: 1.8fr 1fr;
            gap: 32px;
            align-items: start;
          }
        }

        /* ── Mobile / Tablet Layout (≤991px) ── */
        @media (max-width: 991px) {
          .row-grid-equal, .row-grid-align-top {
            display: flex;
            flex-direction: column;
            gap: 24px;
          }
        }

        @media (max-width: 480px) {
          .detail-page-rows { gap: 20px !important; }
          .glass-card { padding: 20px !important; }
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
};
