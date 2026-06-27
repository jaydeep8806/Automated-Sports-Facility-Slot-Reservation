import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Dumbbell } from 'lucide-react';

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


export const Facilities = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'all';

  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [search, setSearch] = useState('');
  const [type, setType] = useState(typeParam);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const t = searchParams.get('type') || 'all';
    setType(t);
  }, [searchParams]);

  const handleTypeChange = (newType) => {
    setType(newType);
    const newParams = new URLSearchParams(searchParams);
    if (newType === 'all') {
      newParams.delete('type');
    } else {
      newParams.set('type', newType);
    }
    setSearchParams(newParams);
  };


  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const url = new URL('http://localhost:5000/api/facilities');
      if (search) url.searchParams.append('search', search);
      if (type && type !== 'all') url.searchParams.append('type', type);
      if (maxPrice) url.searchParams.append('maxPrice', maxPrice);

      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setFacilities(data);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search/filters
    const delayDebounceFn = setTimeout(() => {
      fetchFacilities();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, type, maxPrice]);

  return (
    <div className="container animate-fade-in" style={{ marginTop: '20px' }}>
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Explore Facilities</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Find and reserve the perfect ground or turf for your team.</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-card" style={{
        padding: '24px',
        marginBottom: '40px',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '20px',
        border: '1px solid var(--card-border)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
          <SlidersHorizontal size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Search Filters</span>
        </div>

        {/* Filter Inputs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* F1: Text Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Venue Name / Location</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dark)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search e.g. Lords Ground..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                style={{ paddingLeft: '48px' }}
              />
              
              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && search.trim() !== '' && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'rgba(30, 41, 59, 0.98)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--radius-md)',
                  marginTop: '8px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  zIndex: 99,
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}>
                  {facilities
                    .filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
                    .map(s => (
                      <div 
                        key={s.id}
                        onMouseDown={() => {
                          setSearch(s.name);
                          setShowSuggestions(false);
                          navigate(`/facilities/${s.id}`);
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          fontSize: '0.9rem',
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      >
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {s.location.split(',')[0]}</span>
                      </div>
                    ))}
                  {facilities.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
                    <div style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      No matching venues found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* F2: Facility Type Selection */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Sports Category</label>
            <select 
              className="form-input"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="all">All Sports</option>
              <option value="cricket">Cricket Ground</option>
              <option value="tennis">Tennis Court</option>
              <option value="pickleball">Pickleball Arena</option>
            </select>
          </div>

          {/* F3: Price Slider */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <label className="form-label">Max Price per Hour</label>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>₹{maxPrice}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '46px' }}>
              <input 
                type="range" 
                min="300" 
                max="2500" 
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: 'var(--primary)',
                  cursor: 'pointer',
                  height: '6px',
                  borderRadius: '3px',
                  background: '#1e293b'
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      ) : facilities.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Dumbbell size={40} style={{ color: 'var(--text-dark)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>No Facilities Found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try modifying your search keywords, price limits, or sport categories.</p>
        </div>
      ) : (
        <div className="grid-container">
          {facilities.map(f => (
            <div key={f.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
              
              {/* Image Header */}
              <div style={{ position: 'relative' }}>
                <img 
                  src={getFacilityImage(f.images, f.type)} 
                  alt={f.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = SPORT_IMAGES[f.type] || SPORT_IMAGES.default;
                  }}
                  style={{ width: '100%', height: '220px', objectFit: 'cover', borderBottom: '1px solid var(--card-border)' }}
                />
                <span className="badge badge-success" style={{ position: 'absolute', top: '16px', right: '16px', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                  {f.type === 'cricket' ? 'Cricket' : f.type === 'tennis' ? 'Tennis' : 'Pickleball'}
                </span>
              </div>

              {/* Card Details */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{f.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
                    <MapPin size={14} style={{ color: 'var(--primary)' }} />
                    <span>{f.location}</span>
                  </div>
                </div>

                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical'
                }}>
                  {f.description || 'Professional-grade sports arena with top-tier playing surface, lighting, and premium amenities.'}
                </p>

                {/* Amenities Badges Row */}
                {f.amenities && f.amenities.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {f.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} style={{
                        fontSize: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--card-border)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)'
                      }}>
                        {amenity}
                      </span>
                    ))}
                    {f.amenities.length > 3 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', padding: '3px 0' }}>+{f.amenities.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Pricing / CTA row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>₹{f.price_per_hour}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}> / hour</span>
                  </div>
                  <Link to={`/facilities/${f.id}`} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
                    Book Slots
                  </Link>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
