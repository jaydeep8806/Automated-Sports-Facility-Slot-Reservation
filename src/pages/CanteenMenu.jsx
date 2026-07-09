import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart, Plus, Minus, Trash2, ChevronRight,
  Leaf, Drumstick, Search, X, UtensilsCrossed, ArrowRight
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const API = API_BASE_URL + '/api/canteen';

export const CanteenMenu = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get('bookingId');
  const facilityId = params.get('facilityId');
  const facilityName = decodeURIComponent(params.get('facilityName') || 'Stadium Canteen');

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartBump, setCartBump] = useState(false); // animation trigger
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [customNote, setCustomNote] = useState('');

  const standardInstructions = [
    { id: 'spicy', label: '🌶️ Spicy' },
    { id: 'hot', label: '⚡ Serve Hot' },
    { id: 'cutlery', label: '🚫 No Cutlery' },
    { id: 'cold', label: '🥤 Chilled' }
  ];

  // Refs for scroll-to-top on cart open
  const cartTopRef = useRef(null);
  const cartScrollRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [catRes, itemRes] = await Promise.all([
          fetch(`${API}/categories`),
          fetch(`${API}/items${facilityId ? `?facilityId=${facilityId}` : ''}`)
        ]);
        setCategories(await catRes.json());
        setItems(await itemRes.json());
      } catch (err) {
        console.error('Failed to load canteen data', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [facilityId]);

  const filtered = items.filter(item => {
    const matchCat = activeCategory === 'all' || item.category_name === activeCategory;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Bump animation on cart count change
  const triggerBump = () => {
    setCartBump(true);
    setTimeout(() => setCartBump(false), 350);
  };

  const addToCart = useCallback((item) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { ...item, qty: (prev[item.id]?.qty || 0) + 1 }
    }));
    triggerBump();
  }, []);

  const removeFromCart = useCallback((itemId) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[itemId]?.qty > 1) {
        updated[itemId] = { ...updated[itemId], qty: updated[itemId].qty - 1 };
      } else {
        delete updated[itemId];
      }
      return updated;
    });
    triggerBump();
  }, []);

  const deleteFromCart = useCallback((itemId) => {
    setCart(prev => { const u = { ...prev }; delete u[itemId]; return u; });
    triggerBump();
  }, []);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((a, i) => a + i.qty, 0);
  const cartTotal = cartItems.reduce((a, i) => a + i.qty * parseFloat(i.price), 0);

  // Open cart and scroll to top of cart items
  const openCart = () => {
    setCartOpen(true);
    setTimeout(() => {
      if (cartScrollRef.current) cartScrollRef.current.scrollTop = 0;
    }, 50);
  };

  const handleProceed = () => {
    if (cartItems.length === 0) return;
    navigate('/canteen/checkout', {
      state: { bookingId, facilityId, facilityName, cart: cartItems, totalPrice: cartTotal }
    });
  };

  return (
    <>
      <div
        style={{ paddingTop: '32px', paddingBottom: cartCount > 0 ? '100px' : '48px' }}
        className="container animate-fade-in"
      >
      {/* ── Header ── */}
      <div style={{ marginBottom: '26px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          padding: '12px', borderRadius: '16px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(245,158,11,0.35)'
        }}>
          <UtensilsCrossed size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
            {facilityName} Canteen
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '3px' }}>
            🚀 Order food &amp; get it delivered right to your seat
          </p>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ position: 'relative', marginBottom: '18px' }}>
        <Search size={16} style={{
          position: 'absolute', left: '14px', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none'
        }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search food items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: '42px', paddingRight: search ? '42px' : '14px' }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: '12px', top: '50%',
              transform: 'translateY(-50%)', background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Category Tabs ── */}
      <div style={{
        display: 'flex', gap: '9px', overflowX: 'auto',
        paddingBottom: '4px', marginBottom: '26px', scrollbarWidth: 'none'
      }}>
        {[{ name: 'All', icon: '🍽️' }, ...categories.map(c => ({ name: c.name, icon: c.icon }))].map(cat => {
          const isActive = (activeCategory === 'all' && cat.name === 'All') || activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name === 'All' ? 'all' : cat.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '999px', whiteSpace: 'nowrap', flexShrink: 0,
                border: isActive ? '1.5px solid var(--primary)' : '1.5px solid var(--card-border)',
                background: isActive ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: isActive ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
              }}
            >
              <span style={{ fontSize: '0.95rem' }}>{cat.icon}</span> {cat.name}
            </button>
          );
        })}
      </div>

      {/* ── Food Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{
            display: 'inline-block', width: '38px', height: '38px',
            border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
            borderRadius: '50%', animation: 'spin 0.75s linear infinite', marginBottom: '12px'
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading menu...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
          <UtensilsCrossed size={52} style={{ marginBottom: '14px', opacity: 0.22 }} />
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px' }}>No items found</h3>
          <p style={{ fontSize: '0.85rem' }}>Try a different category or search term.</p>
        </div>
      ) : (
        <div className="food-grid">
          {filtered.map(item => {
            const inCart = cart[item.id];
            return (
              <div key={item.id} className="food-card">
                {/* Image */}
                <div style={{ position: 'relative', height: '178px', overflow: 'hidden', borderRadius: '14px 14px 0 0' }}>
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    className="food-img"
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'; }}
                  />
                  {/* Veg/Non-veg */}
                  <span style={{
                    position: 'absolute', top: '10px', left: '10px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: item.is_veg ? 'rgba(16,185,129,0.92)' : 'rgba(239,68,68,0.92)',
                    color: '#fff', fontSize: '0.66rem', fontWeight: 800,
                    padding: '3px 8px', borderRadius: '999px',
                    backdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                  }}>
                    {item.is_veg ? <Leaf size={9} /> : <Drumstick size={9} />}
                    {item.is_veg ? 'VEG' : 'NON-VEG'}
                  </span>
                  {/* Category chip */}
                  {item.category_name && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: 'rgba(0,0,0,0.52)', color: '#fff',
                      fontSize: '0.63rem', fontWeight: 700,
                      padding: '3px 8px', borderRadius: '999px', backdropFilter: 'blur(6px)'
                    }}>
                      {item.category_name}
                    </span>
                  )}
                  {/* Unavailable overlay */}
                  {!item.is_available && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.62)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem', letterSpacing: '0.05em' }}>UNAVAILABLE</span>
                    </div>
                  )}
                  {/* In-cart badge */}
                  {inCart && (
                    <div style={{
                      position: 'absolute', bottom: '10px', right: '10px',
                      background: 'var(--primary)', color: '#fff',
                      borderRadius: '999px', padding: '2px 10px',
                      fontSize: '0.72rem', fontWeight: 800,
                      boxShadow: '0 2px 10px rgba(99,102,241,0.5)',
                      animation: 'popIn 0.2s ease'
                    }}>
                      {inCart.qty} in cart
                    </div>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '13px 15px 15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                    <h3 style={{ fontSize: '0.93rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3, flex: 1, marginRight: '8px' }}>
                      {item.name}
                    </h3>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                      ₹{item.price}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '13px', lineHeight: 1.5, minHeight: '32px' }}>
                    {item.description}
                  </p>

                  {item.is_available ? (
                    inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div className="qty-control" style={{ flex: 1, justifyContent: 'space-between' }}>
                          <button onClick={() => removeFromCart(item.id)} className="qty-btn"><Minus size={13} /></button>
                          <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{inCart.qty}</span>
                          <button onClick={() => addToCart(item)} className="qty-btn"><Plus size={13} /></button>
                        </div>
                        <button
                          onClick={() => deleteFromCart(item.id)}
                          className="del-btn"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="btn btn-primary add-btn"
                        style={{ width: '100%' }}
                      >
                        <Plus size={14} /> Add to Cart
                      </button>
                    )
                  ) : (
                    <button disabled className="disabled-btn">
                      Not Available
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

      {/* ══════════════════════════════════════════
          FLOATING CART BUTTON  (compact pill, fixed)
          ══════════════════════════════════════════ */}
      {cartCount > 0 && !cartOpen && (

        <button
          className={`floating-cart-btn${cartBump ? ' bump' : ''}`}
          onClick={openCart}
          aria-label="View Cart"
        >
          {/* Left section */}
          <span className="fcb-left">
            <span className="fcb-badge">{cartCount}</span>
            <span className="fcb-label">{cartCount === 1 ? 'item' : 'items'}</span>
            <span className="fcb-sep">•</span>
            <span className="fcb-price">₹{cartTotal.toFixed(0)}</span>
          </span>

          {/* Divider */}
          <span className="fcb-divider" />

          {/* Right section */}
          <span className="fcb-right">
            <ShoppingCart size={16} />
            View Cart
            <ChevronRight size={16} strokeWidth={2.5} />
          </span>
        </button>
      )}

      {/* ══════════════════════════════════════════
          CART SIDE DRAWER
          ══════════════════════════════════════════ */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400 }}>
          {/* Backdrop */}
          <div
            onClick={() => setCartOpen(false)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.58)',
              backdropFilter: 'blur(3px)',
              animation: 'fadeInBg 0.2s ease'
            }}
          />

          {/* Drawer Panel */}
          <div
            className="cart-drawer"
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0,
              width: '100%', maxWidth: '420px',
              background: 'var(--card-bg-solid)',
              boxShadow: '-16px 0 60px rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column',
              animation: 'slideInRight 0.3s cubic-bezier(0.22,1,0.36,1)'
            }}
          >
            {/* ── Drawer Header ── */}
            <div ref={cartTopRef} style={{
              padding: '18px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.07), rgba(139,92,246,0.04))',
              flexShrink: 0
            }}>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                  <ShoppingCart size={20} style={{ color: 'var(--primary)' }} />
                  Your Cart
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {cartCount} item{cartCount !== 1 ? 's' : ''} &middot; {facilityName}
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--card-border)',
                  borderRadius: '10px', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: '7px', display: 'flex', alignItems: 'center',
                  transition: 'all 0.15s'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Cart Items (scrollable) ── */}
            <div
              ref={cartScrollRef}
              style={{ overflowY: 'auto', flex: 1, padding: '14px 16px' }}
            >
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={44} style={{ opacity: 0.15, marginBottom: '12px' }} />
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>Cart is empty</p>
                  <p style={{ fontSize: '0.8rem' }}>Add items from the menu</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cartItems.map(item => (
                    <div
                      key={item.id}
                      className="cart-item-row"
                    >
                      {/* Thumbnail */}
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                        alt={item.name}
                        style={{ width: '54px', height: '54px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'; }}
                      />
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                          {item.name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          ₹{parseFloat(item.price).toFixed(0)} each
                        </div>
                      </div>
                      {/* Qty + price + delete */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                        <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem' }}>
                          ₹{(item.qty * parseFloat(item.price)).toFixed(0)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div className="qty-control-sm">
                            <button onClick={() => removeFromCart(item.id)} className="qty-btn-sm"><Minus size={11} /></button>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', minWidth: '18px', textAlign: 'center' }}>{item.qty}</span>
                            <button onClick={() => addToCart(item)} className="qty-btn-sm"><Plus size={11} /></button>
                          </div>
                          <button
                            onClick={() => deleteFromCart(item.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '2px', display: 'flex', opacity: 0.65, transition: 'opacity 0.15s' }}
                            onMouseOver={e => e.currentTarget.style.opacity = '1'}
                            onMouseOut={e => e.currentTarget.style.opacity = '0.65'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Delivery Location Info Card */}
                  <div style={{
                    marginTop: '10px',
                    padding: '12px 14px',
                    background: 'var(--bg-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--card-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      background: 'rgba(99,102,241,0.1)',
                      color: 'var(--primary)',
                      width: '34px', height: '34px',
                      borderRadius: '10px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>📍</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                        Delivery Spot
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {facilityName} &middot; Slot delivery
                      </div>
                    </div>
                  </div>

                  {/* Delivery / Cooking Instructions */}
                  <div style={{
                    padding: '14px',
                    background: 'var(--bg-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--card-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
                      Instructions &amp; Preferences
                    </div>
                    {/* Selectable badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {standardInstructions.map(instr => {
                        const isSelected = selectedNotes.includes(instr.id);
                        return (
                          <button
                            key={instr.id}
                            type="button"
                            onClick={() => {
                              setSelectedNotes(prev =>
                                prev.includes(instr.id) ? prev.filter(x => x !== instr.id) : [...prev, instr.id]
                              );
                            }}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '999px',
                              border: isSelected ? '1px solid var(--primary)' : '1px solid var(--card-border)',
                              background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                              color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {instr.label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Text input note */}
                    <div style={{ position: 'relative', marginTop: '4px' }}>
                      <input
                        type="text"
                        placeholder="Add a note (e.g. make it extra hot, sweet...)"
                        value={customNote}
                        onChange={e => setCustomNote(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          borderRadius: '8px',
                          border: '1px solid var(--card-border)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Bill Details */}
                  <div style={{
                    padding: '14px',
                    background: 'var(--bg-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--card-border)'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      Bill Details
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '7px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Item Total ({cartCount} items)</span>
                      <span style={{ fontWeight: 600 }}>₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Delivery Charges</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>FREE</span>
                    </div>
                    <div style={{ height: '1px', background: 'var(--border)', marginBottom: '10px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>To Pay</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sticky Checkout Footer ── */}
            {cartItems.length > 0 && (
              <div style={{
                padding: '14px 16px',
                borderTop: '1px solid var(--border)',
                background: 'var(--card-bg-solid)',
                flexShrink: 0,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '1px' }}>
                      TOTAL AMOUNT
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      ₹{cartTotal.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={handleProceed}
                    className="btn btn-primary"
                    style={{
                      padding: '13px 24px',
                      fontSize: '0.95rem', fontWeight: 800,
                      borderRadius: '14px',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 18px var(--primary-glow)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Proceed <ArrowRight size={18} />
                  </button>
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                  🔒 Secure payment · Free delivery to your seat
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        /* ─── Food Grid ─── */
        .food-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }

        /* ─── Food Card ─── */
        .food-card {
          background: var(--card-bg-solid);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.26s ease, box-shadow 0.26s ease;
          position: relative;
        }
        .food-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 38px rgba(0,0,0,0.2);
        }
        .food-card:hover .food-img {
          transform: scale(1.07);
        }

        /* ─── Add / Disabled buttons ─── */
        .add-btn {
          padding: 9px 0 !important;
          font-size: 0.85rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 5px !important;
          font-weight: 700 !important;
          border-radius: 10px !important;
        }
        .del-btn {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 8px;
          cursor: pointer;
          color: var(--danger);
          padding: 6px;
          display: flex;
          align-items: center;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .del-btn:hover { background: rgba(239,68,68,0.18); }
        .disabled-btn {
          width: 100%; padding: 9px 0;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--card-border);
          color: var(--text-muted);
          font-size: 0.85rem;
          cursor: not-allowed;
        }

        /* ─── Qty Controls (food card) ─── */
        .qty-control {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-surface);
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid var(--card-border);
          flex: 1;
        }
        .qty-btn {
          background: none; border: none;
          cursor: pointer; color: var(--text-main);
          display: flex; align-items: center;
          padding: 2px; border-radius: 50%;
          transition: background 0.15s, color 0.15s;
        }
        .qty-btn:hover {
          background: rgba(99,102,241,0.15);
          color: var(--primary);
        }

        /* ─── Qty Controls (drawer, smaller) ─── */
        .qty-control-sm {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface);
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid var(--card-border);
        }
        .qty-btn-sm {
          background: none; border: none;
          cursor: pointer; color: var(--text-main);
          display: flex; align-items: center;
          padding: 1px; border-radius: 50%;
          transition: background 0.15s, color 0.15s;
        }
        .qty-btn-sm:hover {
          background: rgba(99,102,241,0.15);
          color: var(--primary);
        }

        /* ─── Cart Item Row ─── */
        .cart-item-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 12px;
          background: var(--bg-surface);
          border-radius: 12px;
          border: 1px solid var(--card-border);
          transition: box-shadow 0.18s;
        }
        .cart-item-row:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }

        /* ─── Floating Cart Button ─── */
        .floating-cart-btn {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 250;
          display: inline-flex;
          align-items: center;
          gap: 0;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          color: #fff;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(99,102,241,0.45), 0 2px 8px rgba(0,0,0,0.2);
          font-family: inherit;
          font-weight: 700;
          white-space: nowrap;
          animation: floatIn 0.38s cubic-bezier(0.22,1,0.36,1);
          transition: box-shadow 0.2s, transform 0.2s, filter 0.15s;
          min-width: 260px;
          max-width: 90vw;
          overflow: hidden;
        }
        .floating-cart-btn:hover {
          box-shadow: 0 12px 40px rgba(99,102,241,0.55), 0 4px 12px rgba(0,0,0,0.25);
          filter: brightness(1.07);
          transform: translateX(-50%) translateY(-2px);
        }
        .floating-cart-btn.bump {
          animation: bumpScale 0.35s cubic-bezier(0.36,0.07,0.19,0.97);
        }

        .fcb-left {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 13px 18px;
          font-size: 0.9rem;
        }
        .fcb-badge {
          background: rgba(255,255,255,0.25);
          border-radius: 999px;
          padding: 2px 9px;
          font-size: 0.82rem;
          font-weight: 800;
          line-height: 1.4;
        }
        .fcb-label {
          font-weight: 600;
          font-size: 0.85rem;
          opacity: 0.9;
        }
        .fcb-sep {
          opacity: 0.55;
          font-size: 0.75rem;
        }
        .fcb-price {
          font-weight: 800;
          font-size: 0.95rem;
        }
        .fcb-divider {
          width: 1px;
          height: 36px;
          background: rgba(255,255,255,0.22);
          flex-shrink: 0;
        }
        .fcb-right {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 13px 18px;
          font-size: 0.9rem;
          font-weight: 800;
        }

        /* ─── Animations ─── */
        @keyframes floatIn {
          from { transform: translateX(-50%) translateY(60px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
        @keyframes bumpScale {
          0%   { transform: translateX(-50%) scale(1); }
          35%  { transform: translateX(-50%) scale(1.06); }
          65%  { transform: translateX(-50%) scale(0.97); }
          100% { transform: translateX(-50%) scale(1); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0.6; }
          to   { transform: translateX(0);    opacity: 1;   }
        }
        @keyframes fadeInBg {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ─── Hide scrollbars ─── */
        ::-webkit-scrollbar { width: 0; height: 0; }

        /* ─── Responsive ─── */
        @media (max-width: 480px) {
          .floating-cart-btn {
            bottom: 20px;
            min-width: 80vw;
          }
          .cart-drawer { max-width: 100% !important; }
        }
        @media (min-width: 768px) {
          .food-grid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          }
        }
      `}</style>
    </>
  );
};
