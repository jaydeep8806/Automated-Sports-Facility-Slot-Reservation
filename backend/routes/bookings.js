import express from 'express';
import { query } from '../db.js';
import { auth, admin } from '../middleware/auth.js';
import { sendBookingConfirmationEmail } from '../utils/email.js';

const router = express.Router();

// Helper: Convert time string "HH:MM:SS" or "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
};

// Helper: Format date to local YYYY-MM-DD
const formatToYYYYMMDD = (d) => {
  const dateObj = new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @route   POST /api/bookings
// @desc    Create a new slot booking (guarded, checks overlap conflicts)
// @access  Private
router.post('/', auth, async (req, res) => {
  const { facilityId, date, startTime, endTime, totalPrice, slots } = req.body;
  const userId = req.user.id;

  if (!facilityId || !date || (!slots && (!startTime || !endTime)) || !totalPrice) {
    return res.status(400).json({ message: 'All booking parameters are required.' });
  }

  try {
    // 1. Verify facility exists and is active
    const facRes = await query('SELECT * FROM facilities WHERE id = $1 AND status = \'active\'', [facilityId]);
    if (facRes.rows.length === 0) {
      return res.status(404).json({ message: 'Facility not found or currently unavailable.' });
    }

    // 2. Prevent booking slots in the past
    const todayStr = formatToYYYYMMDD(new Date());
    if (date < todayStr) {
      return res.status(400).json({ message: 'Cannot book slots on a past date.' });
    }

    // Normalize slots to an array of objects
    const slotsToBook = slots && Array.isArray(slots)
      ? slots
      : [{ startTime, endTime, price: parseFloat(totalPrice) }];

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Check all slots first for past time and double bookings
    for (const slot of slotsToBook) {
      if (date === todayStr) {
        const startMinutes = timeToMinutes(slot.startTime);
        if (startMinutes <= currentMinutes) {
          return res.status(400).json({ message: `Cannot book slot (${slot.startTime} - ${slot.endTime}) that has already started or passed.` });
        }
      }

      // Check double bookings
      const conflictRes = await query(
        `SELECT * FROM bookings 
         WHERE facility_id = $1 
           AND date = $2 
           AND status = 'confirmed' 
           AND (start_time < $4 AND end_time > $3)`,
        [facilityId, date, slot.startTime, slot.endTime]
      );

      if (conflictRes.rows.length > 0) {
        return res.status(400).json({ 
          message: `Slot (${slot.startTime} - ${slot.endTime}) has already been reserved by another user. Please choose another time.` 
        });
      }
    }

    // Insert all bookings
    const insertedBookings = [];
    for (const slot of slotsToBook) {
      const insertRes = await query(
        `INSERT INTO bookings (facility_id, user_id, date, start_time, end_time, total_price, status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmed') 
         RETURNING *`,
        [facilityId, userId, date, slot.startTime, slot.endTime, parseFloat(slot.price)]
      );
      insertedBookings.push(insertRes.rows[0]);
    }

    // Send email confirmation asynchronously
    sendBookingConfirmationEmail(req.user.email, {
      userName: req.user.name,
      bookingIds: insertedBookings.map(b => b.id),
      sportName: facRes.rows[0].type,
      venueName: facRes.rows[0].name,
      venueLocation: facRes.rows[0].location,
      date: date,
      slots: slotsToBook,
      totalPrice: parseFloat(totalPrice),
    }).catch(err => {
      console.error('Failed to send booking confirmation email:', err);
    });

    res.status(201).json({
      message: 'Booking completed successfully!',
      bookings: insertedBookings,
      booking: insertedBookings[0] // for backwards compatibility
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Server error processing slot reservation.' });
  }
});

// @route   GET /api/bookings/my-bookings
// @desc    Get booking history of the logged-in user
// @access  Private
router.get('/my-bookings', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT b.*, f.name AS facility_name, f.location AS facility_location, f.type AS facility_type 
       FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       WHERE b.user_id = $1
       ORDER BY b.date DESC, b.start_time DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch user bookings error:', err);
    res.status(500).json({ message: 'Server error fetching booking history.' });
  }
});

// @route   GET /api/bookings/all
// @desc    Get all bookings (Admin only)
// @access  Private/Admin
router.get('/all', auth, admin, async (req, res) => {
  try {
    const { location, search, status, date, page = 1, limit = 10 } = req.query;

    let queryText = `
      SELECT b.*, f.name AS facility_name, f.location AS facility_location, u.name AS user_name, u.email AS user_email 
      FROM bookings b
      JOIN facilities f ON b.facility_id = f.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (location && location !== 'all') {
      queryParams.push(`%${location}%`);
      queryText += ` AND f.location ILIKE $${queryParams.length}`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (u.name ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length} OR f.name ILIKE $${queryParams.length} OR CAST(b.id AS TEXT) ILIKE $${queryParams.length})`;
    }

    if (status && status !== 'all') {
      queryParams.push(status);
      queryText += ` AND b.status = $${queryParams.length}`;
    }

    if (date) {
      queryParams.push(date);
      queryText += ` AND b.date = $${queryParams.length}`;
    }

    // Get total count for pagination before appending limit and offset
    const countRes = await query(
      `SELECT COUNT(*) FROM (${queryText}) AS total`,
      queryParams
    );
    const totalCount = parseInt(countRes.rows[0].count, 10);

    queryText += ` ORDER BY b.date DESC, b.start_time DESC`;

    if (limit && limit !== 'all') {
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10);
      const offset = (parsedPage - 1) * parsedLimit;

      queryParams.push(parsedLimit);
      queryText += ` LIMIT $${queryParams.length}`;
      queryParams.push(offset);
      queryText += ` OFFSET $${queryParams.length}`;
    }

    const result = await query(queryText, queryParams);

    // Compute stats on the complete dataset (independent of pagination and active filters)
    const statsRes = await query(
      `SELECT 
         COUNT(*) as total_bookings,
         COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_price ELSE 0 END), 0) as total_revenue,
         COUNT(DISTINCT user_id) as active_users
       FROM bookings`
    );
    const globalStats = statsRes.rows[0];

    res.json({
      data: result.rows,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: limit === 'all' ? totalCount : parseInt(limit, 10),
        pages: limit === 'all' ? 1 : Math.ceil(totalCount / parseInt(limit, 10))
      },
      stats: {
        totalBookings: parseInt(globalStats.total_bookings, 10),
        totalRevenue: parseFloat(globalStats.total_revenue),
        activeUsers: parseInt(globalStats.active_users, 10)
      }
    });
  } catch (err) {
    console.error('Fetch all bookings error:', err);
    res.status(500).json({ message: 'Server error fetching bookings list.' });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // 1. Fetch booking details
    const bookingRes = await query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];

    // 2. Authorization Check (User owns booking, or is admin)
    if (booking.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking.' });
    }

    // 3. Validation: Cannot cancel already cancelled booking
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    // 4. Time Check: Cannot cancel past bookings (Only restrict users, allow admins to override if needed)
    if (userRole !== 'admin') {
      const todayStr = formatToYYYYMMDD(new Date());
      const bookingDateStr = formatToYYYYMMDD(new Date(booking.date));

      if (bookingDateStr < todayStr) {
        return res.status(400).json({ message: 'Cannot cancel reservations for past dates.' });
      }

      if (bookingDateStr === todayStr) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = timeToMinutes(booking.start_time);
        
        if (startMinutes <= currentMinutes) {
          return res.status(400).json({ message: 'Cannot cancel bookings that have already started or passed.' });
        }
      }
    }

    // 5. Update Status
    const updateRes = await query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [id]
    );

    // Cancel associated food orders if they are still in 'pending' status
    const foodOrdersRes = await query(
      'SELECT id, order_status FROM food_orders WHERE booking_id = $1',
      [id]
    );

    let cancelledFoodOrdersCount = 0;
    let keptActiveFoodOrdersCount = 0;

    for (const order of foodOrdersRes.rows) {
      if (order.order_status === 'pending') {
        await query("UPDATE food_orders SET order_status = 'cancelled' WHERE id = $1", [order.id]);
        cancelledFoodOrdersCount++;
      } else if (order.order_status !== 'cancelled') {
        keptActiveFoodOrdersCount++;
      }
    }

    res.json({
      message: 'Booking cancelled successfully.',
      booking: updateRes.rows[0],
      foodOrdersCancelled: cancelledFoodOrdersCount,
      foodOrdersKeptActive: keptActiveFoodOrdersCount
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ message: 'Server error cancelling booking.' });
  }
});

export default router;
