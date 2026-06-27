import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { 
  Building2, CalendarDays, DollarSign, Users, Plus, 
  Trash2, Edit, X, ShieldAlert, Check, Settings, Trash 
} from 'lucide-react';

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

  // 1. Fetch data
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Fetch facilities
      const facRes = await fetch('http://localhost:5000/api/facilities');
      let facData = [];
      if (facRes.ok) {
        facData = await facRes.json();
        setFacilities(facData);
      }

      // Fetch bookings
      const bookRes = await fetch('http://localhost:5000/api/bookings/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let bookData = [];
      if (bookRes.ok) {
        bookData = await bookRes.json();
        setBookings(bookData);
      }

      // Compute Stats
      const totalRev = bookData.reduce((sum, b) => b.status === 'confirmed' ? sum + parseFloat(b.total_price) : sum, 0);
      const uniqueUsers = new Set(bookData.map(b => b.user_id)).size;

      setStats({
        totalFacilities: facData.length,
        totalBookings: bookData.length,
        totalRevenue: totalRev,
        activeUsers: uniqueUsers
      });

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load administrative details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

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
        ? `http://localhost:5000/api/facilities/${editingFacility.id}` 
        : 'http://localhost:5000/api/facilities';
        
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
      const res = await fetch(`http://localhost:5000/api/facilities/${facilityToDelete.id}`, {
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
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingToCancel.id}/cancel`, {
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
            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--card-border)', paddingBottom: '12px' }}>
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
                Manage Bookings ({bookings.length})
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
                      const bDateStr = new Date(b.date).toISOString().split('T')[0];
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
