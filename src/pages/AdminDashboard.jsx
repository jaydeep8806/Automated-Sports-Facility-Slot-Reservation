import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { 
  Building2, CalendarDays, DollarSign, Users, Plus, 
  Trash2, Edit, X, ShieldAlert, Check, Settings, Trash, UtensilsCrossed, RefreshCw
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


export const AdminDashboard = () => {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Core Data
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // India Standard Time (Asia/Kolkata) helpers
  const getISTNow = () => {
    const now = new Date();
    return new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + 5.5 * 3600 * 1000);
  };

  const getISTTodayStr = () => {
    const ist = getISTNow();
    return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
  };

  const getISTCurrentMinutes = () => {
    const ist = getISTNow();
    return ist.getHours() * 60 + ist.getMinutes();
  };

  const timeToMinutes = (tStr) => {
    if (!tStr) return 0;
    const parts = tStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) || 0;
    if (h === 24) return 1440;
    return h * 60 + m;
  };

  // Users Management States
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [filterUserStatus, setFilterUserStatus] = useState('all');
  const [userMsg, setUserMsg] = useState('');

  // User Action Modals
  const [viewUserModal, setViewUserModal] = useState(null);
  const [editUserModal, setEditUserModal] = useState(null);
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [deleteUserStep, setDeleteUserStep] = useState(1);
  const [blockUserModal, setBlockUserModal] = useState(null);

  // Edit User Form State
  const [editUserName, setEditUserName] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserRole, setEditUserRole] = useState('user');
  const [editUserAccountStatus, setEditUserAccountStatus] = useState('Active');
  const [editUserLoading, setEditUserLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalFacilities: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0
  });

  // UI Management tabs
  const [activeTab, setActiveTab] = useState(tabParam || 'facilities');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    } else {
      setActiveTab('facilities');
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(prev => {
      const nextParams = new URLSearchParams(prev);
      if (newTab === 'facilities') {
        nextParams.delete('tab');
      } else {
        nextParams.set('tab', newTab);
      }
      return nextParams;
    });
  };
  
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

  // (no debounce — search filter only fires on button click or Enter)

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
  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
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
      if (!isSilent) setErrorMsg('Failed to load administrative details.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchCanteenData = async (isSilent = false) => {
    if (!isSilent) setCanteenLoading(true);
    try {
      const ordersUrl = new URL(API_BASE_URL + '/api/canteen/orders/all');
      ordersUrl.searchParams.append('location', filterLocation);
      ordersUrl.searchParams.append('search', filterSearch);
      ordersUrl.searchParams.append('orderStatus', filterOrderStatus);
      ordersUrl.searchParams.append('paymentStatus', filterPaymentStatus);
      ordersUrl.searchParams.append('date', filterDate);
      ordersUrl.searchParams.append('page', ordersPage);
      ordersUrl.searchParams.append('limit', ordersLimit);

      const [itemsRes, ordersRes, catsRes] = await Promise.allSettled([
        fetch(API_BASE_URL + '/api/canteen/admin/items', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(ordersUrl.toString(), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(API_BASE_URL + '/api/canteen/categories')
      ]);

      if (itemsRes.status === 'fulfilled' && itemsRes.value.ok) {
        const itemsData = await itemsRes.value.json();
        setFoodItems(itemsData || []);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const ordersData = await ordersRes.value.json();
        setFoodOrders(ordersData.data || []);
        setOrdersTotalPages(ordersData.pagination?.pages || 1);
      }
      if (catsRes.status === 'fulfilled' && catsRes.value.ok) {
        const catsData = await catsRes.value.json();
        setCategories(catsData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setCanteenLoading(false);
    }
  };

  const fetchUsersData = async (isSilent = false) => {
    if (!isSilent) setUsersLoading(true);
    try {
      const userUrl = new URL(API_BASE_URL + '/api/users/all');
      if (filterSearch) userUrl.searchParams.append('search', filterSearch);
      if (filterUserStatus !== 'all') userUrl.searchParams.append('status', filterUserStatus);
      if (filterDate) userUrl.searchParams.append('date', filterDate);

      const res = await fetch(userUrl.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
        setTotalUsersCount(data.totalUsers || 0);
      }
    } catch (err) {
      console.error(err);
      if (!isSilent) setErrorMsg('Failed to load user management details.');
    } finally {
      if (!isSilent) setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    if (activeTab === 'users') {
      fetchUsersData(false);
    } else if (activeTab === 'canteen' || activeTab === 'food-orders') {
      fetchCanteenData(false);
      fetchData(true);
    } else {
      fetchData(false);
      fetchCanteenData(true); // Pre-fetch canteen items and orders so menu and orders are instantly available
    }

    // Auto-polling interval every 6 seconds for silent background real-time live synchronization
    const liveInterval = setInterval(() => {
      if (activeTab === 'users') {
        fetchUsersData(true);
      } else if (activeTab === 'canteen' || activeTab === 'food-orders') {
        fetchCanteenData(true);
        fetchData(true);
      } else {
        fetchData(true);
        fetchCanteenData(true);
      }
    }, 6000);

    return () => clearInterval(liveInterval);
  }, [token, activeTab, filterLocation, filterSearch, filterBookingStatus, filterOrderStatus, filterPaymentStatus, filterUserStatus, filterDate, bookingsPage, bookingsLimit, ordersPage, ordersLimit]);

  const triggerEditUser = (user) => {
    setEditUserModal(user);
    setEditUserName(user.name || '');
    setEditUserPhone(user.phone || '');
    setEditUserRole(user.role || 'user');
    setEditUserAccountStatus(user.account_status || 'Active');
    setTimeout(() => {
      window.scrollTo({ top: 150, behavior: 'smooth' });
    }, 50);
  };

  const triggerBlockUser = (user) => {
    setBlockUserModal(user);
  };

  const triggerDeleteUser = (user) => {
    setDeleteUserModal(user);
    setDeleteUserStep(1);
  };

  const handleSaveUserEdit = async (e) => {
    e.preventDefault();
    if (!editUserModal) return;
    setEditUserLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${editUserModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editUserName,
          phone: editUserPhone,
          role: editUserRole,
          account_status: editUserAccountStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUserMsg('User credentials and status updated successfully! 🎉');
      setEditUserModal(null);
      fetchUsersData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update user.');
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!blockUserModal) return;
    const user = blockUserModal;
    const nextStatus = user.account_status === 'Blocked' ? 'Active' : 'Blocked';
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ account_status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUserMsg(`User ${user.name} account status changed to ${nextStatus}.`);
      setBlockUserModal(null);
      fetchUsersData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change user status.');
    }
  };

  const handleDeleteUserConfirm = async () => {
    if (!deleteUserModal) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${deleteUserModal.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUserMsg(`User ${deleteUserModal.name} permanently deleted from database.`);
      setDeleteUserModal(null);
      setDeleteUserStep(1);
      fetchUsersData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete user.');
    }
  };

  const handleApplySearch = () => {
    setFilterSearch(searchVal);
    setBookingsPage(1);
    setOrdersPage(1);
  };

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

  // Helper function to render User Modals
  const renderUserModals = () => (
    <>
      {/* View User Details Modal */}
      <Modal
        isOpen={Boolean(viewUserModal)}
        onClose={() => setViewUserModal(null)}
        title="User Account Details & Security Information"
      >
        {viewUserModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: '#fff', fontWeight: 800, fontSize: '1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {viewUserModal.name ? viewUserModal.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{viewUserModal.name}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{viewUserModal.email}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div><strong>Mobile:</strong> <span style={{ color: 'var(--text-muted)' }}>{viewUserModal.phone || 'N/A'}</span></div>
              <div><strong>User Role:</strong> <span style={{ textTransform: 'capitalize', color: 'var(--primary)', fontWeight: 700 }}>{viewUserModal.role}</span></div>
              <div><strong>Account Status:</strong> <span style={{ color: viewUserModal.account_status === 'Blocked' ? '#ef4444' : '#10b981', fontWeight: 700 }}>{viewUserModal.account_status || 'Active'}</span></div>
              <div><strong>Email Status:</strong> <span style={{ color: 'var(--text-muted)' }}>{viewUserModal.email_status || 'Verified'}</span></div>
              <div><strong>Registration Date:</strong> <span style={{ color: 'var(--text-muted)' }}>{new Date(viewUserModal.created_at).toLocaleString('en-IN')}</span></div>
              <div><strong>Last Login:</strong> <span style={{ color: 'var(--text-muted)' }}>{viewUserModal.last_login ? new Date(viewUserModal.last_login).toLocaleString('en-IN') : 'Never'}</span></div>
              <div><strong>Total Bookings:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{viewUserModal.total_bookings}</span></div>
              <div><strong>Total Food Orders:</strong> <span style={{ color: '#f59e0b', fontWeight: 700 }}>{viewUserModal.total_food_orders}</span></div>
            </div>

            {/* Password Storage Security Info */}
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                🔐 Password Storage (Hashed Value Only — Never Plain Text)
              </label>
              <div style={{
                background: 'var(--bg-surface)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                wordBreak: 'break-all',
                color: 'var(--primary)'
              }}>
                {viewUserModal.password}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setViewUserModal(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={Boolean(editUserModal)}
        onClose={() => setEditUserModal(null)}
        title={`Edit User: ${editUserModal?.name}`}
      >
        {editUserModal && (
          <form onSubmit={handleSaveUserEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={editUserName}
                onChange={e => setEditUserName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-input"
                value={editUserPhone}
                onChange={e => setEditUserPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">User Role</label>
              <select
                className="form-input"
                value={editUserRole}
                onChange={e => setEditUserRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select
                className="form-input"
                value={editUserAccountStatus}
                onChange={e => setEditUserAccountStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditUserModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={editUserLoading}>
                {editUserLoading ? 'Saving...' : 'Save User Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Block/Unblock Confirmation Modal */}
      <Modal
        isOpen={Boolean(blockUserModal)}
        onClose={() => setBlockUserModal(null)}
        title="🚫 Confirm Account Status Change"
      >
        {blockUserModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              Are you sure you want to change account status for <strong>{blockUserModal.name}</strong> ({blockUserModal.email}) to 
              <strong style={{ color: blockUserModal.account_status === 'Blocked' ? '#10b981' : '#ef4444', marginLeft: '6px' }}>
                {blockUserModal.account_status === 'Blocked' ? 'ACTIVE' : 'BLOCKED'}
              </strong>?
            </p>
            <div style={{
              background: blockUserModal.account_status === 'Blocked' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${blockUserModal.account_status === 'Blocked' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-main)'
            }}>
              {blockUserModal.account_status === 'Blocked'
                ? '🟢 Unblocking will restore full access for this player to log in and reserve slots.'
                : '⚠️ Blocking will immediately restrict this player from logging in or reserving slots.'}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setBlockUserModal(null)}>Cancel</button>
              <button
                className={`btn ${blockUserModal.account_status === 'Blocked' ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleToggleUserStatus}
              >
                {blockUserModal.account_status === 'Blocked' ? 'Confirm Unblock' : 'Confirm Block User'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Modal with 2-Step Repeat Confirmation */}
      <Modal
        isOpen={Boolean(deleteUserModal)}
        onClose={() => { setDeleteUserModal(null); setDeleteUserStep(1); }}
        title={deleteUserStep === 1 ? "⚠️ Confirm User Deletion (Step 1 of 2)" : "🚨 REPEAT CHECK: Final Confirmation (Step 2 of 2)"}
      >
        {deleteUserModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {deleteUserStep === 1 ? (
              <>
                <p style={{ fontSize: '0.95rem', margin: 0 }}>
                  Are you sure you want to delete user account <strong>{deleteUserModal.name}</strong> ({deleteUserModal.email})?
                </p>
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--danger)' }}>
                  ⚠️ Step 1: Deleting a user account will erase all user profile data, active bookings, and food order records.
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button className="btn btn-secondary" onClick={() => setDeleteUserModal(null)}>Cancel</button>
                  <button className="btn btn-danger" onClick={() => setDeleteUserStep(2)}>
                    Proceed to Final Confirmation ➔
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  background: 'rgba(239,68,68,0.12)', border: '2px dashed #ef4444',
                  padding: '16px', borderRadius: '10px', textAlign: 'center'
                }}>
                  <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '4px' }}>🚨</span>
                  <h4 style={{ color: '#ef4444', fontWeight: 800, margin: '0 0 6px' }}>FINAL REPEAT CONFIRMATION</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: 0 }}>
                    Are you 100% sure you want to <strong>PERMANENTLY DELETE</strong> account for <strong>{deleteUserModal.name}</strong>?
                  </p>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                  This action is permanent and cannot be undone under any circumstances.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
                  <button className="btn btn-secondary" onClick={() => setDeleteUserStep(1)}>← Back</button>
                  <button className="btn btn-danger" onClick={handleDeleteUserConfirm} style={{ fontWeight: 800, padding: '10px 20px' }}>
                    🔴 YES, PERMANENTLY DELETE NOW
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--card-border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  // Standalone DEDICATED User Management Page when activeTab === 'users'
  if (activeTab === 'users') {
    return (
      <div className="container animate-fade-in" style={{ marginTop: '20px' }}>
        {/* User Management Header */}
        <div className="admin-page-header" style={{ marginBottom: '24px' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={30} style={{ color: 'var(--primary)' }} />
              User Management
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>
              Control panel for viewing, managing, editing, and auditing all registered user accounts.
            </p>
          </div>
          <button 
            className="btn btn-secondary" 
            onClick={fetchUsersData}
            style={{ padding: '9px 16px', fontSize: '0.85rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} /> Refresh Users
          </button>
        </div>

        {/* Total Registered Users Stat Card */}
        <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginBottom: '24px' }}>
          <div className="glass-card admin-stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div className="stat-icon" style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
              <Users size={26} />
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Registered Users</span>
              <p className="stat-value" style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.1, margin: '2px 0 0' }}>{totalUsersCount}</p>
            </div>
          </div>
        </div>

        {/* Search & Filters Panel */}
        <div className="glass-card animate-fade-in" style={{ padding: '18px 20px', marginBottom: '24px', border: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Search & Filters</span>
            </div>
            {(filterSearch || filterUserStatus !== 'all' || filterDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px' }}
              >
                <X size={12} /> Clear Filters
              </button>
            )}
          </div>

          <div className="admin-filters-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Search User</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by Name, Email, Phone..."
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleApplySearch(); }}
                  style={{ fontSize: '0.85rem', padding: '9px 12px', flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplySearch}
                  style={{ padding: '9px 14px', fontSize: '0.82rem', flexShrink: 0 }}
                >
                  🔍 Search
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Status</label>
              <select
                className="form-input"
                value={filterUserStatus}
                onChange={e => setFilterUserStatus(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '9px 12px', background: 'var(--bg-surface)' }}
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active Users</option>
                <option value="Blocked">Blocked Users</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registration Date</label>
              <input
                type="date"
                className="form-input"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px 12px' }}
              />
            </div>
          </div>
        </div>

        {/* User Table & Actions */}
        {userMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
            {userMsg}
          </div>
        )}

        {usersLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" /></div>
        ) : usersList.length === 0 ? (
          <div className="glass-card admin-empty-state" style={{ padding: '50px 20px', textAlign: 'center' }}>
            <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No registered users found matching the selected search criteria or filters.</p>
          </div>
        ) : (
          <div className="glass-card" style={{ overflowX: 'auto', border: '1px solid var(--card-border)', padding: '16px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <th style={{ padding: '10px' }}>User Details</th>
                  <th style={{ padding: '10px' }}>Mobile Number</th>
                  <th style={{ padding: '10px' }}>Role</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Registration Date</th>
                  <th style={{ padding: '10px' }}>Last Login</th>
                  <th style={{ padding: '10px' }}>Activity Log</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.875rem' }}>
                {usersList.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', verticalAlign: 'middle' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                          color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.95rem', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {u.phone || 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px',
                        background: u.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.06)',
                        color: u.role === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
                        fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px',
                        background: u.account_status === 'Blocked' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                        color: u.account_status === 'Blocked' ? '#ef4444' : '#10b981',
                        fontSize: '0.75rem', fontWeight: 700
                      }}>
                        {u.account_status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{u.total_bookings}</span> Bookings &nbsp;·&nbsp; 
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}> {u.total_food_orders}</span> Orders
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => setViewUserModal(u)}
                          title="View User Details & Security Hash"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          👁️ View
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => triggerEditUser(u)}
                          title="Edit User"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          className={`btn ${u.account_status === 'Blocked' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => triggerBlockUser(u)}
                          title={u.account_status === 'Blocked' ? 'Unblock User' : 'Block User'}
                          style={{ padding: '6px 10px', fontSize: '0.78rem', color: u.account_status === 'Blocked' ? undefined : '#ef4444' }}
                        >
                          {u.account_status === 'Blocked' ? '🟢 Unblock' : '🚫 Block'}
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => triggerDeleteUser(u)}
                          title="Delete User"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* View, Edit, Delete Modals */}
        {renderUserModals()}

      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ marginTop: '20px' }}>
      
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.9rem' }}>Control panel for facilities, bookings and canteen orders.</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={triggerAddForm}
          style={{ padding: '10px 18px', fontSize: '0.85rem', flexShrink: 0 }}
        >
          <Plus size={16} />
          Add Facility
        </button>
      </div>

      {/* Metrics Row */}
      <div className="admin-stats-grid">
        <div className="glass-card admin-stat-card">
          <div className="stat-icon" style={{ padding: '11px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
            <Building2 size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Facilities</span>
            <p className="stat-value" style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.1 }}>{stats.totalFacilities}</p>
          </div>
        </div>
        <div className="glass-card admin-stat-card">
          <div className="stat-icon" style={{ padding: '11px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
            <CalendarDays size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bookings</span>
            <p className="stat-value" style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.1 }}>{stats.totalBookings}</p>
          </div>
        </div>
        <div className="glass-card admin-stat-card">
          <div className="stat-icon" style={{ padding: '11px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Revenue</span>
            <p className="stat-value" style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.1 }}>₹{stats.totalRevenue.toFixed(0)}</p>
          </div>
        </div>
        <div className="glass-card admin-stat-card">
          <div className="stat-icon" style={{ padding: '11px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
            <Users size={22} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Players</span>
            <p className="stat-value" style={{ fontSize: '1.65rem', fontWeight: 800, lineHeight: 1.1 }}>{stats.activeUsers}</p>
          </div>
        </div>
      </div>

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
            {(() => {
              const activeFilterCount = [
                filterLocation !== 'all',
                filterSearch !== '',
                filterBookingStatus !== 'all',
                filterOrderStatus !== 'all',
                filterPaymentStatus !== 'all',
                filterDate !== ''
              ].filter(Boolean).length;
              return (
                <div className="glass-card animate-fade-in" style={{ padding: '18px 20px', marginBottom: '20px', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Settings size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>Filters</span>
                      {activeFilterCount > 0 && (
                        <span className="admin-filter-active-badge">{activeFilterCount} active</span>
                      )}
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px' }}
                      >
                        <X size={12} /> Clear all
                      </button>
                    )}
                  </div>
                  <div className="admin-filters-grid">
                    {/* Search — button-triggered only */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Search</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Name, ID, email, venue..."
                          value={searchVal}
                          onChange={e => setSearchVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleApplySearch(); }}
                          style={{ fontSize: '0.85rem', padding: '9px 12px', flex: 1 }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleApplySearch}
                          title="Apply search"
                          style={{ padding: '9px 14px', fontSize: '0.82rem', flexShrink: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                          🔍 Search
                        </button>
                      </div>
                    </div>

                    {/* Location Filter */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>City</label>
                      <select
                        className="form-input"
                        value={filterLocation}
                        onChange={e => { setFilterLocation(e.target.value); setBookingsPage(1); setOrdersPage(1); }}
                        style={{ fontSize: '0.85rem', padding: '9px 12px', background: 'var(--bg-surface)' }}
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

                    {/* Status Filter — conditional on active tab */}
                    {activeTab === 'bookings' ? (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</label>
                        <select
                          className="form-input"
                          value={filterBookingStatus}
                          onChange={e => { setFilterBookingStatus(e.target.value); setBookingsPage(1); }}
                          style={{ fontSize: '0.85rem', padding: '9px 12px', background: 'var(--bg-surface)' }}
                        >
                          <option value="all">All Statuses</option>
                          <option value="confirmed">All Confirmed</option>
                          <option value="done">Done / Completed</option>
                          <option value="active">Active / Upcoming</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    ) : activeTab === 'food-orders' ? (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order Status</label>
                        <select
                          className="form-input"
                          value={filterOrderStatus}
                          onChange={e => { setFilterOrderStatus(e.target.value); setOrdersPage(1); }}
                          style={{ fontSize: '0.85rem', padding: '9px 12px', background: 'var(--bg-surface)' }}
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Placed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    ) : <div />}

                    {/* Payment Status — food orders only */}
                    {activeTab === 'food-orders' ? (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payment</label>
                        <select
                          className="form-input"
                          value={filterPaymentStatus}
                          onChange={e => { setFilterPaymentStatus(e.target.value); setOrdersPage(1); }}
                          style={{ fontSize: '0.85rem', padding: '9px 12px', background: 'var(--bg-surface)' }}
                        >
                          <option value="all">All</option>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                        </select>
                      </div>
                    ) : (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={filterDate}
                          onChange={e => { setFilterDate(e.target.value); setBookingsPage(1); setOrdersPage(1); }}
                          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                        />
                      </div>
                    )}

                    {/* Reset Button */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                      {activeTab === 'food-orders' && (
                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</label>
                          <input
                            type="date"
                            className="form-input"
                            value={filterDate}
                            onChange={e => { setFilterDate(e.target.value); setBookingsPage(1); setOrdersPage(1); }}
                            style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleResetFilters}
                        title="Reset all filters"
                        style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', flexShrink: 0 }}
                      >
                        <X size={13} /> Reset
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Navigation Tabs */}
            <div className="admin-tabs-scroll">
              <button className={`admin-tab-btn${activeTab === 'facilities' ? ' active' : ''}`} onClick={() => handleTabChange('facilities')}>
                🏟️ Facilities
                <span className="admin-tab-badge">{facilities.length}</span>
              </button>
              <button className={`admin-tab-btn${activeTab === 'bookings' ? ' active' : ''}`} onClick={() => handleTabChange('bookings')}>
                📅 Bookings
                <span className="admin-tab-badge">{stats.totalBookings}</span>
              </button>
              <button className={`admin-tab-btn${activeTab === 'canteen' ? ' active' : ''}`} onClick={() => handleTabChange('canteen')}>
                🍔 Menu
                <span className="admin-tab-badge">{foodItems.length}</span>
              </button>
              <button className={`admin-tab-btn${activeTab === 'food-orders' ? ' active' : ''}`} onClick={() => handleTabChange('food-orders')}>
                📋 Orders
                <span className="admin-tab-badge">{foodOrders.length}</span>
              </button>
            </div>

            {/* TAB 1: Facilities List */}
            {activeTab === 'facilities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {facilities.length === 0 ? (
                  <div className="glass-card admin-empty-state">
                    <Building2 size={40} />
                    <p>No facilities found. Click "Add Facility" to create one.</p>
                  </div>
                ) : facilities.map((f) => (
                  <div key={f.id} className="glass-card facility-card" style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '14px', border: '1px solid var(--card-border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{f.name}</h3>
                        <span className={`badge ${f.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                          {f.status}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '3px' }}>
                        📍 {f.location} &nbsp;·&nbsp; 🏷️ {f.type.replace('_', ' ')} &nbsp;·&nbsp; ₹{f.price_per_hour}/hr
                      </p>
                    </div>
                    <div className="facility-card-actions">
                      <button className="btn btn-secondary" onClick={() => triggerEditForm(f)} style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                        <Edit size={14} />
                      </button>
                      <button className="btn btn-danger" onClick={() => triggerDeleteConfirm(f)} style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
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
                {bookings.length === 0 ? (
                  <div className="admin-empty-state">
                    <CalendarDays size={40} />
                    <p>No bookings match your current filters. Try adjusting the search, location, or date.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '720px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '10px 12px' }}>ID</th>
                        <th style={{ padding: '10px 12px' }}>Player</th>
                        <th style={{ padding: '10px 12px' }}>Facility / City</th>
                        <th style={{ padding: '10px 12px' }}>Date</th>
                        <th style={{ padding: '10px 12px' }}>Slot</th>
                        <th style={{ padding: '10px 12px' }}>Price</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                        <th style={{ padding: '10px 12px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: '0.88rem' }}>
                      {bookings.map((b) => {
                        const bDateStr = typeof b.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(b.date)
                          ? b.date.slice(0, 10)
                          : (() => {
                              const d = new Date(b.date);
                              if (isNaN(d.getTime())) return '—';
                              const ist = new Date(d.getTime() + (d.getTimezoneOffset() * 60 * 1000) + 5.5 * 3600 * 1000);
                              return `${ist.getFullYear()}-${String(ist.getMonth() + 1).padStart(2, '0')}-${String(ist.getDate()).padStart(2, '0')}`;
                            })();

                        const todayStr = getISTTodayStr();
                        const currentMinutes = getISTCurrentMinutes();
                        const bStartMin = timeToMinutes(b.start_time);
                        const rawEndMin = timeToMinutes(b.end_time);
                        const bEndMin = (rawEndMin === 0 && (b.end_time.startsWith('00') || b.end_time.startsWith('24'))) || rawEndMin === 1440 || rawEndMin === 1439 ? 1440 : rawEndMin;

                        const isPastDate = bDateStr < todayStr;
                        const isToday = bDateStr === todayStr;
                        const isEndedToday = isToday && bEndMin <= currentMinutes;
                        const isPlayingNow = isToday && bStartMin <= currentMinutes && currentMinutes < bEndMin;
                        const isDone = b.status === 'confirmed' && (isPastDate || isEndedToday);

                        return (
                          <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '11px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>#{b.id}</td>
                            <td style={{ padding: '11px 12px' }}>
                              <div style={{ fontWeight: 600 }}>{b.user_name}</div>
                              <div style={{ fontSize: '0.73rem', color: 'var(--text-dark)' }}>{b.user_email}</div>
                            </td>
                            <td style={{ padding: '11px 12px' }}>
                              <div style={{ fontWeight: 600 }}>{b.facility_name}</div>
                              {b.facility_location && <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>📍 {b.facility_location}</div>}
                            </td>
                            <td style={{ padding: '11px 12px' }}>{bDateStr}</td>
                            <td style={{ padding: '11px 12px', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}</td>
                            <td style={{ padding: '11px 12px', fontWeight: 700 }}>₹{parseFloat(b.total_price).toFixed(0)}</td>
                            <td style={{ padding: '11px 12px' }}>
                              {b.status === 'cancelled' ? (
                                <span className="badge badge-danger">cancelled</span>
                              ) : isDone ? (
                                <span className="badge badge-neutral" style={{ background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-muted)', border: '1px solid rgba(148, 163, 184, 0.25)', fontWeight: 700 }}>
                                  Done
                                </span>
                              ) : isPlayingNow ? (
                                <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', fontWeight: 700 }}>
                                  Active
                                </span>
                              ) : (
                                <span className="badge badge-success">confirmed</span>
                              )}
                            </td>
                            <td style={{ padding: '11px 12px' }}>
                              {b.status === 'confirmed' && !isDone && (
                                <button onClick={() => triggerCancelConfirm(b)} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '0.73rem' }}>Cancel</button>
                              )}
                              {isDone && (
                                <span style={{ color: 'var(--text-dark)', fontSize: '0.8rem' }}>—</span>
                              )}
                              {b.status === 'cancelled' && (
                                <span style={{ color: 'var(--text-dark)', fontSize: '0.8rem' }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                <div className="admin-pagination">
                  <span>Page {bookingsPage} of {bookingsTotalPages} &nbsp;·&nbsp; {bookings.length} results shown</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" disabled={bookingsPage <= 1} onClick={() => setBookingsPage(prev => Math.max(prev - 1, 1))} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>← Prev</button>
                    <button className="btn btn-secondary" disabled={bookingsPage >= bookingsTotalPages} onClick={() => setBookingsPage(prev => Math.min(prev + 1, bookingsTotalPages))} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Next →</button>
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
                {canteenLoading && foodItems.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <div className="spinner" />
                  </div>
                ) : foodItems.length === 0 ? (
                  <div className="glass-card admin-empty-state" style={{ padding: '50px 20px', textAlign: 'center' }}>
                    <UtensilsCrossed size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No food items found in canteen menu. Click "Add Item" above to add snacks & drinks.</p>
                  </div>
                ) : (
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
                )}
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
                {canteenLoading && foodOrders.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <div className="spinner" />
                  </div>
                ) : foodOrders.length === 0 ? (
                  <div className="glass-card admin-empty-state" style={{ padding: '50px 20px', textAlign: 'center' }}>
                    <UtensilsCrossed size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No food orders match your current filters. Try adjusting the search, status, or date.</p>
                  </div>
                ) : (
                  <>
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

                    <div className="admin-pagination">
                      <span>Page {ordersPage} of {ordersTotalPages} &nbsp;·&nbsp; {foodOrders.length} results shown</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" disabled={ordersPage <= 1} onClick={() => setOrdersPage(prev => Math.max(prev - 1, 1))} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>← Prev</button>
                        <button className="btn btn-secondary" disabled={ordersPage >= ordersTotalPages} onClick={() => setOrdersPage(prev => Math.min(prev + 1, ordersTotalPages))} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Next →</button>
                      </div>
                    </div>
                  </>
                )}
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

      {/* Render User Action Modals (View, Edit, Delete) */}
      {renderUserModals()}

    </div>
  );
};
