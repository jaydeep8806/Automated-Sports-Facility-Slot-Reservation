import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { 
  Building2, CalendarDays, DollarSign, Users, Plus, 
  Trash2, Edit, X, ShieldAlert, Check, Settings, Trash, UtensilsCrossed, RefreshCw
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


export const AdminDashboard = () => {
  const { token } = useAuth();

  // Core Data
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalFacilities: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0
  });

  // UI Management tabs
  const [activeTab, setActiveTab] = useState('facilities'); // 'facilities' or 'bookings'
  
  // Filtering States
  const [filterLocation, setFilterLocation] = useState('all');
  const [searchVal, setSearchVal] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterBookingStatus, setFilterBookingStatus] = useState('all');
  const [filterOrderStatus, setFilterOrderStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Pagination States
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingsLimit] = useState(10);
  const [bookingsTotalPages, setBookingsTotalPages] = useState(1);
  
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit] = useState(10);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilterSearch(searchVal);
      setBookingsPage(1);
      setOrdersPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Forms & Modal controls
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState('cricket');
  const [location, setLocation] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [description, setDescription] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [openTime, setOpenTime] = useState('06:00:00');
  const [closeTime, setCloseTime] = useState('22:00:00');
  const [slotDuration, setSlotDuration] = useState(60);
  const [imageInput, setImageInput] = useState('');
  const [facilityStatus, setFacilityStatus] = useState('active');

  // Success / Error notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Facility Delete Modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState(null);

  // Booking Cancel Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  // Canteen States
  const [foodItems, setFoodItems] = useState([]);
  const [foodOrders, setFoodOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [canteenLoading, setCanteenLoading] = useState(false);
  const [foodItemForm, setFoodItemForm] = useState(null); // null = closed, {} = add, {id,...} = edit
  const [fName, setFName] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fPrice, setFPrice] = useState('');
  const [fCategoryId, setFCategoryId] = useState('');
  const [fImageUrl, setFImageUrl] = useState('');
  const [fIsVeg, setFIsVeg] = useState(true);
  const [fIsAvailable, setFIsAvailable] = useState(true);
  const [foodFormLoading, setFoodFormLoading] = useState(false);
  const [foodMsg, setFoodMsg] = useState('');

  // 1. Fetch data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch facilities
      const facRes = await fetch(API_BASE_URL + '/api/facilities');
      let facData = [];
      if (facRes.ok) {
        facData = await facRes.json();
        setFacilities(facData);
      }

      // Fetch bookings
      const bookUrl = new URL(API_BASE_URL + '/api/bookings/all');
      bookUrl.searchParams.append('location', filterLocation);
      bookUrl.searchParams.append('search', filterSearch);
      bookUrl.searchParams.append('status', filterBookingStatus);
      bookUrl.searchParams.append('date', filterDate);
      bookUrl.searchParams.append('page', bookingsPage);
      bookUrl.searchParams.append('limit', bookingsLimit);

      const bookRes = await fetch(bookUrl.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let bookData = { data: [], pagination: { pages: 1 } };
      if (bookRes.ok) {
        bookData = await bookRes.json();
        setBookings(bookData.data || []);
        setBookingsTotalPages(bookData.pagination?.pages || 1);
      }

      // Compute Stats using backend-provided aggregate stats
      setStats({
        totalFacilities: facData.length,
        totalBookings: bookData.stats?.totalBookings || 0,
        totalRevenue: bookData.stats?.totalRevenue || 0,
        activeUsers: bookData.stats?.activeUsers || 0
      });

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load administrative details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCanteenData = async () => {
    setCanteenLoading(true);
    try {
      const ordersUrl = new URL(API_BASE_URL + '/api/canteen/orders/all');
      ordersUrl.searchParams.append('location', filterLocation);
      ordersUrl.searchParams.append('search', filterSearch);
      ordersUrl.searchParams.append('orderStatus', filterOrderStatus);
      ordersUrl.searchParams.append('paymentStatus', filterPaymentStatus);
      ordersUrl.searchParams.append('date', filterDate);
      ordersUrl.searchParams.append('page', ordersPage);
      ordersUrl.searchParams.append('limit', ordersLimit);

      const [itemsRes, ordersRes, catsRes] = await Promise.all([
        fetch(API_BASE_URL + '/api/canteen/admin/items', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(ordersUrl.toString(), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(API_BASE_URL + '/api/canteen/categories')
      ]);
      if (itemsRes.ok) setFoodItems(await itemsRes.json());
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setFoodOrders(ordersData.data || []);
        setOrdersTotalPages(ordersData.pagination?.pages || 1);
      }
      if (catsRes.ok) setCategories(await catsRes.json());
    } catch (err) { console.error(err); }
    finally { setCanteenLoading(false); }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, filterLocation, filterSearch, filterBookingStatus, filterDate, bookingsPage, bookingsLimit]);

  useEffect(() => {
    if (token) {
      fetchCanteenData();
    }
  }, [token, filterLocation, filterSearch, filterOrderStatus, filterPaymentStatus, filterDate, ordersPage, ordersLimit]);

  const handleResetFilters = () => {
    setFilterLocation('all');
    setSearchVal('');
    setFilterSearch('');
    setFilterBookingStatus('all');
    setFilterOrderStatus('all');
    setFilterPaymentStatus('all');
    setFilterDate('');
    setBookingsPage(1);
    setOrdersPage(1);
  };

  const openFoodItemForm = (item = null) => {
    setFoodItemForm(item || {});
    setFName(item?.name || '');
    setFDesc(item?.description || '');
    setFPrice(item?.price || '');
    setFCategoryId(item?.category_id || '');
    setFImageUrl(item?.image_url || '');
    setFIsVeg(item?.is_veg !== false);
    setFIsAvailable(item?.is_available !== false);
    setFoodMsg('');
  };

  const handleSaveFoodItem = async (e) => {
    e.preventDefault();
    setFoodFormLoading(true);
    setFoodMsg('');
    try {
      const isEdit = foodItemForm?.id;
      const url = isEdit
        ? `${API_BASE_URL}/api/canteen/admin/items/${foodItemForm.id}`
        : API_BASE_URL + '/api/canteen/admin/items';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: fName, description: fDesc, price: fPrice, categoryId: fCategoryId || null, imageUrl: fImageUrl, isVeg: fIsVeg, isAvailable: fIsAvailable })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setFoodMsg(isEdit ? 'Item updated!' : 'Item added!');
      setFoodItemForm(null);
      fetchCanteenData();
    } catch (err) {
      setFoodMsg(err.message || 'Failed to save item.');
    } finally { setFoodFormLoading(false); }
  };

  const handleDeleteFoodItem = async (id) => {
    if (!window.confirm('Delete this food item?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/canteen/admin/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { setFoodMsg('Item deleted.'); fetchCanteenData(); }
    } catch (err) { setFoodMsg('Failed to delete item.'); }
  };

  const handleUpdateOrderStatus = async (orderId, orderStatus) => {
    try {
      await fetch(`${API_BASE_URL}/api/canteen/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderStatus })
      });
      fetchCanteenData();
    } catch (err) { console.error(err); }
  };

  const orderStatusColor = (status) => {
    const m = { pending: '#6366f1', preparing: '#f59e0b', ready: '#10b981', delivered: '#10b981', cancelled: '#ef4444' };
    return m[status] || 'var(--text-muted)';
  };

  // 2. Open Add Facility Form
  const triggerAddForm = () => {
    setEditingFacility(null);
    setName('');
    setType('cricket');
    setLocation('');
    setPricePerHour('');
    setDescription('');
    setAmenitiesInput('Floodlights, Parking, Water, Showers');
    setOpenTime('06:00:00');
    setCloseTime('22:00:00');
    setSlotDuration(60);
    setImageInput('https://images.unsplash.com/photo-1544698310-74ea9d1c8258?q=80&w=800&auto=format&fit=crop');
    setFacilityStatus('active');
    
    setErrorMsg('');
    setSuccessMsg('');
    setIsAddMode(true);
  };

  // 3. Open Edit Facility Form
  const triggerEditForm = (facility) => {
    setEditingFacility(facility);
    setName(facility.name);
    setType(facility.type);
    setLocation(facility.location);
    setPricePerHour(facility.price_per_hour);
    setDescription(facility.description || '');
    setAmenitiesInput(facility.amenities ? facility.amenities.join(', ') : '');
    setOpenTime(facility.open_time);
    setCloseTime(facility.close_time);
    setSlotDuration(facility.slot_duration);
    setImageInput(facility.images?.[0] || '');
    setFacilityStatus(facility.status || 'active');

    setErrorMsg('');
    setSuccessMsg('');
    setIsAddMode(false);
  };

  // 4. Save/Update Facility
  const handleSaveFacility = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const amenitiesArray = amenitiesInput.split(',').map(s => s.trim()).filter(Boolean);
    const imagesArray = imageInput ? [imageInput.trim()] : [];

    const payload = {
      name,
      type,
      location,
      pricePerHour: parseFloat(pricePerHour),
      description,
      amenities: amenitiesArray,
      openTime,
      closeTime,
      slotDuration: parseInt(slotDuration, 10),
      images: imagesArray,
      status: facilityStatus
    };

    try {
      const url = editingFacility 
        ? `${API_BASE_URL}/api/facilities/${editingFacility.id}` 
        : API_BASE_URL + '/api/facilities';
        
      const method = editingFacility ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Operation failed.');
      }

      setSuccessMsg(editingFacility ? 'Facility details updated!' : 'New facility created!');
      setIsAddMode(false);
      setEditingFacility(null);
      fetchData(); // reload lists

    } catch (err) {
      setErrorMsg(err.message || 'Server error saving facility.');
    } finally {
      setFormLoading(false);
    }
  };

  // 5. Delete Facility Action
  const triggerDeleteConfirm = (facility) => {
    setFacilityToDelete(facility);
    setDeleteModalOpen(true);
  };

  const handleDeleteFacility = async () => {
    if (!facilityToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/facilities/${facilityToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setDeleteModalOpen(false);
        setFacilityToDelete(null);
        fetchData();
      } else {
        const data = await res.json();
        setErrorMsg(data.message || 'Could not delete facility.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error communicating with database.');
    }
  };

  // 6. Admin Cancel Booking
  const triggerCancelConfirm = (booking) => {
    setBookingToCancel(booking);
    setCancelModalOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingToCancel.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setCancelModalOpen(false);
        setBookingToCancel(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ marginTop: '20px' }}>
      
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Control panels for facilities catalog and player reservations.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-primary" 
            onClick={triggerAddForm}
            style={{ padding: '10px 18px', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            Add New Facility
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* S1: Facilities count */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Facilities</span>
            <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalFacilities}</p>
          </div>
        </div>
        {/* S2: Bookings count */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
            <CalendarDays size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Bookings</span>
            <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.totalBookings}</p>
          </div>
        </div>
        {/* S3: Total Revenue */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Revenue</span>
            <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>₹{stats.totalRevenue.toFixed(0)}</p>
          </div>
        </div>
        {/* S4: Customers count */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Players</span>
            <p style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.activeUsers}</p>
          </div>
        </div>
      </section>

      {/* Main Layout Block */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px'
      }} className="admin-layout">
        
        {/* If Add / Edit form open, show form, else show listing tables */}
        {(isAddMode || editingFacility) ? (
          <div className="glass-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} style={{ color: 'var(--primary)' }} />
                {editingFacility ? `Edit Facility: ${editingFacility.name}` : 'Add New Sports Facility'}
              </h2>
              <button 
                onClick={() => { setIsAddMode(false); setEditingFacility(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <div className="badge-danger" style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '20px' }}>
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveFacility} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px'
            }} className="admin-form">
              <div className="form-group">
                <label className="form-label">Facility Name</label>
                <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lords Cricket Arena" required />
              </div>

              <div className="form-group">
                <label className="form-label">Sports Type Category</label>
                <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="cricket">Cricket Ground</option>
                  <option value="tennis">Tennis Court</option>
                  <option value="pickleball">Pickleball Arena</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Location Address</label>
                <input type="text" className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. London" required />
              </div>

              <div className="form-group">
                <label className="form-label">Price per Hour (₹)</label>
                <input type="number" className="form-input" value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} placeholder="1200" required />
              </div>

              <div className="form-group">
                <label className="form-label">Opening Time (HH:MM:SS)</label>
                <input type="text" className="form-input" value={openTime} onChange={(e) => setOpenTime(e.target.value)} placeholder="06:00:00" required />
              </div>

              <div className="form-group">
                <label className="form-label">Closing Time (HH:MM:SS)</label>
                <input type="text" className="form-input" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} placeholder="22:00:00" required />
              </div>

              <div className="form-group">
                <label className="form-label">Default Slot Duration (Minutes)</label>
                <input type="number" className="form-input" value={slotDuration} onChange={(e) => setSlotDuration(parseInt(e.target.value))} placeholder="60" required />
              </div>

              <div className="form-group">
                <label className="form-label">Thumbnail Image URL</label>
                <input type="text" className="form-input" value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="https://unsplash.com/..." />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Amenities (Comma separated list)</label>
                <input type="text" className="form-input" value={amenitiesInput} onChange={(e) => setAmenitiesInput(e.target.value)} placeholder="Floodlights, Parking, Changing Room, Showers" />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Short Description</label>
                <textarea 
                  className="form-input" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide specifications of the pitch, grass type, etc." 
                  rows={4}
                  style={{ resize: 'none' }}
                />
              </div>

              {editingFacility && (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Facility Status</label>
                  <select className="form-input" value={facilityStatus} onChange={(e) => setFacilityStatus(e.target.value)}>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              )}

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsAddMode(false); setEditingFacility(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : 'Save Facility Details'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            {/* Global Filters Panel */}
            <div className="glass-card animate-fade-in" style={{ padding: '20px', marginBottom: '24px', border: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <Settings size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Admin Dashboard Filters</span>
              </div>
              <div className="admin-filters-grid">
                {/* Search */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Global Search</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search ID, User, Venue..."
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '10px' }}
                  />
                </div>

                {/* Location Filter */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>City/Location</label>
                  <select
                    className="form-input"
                    value={filterLocation}
                    onChange={e => { setFilterLocation(e.target.value); setBookingsPage(1); setOrdersPage(1); }}
                    style={{ fontSize: '0.85rem', padding: '10px', background: 'var(--bg-surface)' }}
                  >
                    <option value="all">All Cities</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Rajkot">Rajkot</option>
                    <option value="Surat">Surat</option>
                    <option value="Vadodara">Vadodara</option>
                    <option value="Jamnagar">Jamnagar</option>
                    <option value="Bhavnagar">Bhavnagar</option>
                  </select>
                </div>

                {/* Status Filter */}
                {activeTab === 'bookings' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Booking Status</label>
                    <select
                      className="form-input"
                      value={filterBookingStatus}
                      onChange={e => { setFilterBookingStatus(e.target.value); setBookingsPage(1); }}
                      style={{ fontSize: '0.85rem', padding: '10px', background: 'var(--bg-surface)' }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                {activeTab === 'food-orders' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Order Status</label>
                    <select
                      className="form-input"
                      value={filterOrderStatus}
                      onChange={e => { setFilterOrderStatus(e.target.value); setOrdersPage(1); }}
                      style={{ fontSize: '0.85rem', padding: '10px', background: 'var(--bg-surface)' }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Order Placed</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                {/* Payment Status Filter (Visible for Canteen tab) */}
                {activeTab === 'food-orders' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Payment Status</label>
                    <select
                      className="form-input"
                      value={filterPaymentStatus}
                      onChange={e => { setFilterPaymentStatus(e.target.value); setOrdersPage(1); }}
                      style={{ fontSize: '0.85rem', padding: '10px', background: 'var(--bg-surface)' }}
                    >
                      <option value="all">All Payments</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                )}

                {/* Date Filter */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>Filter Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={filterDate}
                    onChange={e => { setFilterDate(e.target.value); setBookingsPage(1); setOrdersPage(1); }}
                    style={{ fontSize: '0.85rem', padding: '9px 10px' }}
                  />
                </div>

                {/* Reset Button */}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetFilters}
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', height: '40px' }}
                >
                  <X size={14} /> Reset
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="admin-tabs-scroll">
              <button 
                onClick={() => setActiveTab('facilities')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'facilities' ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderBottom: activeTab === 'facilities' ? '2px solid var(--primary)' : 'none',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Manage Facilities ({facilities.length})
              </button>
              <button 
                onClick={() => setActiveTab('bookings')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderBottom: activeTab === 'bookings' ? '2px solid var(--primary)' : 'none',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Manage Bookings ({stats.totalBookings})
              </button>
              <button 
                onClick={() => setActiveTab('canteen')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'canteen' ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderBottom: activeTab === 'canteen' ? '2px solid var(--primary)' : 'none',
                  transition: 'var(--transition-smooth)'
                }}
              >
                🍔 Canteen Menu ({foodItems.length})
              </button>
              <button 
                onClick={() => setActiveTab('food-orders')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === 'food-orders' ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderBottom: activeTab === 'food-orders' ? '2px solid var(--primary)' : 'none',
                  transition: 'var(--transition-smooth)'
                }}
              >
                📋 Food Orders
              </button>
            </div>

            {/* TAB 1: Facilities List */}
            {activeTab === 'facilities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {facilities.map((f) => (
                  <div key={f.id} className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', border: '1px solid var(--card-border)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{f.name}</h3>
                        <span className={`badge ${f.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {f.status}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                        📍 {f.location} | 🏷️ {f.type.replace('_', ' ')}
                      </p>
                      <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 700, marginTop: '4px' }}>
                        ₹{f.price_per_hour}/hr (Slot: {f.slot_duration}m)
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => triggerEditForm(f)}
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => triggerDeleteConfirm(f)}
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: Bookings List */}
            {activeTab === 'bookings' && (
              <div className="glass-card" style={{ overflowX: 'auto', border: '1px solid var(--card-border)', padding: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '12px' }}>ID</th>
                      <th style={{ padding: '12px' }}>Player Details</th>
                      <th style={{ padding: '12px' }}>Facility</th>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Time Slot</th>
                      <th style={{ padding: '12px' }}>Price</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '0.9rem' }}>
                    {bookings.map((b) => {
                      const bDate = new Date(b.date);
                      const bDateStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, '0')}-${String(bDate.getDate()).padStart(2, '0')}`;
                      return (
                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>#{b.id}</td>
                          <td style={{ padding: '12px' }}>
                            <div>{b.user_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>{b.user_email}</div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 500 }}>{b.facility_name}</td>
                          <td style={{ padding: '12px' }}>{bDateStr}</td>
                          <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 600 }}>{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>₹{parseFloat(b.total_price).toFixed(0)}</td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : 'badge-danger'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {b.status === 'confirmed' && (
                              <button 
                                onClick={() => triggerCancelConfirm(b)}
                                className="btn btn-danger"
                                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Showing Page {bookingsPage} of {bookingsTotalPages}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      disabled={bookingsPage <= 1}
                      onClick={() => setBookingsPage(prev => Math.max(prev - 1, 1))}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={bookingsPage >= bookingsTotalPages}
                      onClick={() => setBookingsPage(prev => Math.min(prev + 1, bookingsTotalPages))}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Canteen Menu Management */}
            {activeTab === 'canteen' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: 700 }}>Food Items Management</h3>
                  <button className="btn btn-primary" onClick={() => openFoodItemForm()} style={{ padding: '8px 18px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={15} /> Add Item
                  </button>
                </div>
                {foodMsg && <div style={{ padding: '10px', marginBottom: '14px', borderRadius: '8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--primary)', fontSize: '0.85rem' }}>{foodMsg}</div>}

                {/* Add/Edit Form */}
                {foodItemForm !== null && (
                  <div className="glass-card" style={{ padding: '24px', marginBottom: '20px', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h4 style={{ fontWeight: 700 }}>{foodItemForm?.id ? 'Edit Food Item' : 'Add New Food Item'}</h4>
                      <button onClick={() => setFoodItemForm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSaveFoodItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Item Name *</label>
                        <input className="form-input" value={fName} onChange={e => setFName(e.target.value)} placeholder="e.g. Veg Burger" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Price (₹) *</label>
                        <input className="form-input" type="number" step="0.01" value={fPrice} onChange={e => setFPrice(e.target.value)} placeholder="120" required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                        <label className="form-label">Description</label>
                        <input className="form-input" value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Short description..." />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Category</label>
                        <select className="form-input" value={fCategoryId} onChange={e => setFCategoryId(e.target.value)}>
                          <option value="">-- Select Category --</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Image URL</label>
                        <input className="form-input" value={fImageUrl} onChange={e => setFImageUrl(e.target.value)} placeholder="https://..." />
                      </div>
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', gridColumn: '1 / -1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                          <input type="checkbox" checked={fIsVeg} onChange={e => setFIsVeg(e.target.checked)} /> 🌿 Vegetarian
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                          <input type="checkbox" checked={fIsAvailable} onChange={e => setFIsAvailable(e.target.checked)} /> ✅ Available
                        </label>
                      </div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px' }}>
                        <button type="submit" className="btn btn-primary" disabled={foodFormLoading} style={{ padding: '10px 24px' }}>
                          {foodFormLoading ? 'Saving...' : (foodItemForm?.id ? 'Update Item' : 'Add Item')}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setFoodItemForm(null)} style={{ padding: '10px 18px' }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Items Table */}
                <div className="glass-card" style={{ overflowX: 'auto', border: '1px solid var(--card-border)', padding: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '10px' }}>ID</th>
                        <th style={{ padding: '10px' }}>Name</th>
                        <th style={{ padding: '10px' }}>Category</th>
                        <th style={{ padding: '10px' }}>Price</th>
                        <th style={{ padding: '10px' }}>Type</th>
                        <th style={{ padding: '10px' }}>Available</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.875rem' }}>
                      {foodItems.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '10px', color: 'var(--text-muted)' }}>#{item.id}</td>
                          <td style={{ padding: '10px', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{item.category_name || '—'}</td>
                          <td style={{ padding: '10px', fontWeight: 700, color: 'var(--primary)' }}>₹{item.price}</td>
                          <td style={{ padding: '10px' }}><span style={{ padding: '3px 10px', borderRadius: '999px', background: item.is_veg ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.is_veg ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>{item.is_veg ? '🌿 Veg' : '🍗 Non-Veg'}</span></td>
                          <td style={{ padding: '10px' }}><span style={{ padding: '3px 10px', borderRadius: '999px', background: item.is_available ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: item.is_available ? '#10b981' : '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>{item.is_available ? 'Yes' : 'No'}</span></td>
                          <td style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-secondary" onClick={() => openFoodItemForm(item)} style={{ padding: '6px 10px', fontSize: '0.75rem' }}><Edit size={13} /></button>
                              <button className="btn btn-danger" onClick={() => handleDeleteFoodItem(item.id)} style={{ padding: '6px 10px', fontSize: '0.75rem' }}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Food Orders */}
            {activeTab === 'food-orders' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontWeight: 700 }}>All Food Orders</h3>
                  <button onClick={fetchCanteenData} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={14} /> Refresh
                  </button>
                </div>
                <div className="glass-card" style={{ overflowX: 'auto', border: '1px solid var(--card-border)', padding: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '10px' }}>Order ID</th>
                        <th style={{ padding: '10px' }}>Customer</th>
                        <th style={{ padding: '10px' }}>Booking & Venue</th>
                        <th style={{ padding: '10px' }}>Ordered Items (Qty)</th>
                        <th style={{ padding: '10px' }}>Total Amount</th>
                        <th style={{ padding: '10px' }}>Delivery</th>
                        <th style={{ padding: '10px' }}>Payment</th>
                        <th style={{ padding: '10px' }}>Order Status</th>
                        <th style={{ padding: '10px' }}>Date & Time (IST)</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.875rem' }}>
                      {foodOrders.map(order => {
                        const items = Array.isArray(order.items) ? order.items : [];
                        const totalQty = items.reduce((acc, it) => acc + (it.qty || 0), 0);
                        
                        const formatDateToISTString = (dateVal) => {
                          if (!dateVal) return '—';
                          const d = new Date(dateVal);
                          if (isNaN(d.getTime())) return '—';
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const day = String(d.getDate()).padStart(2, '0');
                          const hours = String(d.getHours()).padStart(2, '0');
                          const minutes = String(d.getMinutes()).padStart(2, '0');
                          return `${year}-${month}-${day} ${hours}:${minutes}`;
                        };

                        const orderDateStr = formatDateToISTString(order.created_at);

                        return (
                          <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', verticalAlign: 'top' }}>
                            <td style={{ padding: '12px', fontWeight: 700 }}>#{String(order.id).padStart(4,'0')}</td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 600 }}>{order.user_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user_email}</div>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 600 }}>{order.facility_name || 'Canteen'}</div>
                              {order.booking_id && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                                  Booking: #{order.booking_id}
                                </div>
                              )}
                              {order.facility_type && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                                  Sport: {order.facility_type}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {items.map((it, i) => (
                                <div key={i} style={{ fontSize: '0.8rem' }}>
                                  {it.name} × {it.qty}
                                </div>
                              ))}
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', borderTop: '1px dashed var(--border)', paddingTop: '2px' }}>
                                Total Qty: {totalQty}
                              </div>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>₹{parseFloat(order.total_price).toFixed(0)}</td>
                            <td style={{ padding: '12px', fontSize: '0.8rem' }}>{order.delivery_time === 'before' ? '⚡ Before Match' : order.delivery_time === 'during' ? '🎮 During Match' : '🏆 After Match'}</td>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'capitalize', marginBottom: '4px' }}>
                                {order.payment_method}
                              </div>
                              <span style={{ padding: '3px 8px', borderRadius: '999px', background: order.payment_status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: order.payment_status === 'paid' ? '#10b981' : '#f59e0b', fontSize: '0.75rem', fontWeight: 700 }}>
                                {order.payment_status}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <select
                                value={order.order_status}
                                onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: '8px', border: `1px solid ${orderStatusColor(order.order_status)}`, background: 'var(--bg-surface)', color: orderStatusColor(order.order_status), fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                              >
                                {[
                                  { value: 'pending', label: 'Order Placed' },
                                  { value: 'preparing', label: 'Preparing' },
                                  { value: 'ready', label: 'Ready' },
                                  { value: 'delivered', label: 'Delivered' },
                                  { value: 'cancelled', label: 'Cancelled' }
                                ].map(s => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {orderDateStr}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Showing Page {ordersPage} of {ordersTotalPages}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      disabled={ordersPage <= 1}
                      onClick={() => setOrdersPage(prev => Math.max(prev - 1, 1))}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Previous
                    </button>
                    <button
                      className="btn btn-secondary"
                      disabled={ordersPage >= ordersTotalPages}
                      onClick={() => setOrdersPage(prev => Math.min(prev + 1, ordersTotalPages))}
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Facility Delete Modal */}
      <Modal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Facility"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.95rem' }}>
            Are you sure you want to delete the facility <strong>{facilityToDelete?.name}</strong>?
          </p>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--danger)' }}>
            ⚠️ This will permanently remove the facility from the database. All existing reservations and booking logs associated with this venue will also be deleted.
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDeleteFacility}>Delete Facility</button>
          </div>
        </div>
      </Modal>

      {/* Booking Cancel Modal */}
      <Modal 
        isOpen={cancelModalOpen} 
        onClose={() => setCancelModalOpen(false)}
        title="Administrative Booking Cancellation"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.95rem' }}>
            Are you sure you want to cancel booking <strong>#{bookingToCancel?.id}</strong> for player <strong>{bookingToCancel?.user_name}</strong>?
          </p>
          <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--danger)' }}>
            ⚠️ Canceling this booking on behalf of the customer is immediate. The slot timing will be freed up for others.
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'end', marginTop: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setCancelModalOpen(false)}>Keep Booking</button>
            <button className="btn btn-danger" onClick={handleCancelBooking}>Cancel Booking</button>
          </div>
        </div>
      </Modal>

      <style>{`
        .admin-form {
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .admin-form {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
