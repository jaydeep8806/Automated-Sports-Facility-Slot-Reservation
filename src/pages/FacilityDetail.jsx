import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Info, CalendarCheck2, ShieldAlert, Sparkles, Check } from 'lucide-react';

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

  return (
    <div className="container animate-fade-in" style={{ marginTop: '20px' }}>

      {/* Banner / Showcase */}
      <section className="glass-card" style={{ overflow: 'hidden', padding: 0, border: '1px solid var(--card-border)', marginBottom: '40px' }}>
        <div style={{ position: 'relative', height: '350px' }}>
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
            padding: '40px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '12px' }}>
                {facility.type === 'cricket' ? 'Cricket Ground' : facility.type === 'tennis' ? 'Tennis Court' : 'Pickleball Arena'}
              </span>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>{facility.name}</h1>
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

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px'
      }} className="detail-layout">

        {/* Left Side: About & Booking */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Facility Details card */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={20} style={{ color: 'var(--primary)' }} />
              Venue Profile
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '24px' }}>
              {facility.description}
            </p>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Key Amenities Available</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {facility.amenities && facility.amenities.map((amenity, idx) => (
                <div key={idx} className="amenity-tag" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.875rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></div>
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Slots Selector Card */}
          <div className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarCheck2 size={20} style={{ color: 'var(--primary)' }} />
              Choose Reservation Timing
            </h2>

            {/* Date Input */}
            <div className="form-group" style={{ maxWidth: '300px', marginBottom: '32px' }}>
              <label className="form-label">Select Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                min={getTodayStr()}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Slots Grid */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Available Time Slots</h3>

            {slotsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                <div className="spinner" /></div>
            ) : slots.length === 0 ? (
              <p style={{ color: 'var(--text-dark)' }}>No operational hours configured for this venue.</p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '12px'
              }}>
                {slots.map((slot, index) => {
                  const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);

                  let cursor = 'pointer';
                  let border = '1px solid var(--border)';
                  let background = 'var(--bg-surface)';
                  let opacity = 1;
                  let textColor = 'var(--text-main)';

                  if (slot.booked) {
                    cursor = 'not-allowed';
                    background = 'var(--danger-glow)';
                    border = '1px solid rgba(239, 68, 68, 0.2)';
                    textColor = 'var(--text-muted)';
                  } else if (slot.isPast) {
                    cursor = 'not-allowed';
                    background = 'var(--bg-surface)';
                    border = '1px solid var(--border)';
                    textColor = 'var(--text-muted)';
                    opacity = 0.45;
                  } else if (isSelected) {
                    background = 'var(--primary-glow)';
                    border = '2px solid var(--primary)';
                    textColor = 'var(--primary)';
                  }

                  return (
                    <button
                      key={index}
                      className={`time-slot-btn ${isSelected ? 'selected' : ''}`}
                      disabled={slot.booked || slot.isPast}
                      onClick={() => {
                        if (selectedSlots.some(s => s.startTime === slot.startTime)) {
                          setSelectedSlots(selectedSlots.filter(s => s.startTime !== slot.startTime));
                        } else {
                          setSelectedSlots([...selectedSlots, slot]);
                        }
                      }}
                      style={{
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

                      {slot.booked && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 600, marginTop: '2px' }}>Booked</span>
                      )}
                      {slot.isPast && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)', fontWeight: 600, marginTop: '2px' }}>Passed</span>
                      )}
                      {!slot.booked && !slot.isPast && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>Available</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Order summary (Sticks on desktop) */}
        <div style={{ position: 'relative' }}>
          <div className="glass-card" style={{
            padding: '32px',
            position: 'sticky',
            top: '110px',
            border: '1px solid var(--card-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              Booking Details
            </h2>

            {/* Selected Info Summary */}
            {selectedSlots.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Selected Date:</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedDate}</span>
                </div>

                {/* List Slots */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Selected Slots ({selectedSlots.length}):</span>
                  {selectedSlots.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', paddingLeft: '8px' }}>
                      <span>• {s.startTime} – {s.endTime}</span>
                      <span style={{ fontWeight: 600 }}>₹{parseFloat(s.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Duration:</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {selectedSlots.length * (facility.slot_duration / 60)} {selectedSlots.length * (facility.slot_duration / 60) === 1 ? 'hour' : 'hours'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Hourly Rate:</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>₹{parseFloat(facility.price_per_hour).toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '12px', marginTop: '8px' }}>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Total Amount:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{selectedSlots.reduce((sum, s) => sum + parseFloat(s.price), 0).toFixed(2)}
                  </span>
                </div>

                {errorMessage && (
                  <div className="badge-danger" style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="badge-success" style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                    <Check size={16} style={{ flexShrink: 0 }} />
                    <span>{successMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleProceedToPayment}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px' }}
                >
                  Book Now (Proceed to Payment)
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <p>Please select a date and one or more available time slots from the schedule list to view booking checkout details.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @media (min-width: 992px) {
          .detail-layout {
            grid-template-columns: 2fr 1fr !important;
          }
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
