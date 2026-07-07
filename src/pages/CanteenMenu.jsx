import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart, Plus, Minus, Trash2, ChevronRight,
  Leaf, Drumstick, AlertCircle, Search, X, UtensilsCrossed
} from 'lucide-react';

const API = 'http://localhost:5000/api/canteen';

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [catRes, itemRes] = await Promise.all([
          fetch(`${API}/categories`),
          fetch(`${API}/items${facilityId ? `?facilityId=${facilityId}` : ''}`)
        ]);
        const cats = await catRes.json();
        const its = await itemRes.json();
        setCategories(cats);
        setItems(its);
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
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = useCallback((item) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        ...item,
        qty: (prev[item.id]?.qty || 0) + 1
      }
    }));
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
  }, []);

  const deleteFromCart = useCallback((itemId) => {
    setCart(prev => { const u = { ...prev }; delete u[itemId]; return u; });
  }, []);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((a, i) => a + i.qty, 0);
  const cartTotal = cartItems.reduce((a, i) => a + i.qty * parseFloat(i.price), 0);

  const handleProceed = () => {
    if (cartItems.length === 0) return;
    navigate('/canteen/checkout', {
      state: { bookingId, facilityId, facilityName, cart: cartItems, totalPrice: cartTotal }
    });
  };

  return (
    <div className="container animate-fade-in" style={{ paddingTop: '32px', paddingBottom: '120px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            padding: '10px', borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,158,11,0.3)'
          }}>
            <UtensilsCrossed size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {facilityName} Canteen
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Order food & get it delivered at your seat 🎉
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="canteen-layout">
        {/* Main Content */}
        <div>
          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search food items..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '42px' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '24px' }}>
            {[{ name: 'All', icon: '🍽️' }, ...categories.map(c => ({ name: c.name, icon: c.icon }))].map(cat => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name === 'All' ? 'all' : cat.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 18px', borderRadius: '999px', whiteSpace: 'nowrap',
                  border: (activeCategory === 'all' && cat.name === 'All') || activeCategory === cat.name
                    ? '1.5px solid var(--primary)'
                    : '1.5px solid var(--card-border)',
                  background: (activeCategory === 'all' && cat.name === 'All') || activeCategory === cat.name
                    ? 'rgba(99,102,241,0.1)'
                    : 'transparent',
                  color: (activeCategory === 'all' && cat.name === 'All') || activeCategory === cat.name
                    ? 'var(--primary)'
                    : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>

          {/* Food Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading menu...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <UtensilsCrossed size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>No items found.</p>
            </div>
          ) : (
            <div className="food-grid">
              {filtered.map(item => {
                const inCart = cart[item.id];
                return (
                  <div key={item.id} className="food-card">
                    <div style={{ position: 'relative', height: '180px', overflow: 'hidden', borderRadius: '12px 12px 0 0' }}>
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                        className="food-img"
                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'; }}
                      />
                      {/* Veg / Non-veg badge */}
                      <span style={{
                        position: 'absolute', top: '10px', left: '10px',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        background: item.is_veg ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)',
                        color: '#fff', fontSize: '0.7rem', fontWeight: 700,
                        padding: '3px 8px', borderRadius: '999px',
                        backdropFilter: 'blur(4px)'
                      }}>
                        {item.is_veg ? <Leaf size={10} /> : <Drumstick size={10} />}
                        {item.is_veg ? 'VEG' : 'NON-VEG'}
                      </span>
                      {/* Unavailable overlay */}
                      {!item.is_available && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: 'rgba(0,0,0,0.6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '12px 12px 0 0'
                        }}>
                          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Unavailable</span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3, flex: 1, marginRight: '8px' }}>{item.name}</h3>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>₹{item.price}</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>{item.description}</p>

                      {item.is_available ? (
                        inCart ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="qty-control">
                              <button onClick={() => removeFromCart(item.id)} className="qty-btn"><Minus size={13} /></button>
                              <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{inCart.qty}</span>
                              <button onClick={() => addToCart(item)} className="qty-btn"><Plus size={13} /></button>
                            </div>
                            <button onClick={() => deleteFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '9px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <Plus size={15} /> Add to Cart
                          </button>
                        )
                      ) : (
                        <button disabled style={{ width: '100%', padding: '9px', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--card-border)', color: 'var(--text-muted)', cursor: 'not-allowed' }}>
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
      </div>

      {/* Floating Cart Button (Mobile) */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="floating-cart-btn"
          style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: '#fff', border: 'none', padding: '14px 28px',
            borderRadius: '999px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '0.95rem',
            boxShadow: '0 8px 30px rgba(99,102,241,0.4)', zIndex: 100,
            animation: 'slideUp 0.3s ease'
          }}
        >
          <ShoppingCart size={20} />
          <span>{cartCount} item{cartCount > 1 ? 's' : ''} in cart</span>
          <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: '999px' }}>₹{cartTotal.toFixed(0)}</span>
          <ChevronRight size={18} />
        </button>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setCartOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
          <div className="cart-drawer" style={{
            position: 'absolute', right: 0, top: 0, height: '100%',
            width: '100%', maxWidth: '400px',
            background: 'var(--bg-card)', boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
            display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease'
          }}>
            {/* Cart Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} style={{ color: 'var(--primary)' }} /> Your Cart
              </h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                <X size={22} />
              </button>
            </div>

            {/* Cart Items */}
            <div style={{ overflowY: 'auto', padding: '12px 20px', maxHeight: 'calc(100vh - 180px)' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={40} style={{ opacity: 0.2, marginBottom: '12px' }} />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {cartItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                      <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'} alt={item.name} style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'; }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.875rem' }}>₹{(item.qty * parseFloat(item.price)).toFixed(0)}</div>
                      </div>
                      <div className="qty-control" style={{ flexShrink: 0 }}>
                        <button onClick={() => removeFromCart(item.id)} className="qty-btn"><Minus size={12} /></button>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: '18px', textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => addToCart(item)} className="qty-btn"><Plus size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total ({cartCount} items)</span>
                  <span style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>₹{cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={handleProceed} className="btn btn-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700 }}>
                  Proceed to Checkout <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .canteen-layout { grid-template-columns: 1fr; }
        @media (min-width: 1024px) { .canteen-layout { grid-template-columns: 1fr !important; } }
        .food-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
        .food-card {
          background: var(--bg-card); border: 1px solid var(--card-border);
          border-radius: 16px; overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .food-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.2); }
        .food-card:hover .food-img { transform: scale(1.07); }
        .qty-control { display: flex; align-items: center; gap: 8px; background: var(--bg-surface); padding: 6px 10px; border-radius: 999px; border: 1px solid var(--card-border); }
        .qty-btn { background: none; border: none; cursor: pointer; color: var(--text-main); display: flex; align-items: center; padding: 2px; border-radius: 50%; transition: background 0.15s; }
        .qty-btn:hover { background: rgba(99,102,241,0.15); color: var(--primary); }
        @keyframes slideUp { from { transform: translateX(-50%) translateY(100px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
};
