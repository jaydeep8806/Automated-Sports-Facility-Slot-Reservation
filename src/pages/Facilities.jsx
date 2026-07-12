import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Dumbbell, Star, Heart } from 'lucide-react';

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

const SkeletonCard = () => (
  <div className="glass-card" style={{ overflow: 'hidden' }}>
    <div className="skeleton" style={{ height: '200px', borderRadius: '0' }} />
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="skeleton" style={{ height: '20px', width: '70%' }} />
      <div className="skeleton" style={{ height: '14px', width: '50%' }} />
      <div className="skeleton" style={{ height: '14px', width: '90%' }} />
      <div className="skeleton" style={{ height: '14px', width: '80%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px' }}>
        <div className="skeleton" style={{ height: '24px', width: '80px' }} />
        <div className="skeleton" style={{ height: '36px', width: '100px', borderRadius: '8px' }} />
      </div>
    </div>
  </div>
);

export const Facilities = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'all';

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState(typeParam || 'all');
  const [maxPrice, setMaxPrice] = useState(2000);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const t = searchParams.get('type') || 'all';
    setType(t);
  }, [searchParams]);

  const handleTypeChange = (newType) => {
    setType(newType);
    const newParams = new URLSearchParams(searchParams);
    if (newType === 'all') { newParams.delete('type'); } else { newParams.set('type', newType); }
    setSearchParams(newParams);
  };

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const url = new URL(API_BASE_URL + '/api/facilities');
      if (search) url.searchParams.append('search', search);
      if (type && type !== 'all') url.searchParams.append('type', type);
      if (maxPrice) url.searchParams.append('maxPrice', maxPrice);
      const response = await fetch(url.toString());
      if (response.ok) { const data = await response.json(); setFacilities(data); }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchFacilities(); }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, type, maxPrice]);

  return (
    <div className="container animate-fade-in" style={{ marginTop: '20px', paddingBottom: '60px' }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Explore Facilities</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9375rem' }}>
            Find and reserve the perfect ground or turf for your team.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--border)' }}>
          <SlidersHorizontal size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Search & Filter</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
          {/* Text Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Venue</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Lords Ground, Ahmedabad..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{ paddingLeft: '42px' }}
              />
              {showSuggestions && search.trim() !== '' && (
                <div className="autocomplete-dropdown">
                  {facilities.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(s => (
                    <div key={s.id} className="suggestion-item" onMouseDown={() => { setSearch(s.name); setShowSuggestions(false); navigate(`/facilities/${s.id}`); }}>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <MapPin size={11} style={{ display: 'inline', marginRight: 3 }} />{s.location.split(',')[0]}
                      </span>
                    </div>
                  ))}
                  {facilities.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                    <div style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>No matches found</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sport Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Sport Category</label>
            <select className="form-input" value={type} onChange={(e) => handleTypeChange(e.target.value)}>
              <option value="all">All Sports</option>
              <option value="cricket">Cricket Ground</option>
              <option value="tennis">Tennis Court</option>
              <option value="pickleball">Pickleball Arena</option>
            </select>
          </div>

          {/* Price Slider */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <label className="form-label">Max Price / Hour</label>
              <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 700 }}>₹{maxPrice}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '46px' }}>
              <input
                type="range" min="300" max="2500" step="50" value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--primary)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sport Filter Pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {[
          { value: 'all',         label: '🏟️ All Sports' },
          { value: 'cricket',     label: '🏏 Cricket' },
          { value: 'tennis',      label: '🎾 Tennis' },
          { value: 'pickleball',  label: '🏓 Pickleball' },
        ].map(pill => (
          <button
            key={pill.value}
            onClick={() => handleTypeChange(pill.value)}
            style={{
              padding: '8px 18px',
              borderRadius: '999px',
              border: type === pill.value
                ? '2px solid var(--primary)'
                : '2px solid var(--card-border)',
              background: type === pill.value
                ? 'rgba(99,102,241,0.1)'
                : 'rgba(255,255,255,0.03)',
              color: type === pill.value ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: type === pill.value ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && facilities.length > 0 && (
        <div style={{ marginBottom: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: 'var(--text-main)' }}>{facilities.length}</strong> {facilities.length === 1 ? 'facility' : 'facilities'}
        </div>
      )}

      {/* Facilities Grid */}
      {loading ? (
        <div className="grid-container">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : facilities.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Dumbbell size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.1875rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>No Facilities Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try adjusting your search or filters to find more venues.</p>
        </div>
      ) : (
        <div className="grid-container animate-stagger">
          {facilities.map(f => (
            <div key={f.id} className="glass-card facility-card">
              {/* Image */}
              <div className="facility-card-image-wrap">
                <img
                  src={getFacilityImage(f.images, f.type)}
                  alt={f.name}
                  onError={(e) => { e.target.onerror = null; e.target.src = SPORT_IMAGES[f.type] || SPORT_IMAGES.default; }}
                />
                <span className="badge badge-success" style={{ position: 'absolute', top: '12px', left: '12px', backdropFilter: 'blur(8px)' }}>
                  {f.type === 'cricket' ? 'Cricket' : f.type === 'tennis' ? 'Tennis' : 'Pickleball'}
                </span>
                {/* Fake rating badge */}
                <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', borderRadius: '999px', padding: '3px 9px', fontSize: '0.7rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                  <Star size={10} fill="#f59e0b" stroke="none" />
                  {(4.2 + Math.random() * 0.7).toFixed(1)}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '5px', color: 'var(--text-main)' }}>{f.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    <MapPin size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span>{f.location}</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: '1.6', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {f.description || 'Professional-grade sports arena with top-tier playing surface, floodlights, and premium amenities.'}
                </p>

                {f.amenities && f.amenities.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {f.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="amenity-tag">{amenity}</span>
                    ))}
                    {f.amenities.length > 3 && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', padding: '3px 0', fontWeight: 600 }}>+{f.amenities.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="facility-price-row">
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>₹{f.price_per_hour}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '3px' }}>/hr</span>
                  </div>
                  <Link to={`/facilities/${f.id}`} className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.8125rem' }}>
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
