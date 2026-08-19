import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Info, CalendarCheck2, ShieldAlert, Sparkles, Check, Clock, ChevronLeft, ChevronRight, Star } from 'lucide-react';

// Helper: Convert time string "HH:MM:SS" or "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
};

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
      borderRadius: '12px',
      overflow: 'hidden',
      userSelect: 'none',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 12px',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        color: '#fff'
      }}>
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px',
            color: '#fff', cursor: canGoPrev ? 'pointer' : 'not-allowed',
            padding: '4px 6px', display: 'flex', alignItems: 'center',
            opacity: canGoPrev ? 1 : 0.35, transition: 'opacity 0.2s'
          }}
          aria-label="Previous month"
        >
          <ChevronLeft size={15} />
        </button>
        <span style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '-0.01em' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px',
            color: '#fff', cursor: 'pointer', padding: '4px 6px',
            display: 'flex', alignItems: 'center', transition: 'opacity 0.2s'
          }}
          aria-label="Next month"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day labels */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '6px 10px 2px',
        gap: '2px'
      }}>
        {DAYS.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '0.65rem', fontWeight: 700,
            color: 'var(--text-muted)', textTransform: 'uppercase', padding: '2px 0'
          }}>{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        padding: '0 10px 8px', gap: '3px'
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
                borderRadius: '6px', padding: '5px 0',
                fontSize: '0.8rem', textAlign: 'center',
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  // Extend booking mode parameters
  const extendBookingId = searchParams.get('extendBookingId') || location.state?.extendBookingId;
  const [activeBookingInfo, setActiveBookingInfo] = useState(location.state?.originalBooking || null);
  const [isExtendMode, setIsExtendMode] = useState(!!extendBookingId);

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

  // Facility Rating & Reviews states
  const [facilityRating, setFacilityRating] = useState({ avg: 0, count: 0 });
  const [facilityReviews, setFacilityReviews] = useState([]);

  useEffect(() => {
    const fetchFacilityReviews = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews/facility/${id}`);
        if (res.ok) {
          const data = await res.json();
          setFacilityReviews(data);
          if (data.length > 0) {
            const sum = data.reduce((acc, r) => acc + r.rating, 0);
            setFacilityRating({ avg: sum / data.length, count: data.length });
          }
        }
      } catch (err) {
        console.error('Fetch facility reviews error:', err);
      }
    };
    if (id) fetchFacilityReviews();
  }, [id]);

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
      const url = `${API_BASE_URL}/api/facilities/${id}/slots?date=${selectedDate}${extendBookingId ? `&extendBookingId=${extendBookingId}` : ''}`;
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setSlots(data.slots || []);
        if (data.isExtensionMode && data.activeBooking) {
          setIsExtendMode(true);
          setActiveBookingInfo(prev => prev || data.activeBooking);
        }
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
  }, [selectedDate, facility, extendBookingId]);

  // Slot click handler with support for Extend Mode consecutive selection
  const handleSlotClick = (slot) => {
    if (slot.booked || slot.isPast || slot.isTooSoon) return;

    if (!isExtendMode || !activeBookingInfo) {
      // Normal booking flow
      if (selectedSlots.some(s => s.startTime === slot.startTime)) {
        setSelectedSlots(selectedSlots.filter(s => s.startTime !== slot.startTime));
      } else {
        const newSlots = [...selectedSlots, slot].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        setSelectedSlots(newSlots);
      }
      return;
    }

    // Extend Mode Flow
    const currentBookingEnd = (activeBookingInfo.endTime || activeBookingInfo.end_time || '').slice(0, 5);
    const currentBookingDate = activeBookingInfo.date || (activeBookingInfo.dateStr) || serverTodayStr || getTodayStr();
    const rawEnd = timeToMinutes(currentBookingEnd);
    const currentBookingEndMin = (rawEnd === 0 && (currentBookingEnd.startsWith('00') || currentBookingEnd.startsWith('24'))) || rawEnd === 1440 || rawEnd === 1439 ? 1440 : rawEnd;

    const isNextDayExtension = selectedDate > currentBookingDate;

    // Minimum start time required on the selected date:
    // If next day extension (over midnight): starts from 00:00 (0 minutes)
    // If same day extension: starts from currentBookingEndMin (e.g. 19:00 -> 1140 min)
    const minAllowedStartMin = isNextDayExtension ? 0 : currentBookingEndMin;
    const slotStartMin = timeToMinutes(slot.startTime);

    if (!isNextDayExtension && slotStartMin < minAllowedStartMin) {
      setErrorMessage(`Extension slots must start at or after your current session end time (${currentBookingEnd}).`);
      return;
    }

    // Available slots on selectedDate after minAllowedStartMin
    const availableSlotsSorted = slots
      .filter(s => !s.booked && !s.isPast && !s.isTooSoon && timeToMinutes(s.startTime) >= minAllowedStartMin)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    const isAlreadySelected = selectedSlots.some(s => s.startTime === slot.startTime);

    if (isAlreadySelected) {
      // Unselect this slot and any slots that were selected after it
      const remaining = selectedSlots.filter(s => timeToMinutes(s.startTime) < timeToMinutes(slot.startTime));
      setSelectedSlots(remaining);
      setErrorMessage('');
    } else {
      // Connect consecutive slots up to clicked slot
      const targetIndex = availableSlotsSorted.findIndex(s => s.startTime === slot.startTime);
      if (targetIndex === -1) return;

      let isContiguous = true;
      const toSelect = [];
      let expectedStart = minAllowedStartMin;

      for (let i = 0; i <= targetIndex; i++) {
        const s = availableSlotsSorted[i];
        if (timeToMinutes(s.startTime) !== expectedStart) {
          isContiguous = false;
          break;
        }
        toSelect.push(s);
        expectedStart = timeToMinutes(s.endTime);
      }

      if (!isContiguous) {
        setErrorMessage(`Cannot select slot (${slot.startTime} - ${slot.endTime}) because intermediate slots are booked or unavailable. Extended slots must connect consecutively to your current match session.`);
        return;
      }

      setErrorMessage('');
      setSelectedSlots(toSelect);
    }
  };

  const handleProceedToPayment = () => {
    if (selectedSlots.length === 0) return;
    const totalPrice = selectedSlots.reduce((sum, s) => sum + parseFloat(s.price), 0);
    navigate('/payment', {
      state: {
        isExtension: isExtendMode,
        extendBookingId: extendBookingId,
        facilityId: id,
        facilityName: facility.name,
        facilityLocation: facility.location,
        date: selectedDate,
        originalStartTime: activeBookingInfo ? (activeBookingInfo.startTime || activeBookingInfo.start_time || '').slice(0, 5) : null,
        originalEndTime: activeBookingInfo ? (activeBookingInfo.endTime || activeBookingInfo.end_time || '').slice(0, 5) : null,
        originalTotalPrice: activeBookingInfo ? parseFloat(activeBookingInfo.totalPrice || activeBookingInfo.total_price || 0) : 0,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)' }} />
                  <span>{facility.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.15)', padding: '3px 10px', borderRadius: '999px', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Star size={14} fill="#f59e0b" stroke="none" />
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f59e0b' }}>
                    {facilityRating.count > 0 ? facilityRating.avg.toFixed(1) : '4.8'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    ({facilityRating.count > 0 ? `${facilityRating.count} reviews` : 'Based on player reviews'})
                  </span>
                </div>
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
          {/* Left: Choose Reservation Timing Card */}
          <div className="glass-card" style={{ padding: '32px', border: isExtendMode ? '1.5px solid var(--primary)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CalendarCheck2 size={22} style={{ color: 'var(--primary)' }} />
                {isExtendMode ? 'Extend Reservation Timing' : 'Choose Reservation Timing'}
              </h2>
              {isExtendMode && (
                <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 800 }}>
                  ↗ Extend Booking Flow
                </span>
              )}
            </div>

            {/* Extend Notice Banner OR 2-Hour Advance Notice Banner */}
            {isExtendMode && activeBookingInfo ? (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12))',
                border: '1.5px solid var(--primary)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                fontSize: '0.88rem',
                color: 'var(--text-main)',
              }}>
                <Sparkles size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '0.98rem' }}>
                      ⚡ Extending Active Session (2-Hour Buffer Waived)
                    </strong>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontWeight: 700 }}>
                      ✓ Active Player
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
                    Your current match is reserved for <strong>{(activeBookingInfo.startTime || activeBookingInfo.start_time || '').slice(0, 5)} – {(activeBookingInfo.endTime || activeBookingInfo.end_time || '').slice(0, 5)}</strong>.
                    As an active player on the court, the 2-hour advance buffer is waived. You can select one or multiple consecutive available slots starting from <strong>{(activeBookingInfo.endTime || activeBookingInfo.end_time || '').slice(0, 5)}</strong>.
                  </p>
                </div>
              </div>
            ) : isToday && (
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
                gap: '12px'
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
                    statusLabel = isExtendMode ? 'Extended' : 'Selected';
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
                        onClick={() => handleSlotClick(slot)}
                        title={tooltipText}
                        style={{
                          width: '100%',
                          padding: '16px 8px',
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
                        <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{slot.startTime}</span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>to {slot.endTime}</span>
                        {statusLabel && (
                          <span style={{ fontSize: '0.65rem', color: statusColor, fontWeight: 600, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--primary-glow)', border: '1.5px solid var(--primary)', display: 'inline-block' }} /> Available
                </span>
                {!isExtendMode && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.5)', display: 'inline-block' }} /> Too Soon (2hr rule)
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--danger-glow)', border: '1.5px solid rgba(239,68,68,0.3)', display: 'inline-block' }} /> Booked
                </span>
              </div>
            )}
          </div>

          {/* Right Column Stack: Calendar + Booking Details below (COMPACT STACK) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Calendar Card (Slightly Reduced Padding for Perfect Alignment) */}
            <div className="glass-card" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  Select Date
                </span>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  background: 'var(--primary-glow)', border: '1.5px solid var(--primary)',
                  borderRadius: '999px', padding: '3px 10px',
                  fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)'
                }}>
                  <CalendarCheck2 size={12} />
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

            {/* Booking Details Card (Strictly Contained within Left Section Height) */}
            <div className="glass-card" style={{
              padding: '20px 22px',
              border: isExtendMode ? '1.5px solid var(--primary)' : '1px solid var(--card-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Sparkles size={17} style={{ color: 'var(--primary)' }} />
                {isExtendMode ? 'Extension Summary' : 'Booking Details'}
              </h2>

              {/* Active Session Info (Extend mode only) */}
              {isExtendMode && activeBookingInfo && (
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Current Match Session (Already Paid):</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                    {(activeBookingInfo.startTime || activeBookingInfo.start_time || '').slice(0, 5)} – {(activeBookingInfo.endTime || activeBookingInfo.end_time || '').slice(0, 5)}
                  </strong>
                </div>
              )}

              {selectedSlots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Selected Date:</span>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{selectedDate}</span>
                  </div>

                  <div className="slots-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '85px', overflowY: 'auto', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {isExtendMode ? 'Added Extension Slots' : 'Selected Slots'} ({selectedSlots.length}):
                    </span>
                    {selectedSlots.map((s, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', paddingLeft: '4px' }}>
                        <span>• {s.startTime} – {s.endTime}</span>
                        <span style={{ fontWeight: 600 }}>₹{parseFloat(s.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {isExtendMode ? 'Additional Duration:' : 'Total Duration:'}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                      {selectedSlots.length * (facility.slot_duration / 60)} {selectedSlots.length * (facility.slot_duration / 60) === 1 ? 'hour' : 'hours'}
                    </span>
                  </div>

                  {isExtendMode && activeBookingInfo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>New Total Match Time:</span>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--primary)' }}>
                        {(activeBookingInfo.startTime || activeBookingInfo.start_time || '').slice(0, 5)} – {selectedSlots[selectedSlots.length - 1].endTime}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Hourly Rate:</span>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>₹{parseFloat(facility.price_per_hour).toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                      {isExtendMode ? 'Payable Now (New Slots):' : 'Total Amount:'}
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{selectedSlots.reduce((sum, s) => sum + parseFloat(s.price), 0).toFixed(2)}
                    </span>
                  </div>

                  {errorMessage && (
                    <div className="badge-danger" style={{ display: 'flex', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-md)', fontSize: '0.78rem' }}>
                      <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="badge-success" style={{ display: 'flex', gap: '8px', padding: '8px 10px', borderRadius: 'var(--radius-md)', fontSize: '0.78rem' }}>
                      <Check size={15} style={{ flexShrink: 0 }} />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <button
                    onClick={handleProceedToPayment}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.9rem', background: isExtendMode ? 'linear-gradient(135deg, var(--primary), #8b5cf6)' : undefined }}
                  >
                    {isExtendMode ? `Proceed to Pay Additional ₹${selectedSlots.reduce((sum, s) => sum + parseFloat(s.price), 0).toFixed(2)}` : 'Book Now (Proceed to Payment)'}
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <p style={{ margin: 0, lineHeight: 1.5 }}>
                    {isExtendMode
                      ? `Please select one or multiple consecutive available slots starting from ${(activeBookingInfo?.endTime || activeBookingInfo?.end_time || '').slice(0, 5)} to extend your session.`
                      : 'Please select a date and one or more available time slots from the schedule list to view booking checkout details.'}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── THIRD ROW: Facility Reviews & Rating Breakdown ── */}
        <div className="glass-card" style={{ padding: '32px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Star size={20} fill="#f59e0b" stroke="none" />
                Player Reviews & Ratings
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', margin: 0 }}>
                Verified feedback from athletes who played at {facility.name}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface)', padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>
                {facilityRating.count > 0 ? facilityRating.avg.toFixed(1) : '4.8'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.round(facilityRating.avg || 5) ? '#f59e0b' : 'none'} stroke={i < Math.round(facilityRating.avg || 5) ? 'none' : 'var(--text-muted)'} />
                  ))}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {facilityRating.count} {facilityRating.count === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
          </div>

          {!Array.isArray(facilityReviews) || facilityReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <p style={{ margin: 0 }}>No written reviews yet for this venue. Be the first to leave feedback after your match session!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {facilityReviews.map(r => {
                if (!r) return null;
                const userName = r.user_name || 'User';
                const initials = userName ? userName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
                const dateObj = r.created_at ? new Date(r.created_at) : new Date();
                const formattedDate = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const ratingNum = parseInt(r.rating, 10) || 5;

                return (
                  <div key={r.id || Math.random()} style={{ background: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {initials}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{userName}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formattedDate}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} fill={i < ratingNum ? '#f59e0b' : 'none'} stroke={i < ratingNum ? 'none' : 'var(--text-muted)'} />
                      ))}
                    </div>

                    {r.comment && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
