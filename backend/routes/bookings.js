import express from 'express';
import { query } from '../db.js';
import { auth, admin } from '../middleware/auth.js';
import { sendBookingConfirmationEmail } from '../utils/email.js';

const router = express.Router();

// Helper: Get current IST Date string "YYYY-MM-DD"
const getISTDateStr = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Get current IST minutes from midnight
const getISTMinutes = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
};

// Helper: Convert time string "HH:MM:SS" or "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (hours === 24) return 1440;
  return hours * 60 + minutes;
};

// Helper: Format date to local YYYY-MM-DD
const formatToYYYYMMDD = (d) => {
  if (!d) return '';
  if (typeof d === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  }
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  // Convert through IST offset to guarantee accurate date
  const ist = new Date(dateObj.getTime() + 5.5 * 60 * 60 * 1000);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
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
    const todayStr = getISTDateStr();
    if (date < todayStr) {
      return res.status(400).json({ message: 'Cannot book slots on a past date.' });
    }

    // Normalize slots to an array of objects
    const slotsToBook = slots && Array.isArray(slots)
      ? slots
      : [{ startTime, endTime, price: parseFloat(totalPrice) }];

    const currentMinutes = getISTMinutes();

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
       LEFT JOIN facilities f ON b.facility_id = f.id
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
      LEFT JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN users u ON b.user_id = u.id
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
      const todayStr = getISTDateStr();
      const currentMin = getISTMinutes();
      const currentH = String(Math.floor(currentMin / 60)).padStart(2, '0');
      const currentM = String(currentMin % 60).padStart(2, '0');
      const currentTimeStr = `${currentH}:${currentM}:00`;

      if (status === 'done' || status === 'completed') {
        queryParams.push(todayStr, currentTimeStr);
        queryText += ` AND b.status = 'confirmed' AND (b.date < $${queryParams.length - 1} OR (b.date = $${queryParams.length - 1} AND b.end_time <= $${queryParams.length}))`;
      } else if (status === 'active' || status === 'upcoming') {
        queryParams.push(todayStr, currentTimeStr);
        queryText += ` AND b.status = 'confirmed' AND (b.date > $${queryParams.length - 1} OR (b.date = $${queryParams.length - 1} AND b.end_time > $${queryParams.length}))`;
      } else {
        queryParams.push(status);
        queryText += ` AND b.status = $${queryParams.length}`;
      }
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
      const todayStr = getISTDateStr();
      const bookingDateStr = formatToYYYYMMDD(booking.date);

      if (bookingDateStr < todayStr) {
        return res.status(400).json({ message: 'Cannot cancel reservations for past dates.' });
      }

      if (bookingDateStr === todayStr) {
        const currentMinutes = getISTMinutes();
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

// Helper: Format minutes from midnight to "HH:MM:SS"
const minutesToTime = (totalMinutes) => {
  if (totalMinutes >= 1440) return '23:59:59';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
};

// @route   GET /api/bookings/:id/check-extension
// @desc    Check if an active booking can be extended to upcoming consecutive slot(s)
// @access  Private
router.get('/:id/check-extension', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const bookingRes = await query(
      `SELECT b.*, f.name AS facility_name, f.price_per_hour, f.close_time, f.open_time, f.slot_duration 
       FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];

    // Authorization Check (User owns booking, or is admin)
    if (booking.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to extend this booking.' });
    }

    if (booking.status !== 'confirmed') {
      return res.json({ canExtend: false, reason: 'Booking is not active.' });
    }

    // Time Check (IST Server Time)
    const todayStr = getISTDateStr();
    const bookingDateStr = formatToYYYYMMDD(booking.date);
    const dObj = new Date(booking.date);
    dObj.setDate(dObj.getDate() + 1);
    const nextDayStr = formatToYYYYMMDD(dObj);

    if (bookingDateStr !== todayStr) {
      return res.json({ canExtend: false, reason: 'Extensions are only available for active bookings today.' });
    }

    const currentMinutes = getISTMinutes();
    const startMin = timeToMinutes(booking.start_time);
    const rawEndMin = timeToMinutes(booking.end_time);
    const endMin = (rawEndMin === 0 && (booking.end_time.startsWith('00') || booking.end_time.startsWith('24'))) || rawEndMin === 1440 || rawEndMin === 1439 ? 1440 : rawEndMin;

    // Must be currently playing (start_time <= currentMinutes < end_time)
    if (currentMinutes < startMin || currentMinutes >= endMin) {
      return res.json({ canExtend: false, reason: 'Extensions can only be made while your booking is currently in progress.' });
    }

    // Determine immediately next slot
    const slotDuration = parseInt(booking.slot_duration, 10) || 60;
    let nextSlotDate = bookingDateStr;
    let nextStartMin = endMin;
    let nextEndMin = nextStartMin + slotDuration;

    if (endMin >= 1440) {
      // Midnight crossover into next day
      nextSlotDate = nextDayStr;
      nextStartMin = 0;
      nextEndMin = slotDuration;
    } else {
      const rawCloseMin = timeToMinutes(booking.close_time);
      const closeMin = (rawCloseMin === 1439 || rawCloseMin === 23 * 60 + 59) ? 1440 : rawCloseMin;
      if (nextEndMin > closeMin) {
        return res.json({ canExtend: false, reason: 'Facility is closing. Next slot is unavailable.' });
      }
    }

    const nextStartTimeStr = minutesToTime(nextStartMin);
    const nextEndTimeStr = minutesToTime(nextEndMin);

    // Check overlap with any existing confirmed booking (ignoring 2-hour buffer rule)
    const conflictRes = await query(
      `SELECT * FROM bookings 
       WHERE facility_id = $1 
         AND date = $2 
         AND status = 'confirmed' 
         AND id != $3
         AND (start_time < $5 AND end_time > $4)`,
      [booking.facility_id, nextSlotDate, booking.id, nextStartTimeStr, nextEndTimeStr]
    );

    if (conflictRes.rows.length > 0) {
      return res.json({ canExtend: false, reason: 'The next consecutive slot is already booked.' });
    }

    const price = parseFloat(booking.price_per_hour);

    return res.json({
      canExtend: true,
      booking: {
        id: booking.id,
        facilityId: booking.facility_id,
        facilityName: booking.facility_name,
        date: bookingDateStr,
        startTime: booking.start_time.slice(0, 5),
        endTime: booking.end_time.slice(0, 5),
        pricePerHour: price
      },
      nextSlot: {
        date: nextSlotDate,
        startTime: nextStartTimeStr.slice(0, 5),
        endTime: nextEndTimeStr.slice(0, 5),
        price: price
      }
    });

  } catch (err) {
    console.error('Check extension error:', err);
    res.status(500).json({ message: 'Server error checking extension status.' });
  }
});

// @route   POST /api/bookings/:id/extend
// @desc    Extend an active booking with one or multiple consecutive slots (supports midnight crossover)
// @access  Private
router.post('/:id/extend', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  const { slots, additionalPrice, startTime, endTime, date } = req.body;

  try {
    const bookingRes = await query(
      `SELECT b.*, f.name AS facility_name, f.location AS facility_location, f.type AS facility_type, f.price_per_hour, f.close_time, f.open_time, f.slot_duration 
       FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];

    if (booking.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to extend this booking.' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking is not active.' });
    }

    const todayStr = getISTDateStr();
    const bookingDateStr = formatToYYYYMMDD(booking.date);

    if (bookingDateStr !== todayStr) {
      return res.status(400).json({ message: 'Extensions are only available for current active bookings today.' });
    }

    const rawEndMin = timeToMinutes(booking.end_time);
    const endMin = (rawEndMin === 0 && (booking.end_time.startsWith('00') || booking.end_time.startsWith('24'))) || rawEndMin === 1440 || rawEndMin === 1439 ? 1440 : rawEndMin;

    const dObj = new Date(booking.date);
    dObj.setDate(dObj.getDate() + 1);
    const nextDayStr = formatToYYYYMMDD(dObj);

    const targetDate = date || bookingDateStr;
    const isNextDay = targetDate === nextDayStr;

    // Normalize slots to array
    let slotsToExtend = [];
    if (slots && Array.isArray(slots) && slots.length > 0) {
      slotsToExtend = slots;
    } else if (startTime && endTime) {
      slotsToExtend = [{ startTime, endTime, price: parseFloat(additionalPrice) || parseFloat(booking.price_per_hour) }];
    } else {
      const slotDuration = parseInt(booking.slot_duration, 10) || 60;
      const nextStartMin = isNextDay ? 0 : endMin;
      const nextEndMin = nextStartMin + slotDuration;
      slotsToExtend = [{
        startTime: minutesToTime(nextStartMin).slice(0, 5),
        endTime: minutesToTime(nextEndMin).slice(0, 5),
        price: parseFloat(booking.price_per_hour)
      }];
    }

    // Sort slots by start time
    slotsToExtend.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    // Validate that first slot connects properly
    const firstSlotStartMin = timeToMinutes(slotsToExtend[0].startTime);
    const expectedFirstStartMin = isNextDay ? 0 : endMin;

    if (firstSlotStartMin !== expectedFirstStartMin) {
      const expectedLabel = isNextDay ? '00:00' : booking.end_time.slice(0, 5);
      return res.status(400).json({ 
        message: `Extended slots must start immediately after your current booking end time (${expectedLabel}).` 
      });
    }

    // Validate consecutiveness of all slots
    for (let i = 0; i < slotsToExtend.length; i++) {
      const s = slotsToExtend[i];
      const sStartMin = timeToMinutes(s.startTime);
      const sEndMin = timeToMinutes(s.endTime);

      if (i > 0) {
        const prevSlotEndMin = timeToMinutes(slotsToExtend[i - 1].endTime);
        if (sStartMin !== prevSlotEndMin) {
          return res.status(400).json({ message: 'Extended slots must be consecutive without gaps.' });
        }
      }

      // Facility close time check on same day
      const rawCloseMin = timeToMinutes(booking.close_time);
      const closeMin = (rawCloseMin === 1439 || rawCloseMin === 23 * 60 + 59) ? 1440 : rawCloseMin;
      if (!isNextDay && sEndMin > closeMin) {
        return res.status(400).json({ message: `Slot (${s.startTime} - ${s.endTime}) exceeds facility closing time.` });
      }

      // Check conflict with other confirmed bookings on targetDate
      const sStartStr = minutesToTime(sStartMin);
      const sEndStr = minutesToTime(sEndMin);
      const conflictRes = await query(
        `SELECT * FROM bookings 
         WHERE facility_id = $1 
           AND date = $2 
           AND status = 'confirmed' 
           AND id != $3
           AND (start_time < $5 AND end_time > $4)`,
        [booking.facility_id, targetDate, booking.id, sStartStr, sEndStr]
      );

      if (conflictRes.rows.length > 0) {
        return res.status(400).json({ 
          message: `Slot (${s.startTime} - ${s.endTime}) is already booked by another player.` 
        });
      }
    }

    const calculatedAddPrice = slotsToExtend.reduce((sum, s) => sum + (parseFloat(s.price) || parseFloat(booking.price_per_hour)), 0);
    const finalAddPrice = additionalPrice ? parseFloat(additionalPrice) : calculatedAddPrice;
    const finalEndMin = timeToMinutes(slotsToExtend[slotsToExtend.length - 1].endTime);
    const finalEndTimeStr = minutesToTime(finalEndMin);

    let updatedBooking = null;

    if (!isNextDay) {
      // Same day extension -> update existing booking
      const updateRes = await query(
        `UPDATE bookings 
         SET 
           original_start_time = COALESCE(original_start_time, start_time),
           original_end_time = COALESCE(original_end_time, end_time),
           end_time = $1, 
           total_price = total_price + $2,
           is_extended = TRUE,
           extended_slots = COALESCE(extended_slots, '[]'::jsonb) || $3::jsonb
         WHERE id = $4 
         RETURNING *`,
        [finalEndTimeStr, finalAddPrice, JSON.stringify(slotsToExtend), booking.id]
      );
      updatedBooking = updateRes.rows[0];
    } else {
      // Overnight extension into next day:
      // 1. Mark parent booking as extended
      await query(
        `UPDATE bookings 
         SET 
           is_extended = TRUE,
           extended_slots = COALESCE(extended_slots, '[]'::jsonb) || $1::jsonb
         WHERE id = $2`,
        [JSON.stringify(slotsToExtend), booking.id]
      );

      // 2. Insert new confirmed extension booking on next day
      const firstSlotStartTimeStr = minutesToTime(timeToMinutes(slotsToExtend[0].startTime));
      const insertRes = await query(
        `INSERT INTO bookings 
         (facility_id, user_id, date, start_time, end_time, total_price, status, is_extended, original_start_time, original_end_time, extended_slots) 
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmed', TRUE, $7, $8, $9) 
         RETURNING *`,
        [
          booking.facility_id,
          booking.user_id,
          targetDate,
          firstSlotStartTimeStr,
          finalEndTimeStr,
          finalAddPrice,
          booking.start_time,
          booking.end_time,
          JSON.stringify(slotsToExtend)
        ]
      );
      updatedBooking = insertRes.rows[0];
    }

    // Asynchronously send extension confirmation email
    sendBookingConfirmationEmail(req.user.email, {
      userName: req.user.name,
      bookingIds: [booking.id],
      sportName: booking.facility_type,
      venueName: booking.facility_name,
      venueLocation: booking.facility_location,
      date: bookingDateStr,
      slots: slotsToExtend,
      totalPrice: finalAddPrice,
      isExtension: true,
      newEndTime: finalEndTimeStr.slice(0, 5)
    }).catch(err => console.error('Failed to send extension email:', err));

    res.json({
      message: 'Booking extended successfully!',
      booking: updatedBooking
    });

  } catch (err) {
    console.error('Extend booking error:', err);
    res.status(500).json({ message: 'Server error processing booking extension.' });
  }
});

export default router;
