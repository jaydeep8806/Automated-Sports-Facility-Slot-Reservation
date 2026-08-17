import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// Helper: Format date to local YYYY-MM-DD
const formatToYYYYMMDD = (d) => {
  const dateObj = new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @route   GET /api/facilities/time
// @desc    Return current server time in IST (used by frontend for 2-hour booking rule)
// @access  Public
router.get('/time', (req, res) => {
  // Server is configured with Asia/Kolkata timezone via pool.on('connect')
  const now = new Date();
  // Convert to IST offset (+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  res.json({
    serverTime: now.toISOString(),
    istHours: ist.getUTCHours(),
    istMinutes: ist.getUTCMinutes(),
    istTotalMinutes: ist.getUTCHours() * 60 + ist.getUTCMinutes(),
    istDateStr: `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, '0')}-${String(ist.getUTCDate()).padStart(2, '0')}`,
  });
});

// Helper: Convert time string "HH:MM:SS" or "HH:MM" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
};

// Helper: Format minutes from midnight to "HH:MM" (supports 1440 as "24:00")
const minutesToTime = (totalMinutes) => {
  if (totalMinutes === 1440) return '24:00';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// @route   GET /api/facilities
// @desc    Get all active facilities (with optional search and filters)
// @access  Public
router.get('/', async (req, res) => {
  const { search, type, maxPrice } = req.query;

  try {
    let queryStr = "SELECT * FROM facilities WHERE status = 'active'";
    const queryParams = [];

    if (search) {
      queryParams.push(`%${search}%`);
      queryStr += ` AND (name ILIKE $${queryParams.length} OR location ILIKE $${queryParams.length})`;
    }

    if (type && type !== 'all') {
      queryParams.push(type);
      queryStr += ` AND type = $${queryParams.length}`;
    }

    if (maxPrice) {
      queryParams.push(parseFloat(maxPrice));
      queryStr += ` AND price_per_hour <= $${queryParams.length}`;
    }

    queryStr += ' ORDER BY id DESC';

    const result = await query(queryStr, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch facilities error:', err);
    res.status(500).json({ message: 'Server error retrieving facilities.' });
  }
});

// @route   GET /api/facilities/:id
// @desc    Get details of a single facility
// @access  Public
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('SELECT * FROM facilities WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Facility not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch facility details error:', err);
    res.status(500).json({ message: 'Server error retrieving facility details.' });
  }
});

// @route   GET /api/facilities/:id/slots
// @desc    Check slot availability for a specific facility on a given date
// @access  Public (supports optional Authorization & extendBookingId for active booking extension)
router.get('/:id/slots', async (req, res) => {
  const { id } = req.params;
  const { date, extendBookingId } = req.query; // Expecting YYYY-MM-DD

  if (!date) {
    return res.status(400).json({ message: 'Please provide a date query parameter (YYYY-MM-DD).' });
  }

  try {
    // 1. Get facility operational hours
    const facRes = await query('SELECT open_time, close_time, slot_duration, price_per_hour FROM facilities WHERE id = $1 AND status = \'active\'', [id]);
    if (facRes.rows.length === 0) {
      return res.status(404).json({ message: 'Facility not found or inactive.' });
    }
    const { open_time, close_time, slot_duration, price_per_hour } = facRes.rows[0];

    // Use IST server time for accurate 2-hour advance booking rule
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const todayStr = `${istNow.getUTCFullYear()}-${String(istNow.getUTCMonth() + 1).padStart(2, '0')}-${String(istNow.getUTCDate()).padStart(2, '0')}`;
    const isToday = date === todayStr;

    let currentMinutes = 0;
    if (isToday) {
      currentMinutes = istNow.getUTCHours() * 60 + istNow.getUTCMinutes();
    }

    // 2. Check if valid active-booking extension request
    let isExtendValid = false;
    let extendBooking = null;

    if (extendBookingId && isToday) {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const bRes = await query(
            "SELECT * FROM bookings WHERE id = $1 AND facility_id = $2 AND status = 'confirmed'",
            [extendBookingId, id]
          );
          if (bRes.rows.length > 0) {
            const b = bRes.rows[0];
            if (b.user_id === decoded.id || decoded.role === 'admin') {
              const bDateStr = formatToYYYYMMDD(b.date);
              const bStartMin = timeToMinutes(b.start_time);
              const bEndMin = timeToMinutes(b.end_time);
              // Active today and currently in progress or not completed
              if (bDateStr === todayStr && bStartMin <= currentMinutes && currentMinutes < bEndMin) {
                isExtendValid = true;
                extendBooking = b;
              }
            }
          }
        } catch (authErr) {
          console.warn('Extend booking token verification ignored:', authErr.message);
        }
      }
    }

    // 3. Fetch confirmed bookings for this facility on the given date (excluding extending booking if valid)
    const bookingsRes = await query(
      "SELECT id, start_time, end_time FROM bookings WHERE facility_id = $1 AND date = $2 AND status = 'confirmed'",
      [id, date]
    );
    const confirmedBookings = bookingsRes.rows
      .filter(b => !isExtendValid || String(b.id) !== String(extendBookingId))
      .map(b => ({
        start: timeToMinutes(b.start_time),
        end: timeToMinutes(b.end_time),
      }));

    // 4. Generate slots
    const startMin = timeToMinutes(open_time);
    // Treat 23:59 as midnight (1440 min) so the 23:00-24:00 slot is included
    const rawEndMin = timeToMinutes(close_time);
    const endMin = (rawEndMin === 1439 || rawEndMin === 23 * 60 + 59) ? 1440 : rawEndMin;
    const duration = parseInt(slot_duration, 10) || 60;
    
    const slots = [];

    // 2-hour advance booking buffer (120 minutes)
    const ADVANCE_BUFFER_MINUTES = 120;

    for (let m = startMin; m + duration <= endMin; m += duration) {
      const slotStart = m;
      const slotEnd = m + duration;

      const startTimeStr = minutesToTime(slotStart);
      const endTimeStr = minutesToTime(slotEnd);

      // Slot is in the past (already passed)
      const isPast = isToday && slotStart < currentMinutes;

      // Slot is too soon — only apply 2-hour buffer for normal bookings (waived for valid active extensions)
      const isTooSoon = isToday && !isPast && !isExtendValid && (slotStart < currentMinutes + ADVANCE_BUFFER_MINUTES);

      // Check overlap with any confirmed bookings
      const isBooked = confirmedBookings.some(booking => {
        return booking.start < slotEnd && booking.end > slotStart;
      });

      slots.push({
        startTime: startTimeStr,
        endTime: endTimeStr,
        price: parseFloat(price_per_hour),
        booked: isBooked,
        isPast: isPast,
        isTooSoon: isTooSoon,
        available: !isBooked && !isPast && !isTooSoon,
      });
    }

    res.json({
      date,
      facilityId: parseInt(id, 10),
      isExtensionMode: isExtendValid,
      activeBooking: isExtendValid ? {
        id: extendBooking.id,
        startTime: extendBooking.start_time.slice(0, 5),
        endTime: extendBooking.end_time.slice(0, 5),
        totalPrice: parseFloat(extendBooking.total_price)
      } : null,
      slots
    });
  } catch (err) {
    console.error('Fetch slots error:', err);
    res.status(500).json({ message: 'Server error checking slot availability.' });
  }
});

// @route   POST /api/facilities
// @desc    Add a new facility (Admin only)
// @access  Private/Admin
router.post('/', auth, admin, async (req, res) => {
  const { name, type, location, pricePerHour, images, description, amenities, openTime, closeTime, slotDuration } = req.body;

  if (!name || !type || !location || !pricePerHour) {
    return res.status(400).json({ message: 'Name, type, location and price per hour are required.' });
  }

  try {
    const result = await query(
      `INSERT INTO facilities 
       (name, type, location, price_per_hour, images, description, amenities, open_time, close_time, slot_duration, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active') 
       RETURNING *`,
      [
        name,
        type,
        location,
        parseFloat(pricePerHour),
        images || [],
        description || '',
        amenities || [],
        openTime || '06:00:00',
        closeTime || '22:00:00',
        parseInt(slotDuration, 10) || 60
      ]
    );

    res.status(201).json({
      message: 'Facility created successfully!',
      facility: result.rows[0]
    });
  } catch (err) {
    console.error('Create facility error:', err);
    res.status(500).json({ message: 'Server error creating facility.' });
  }
});

// @route   PUT /api/facilities/:id
// @desc    Update an existing facility (Admin only)
// @access  Private/Admin
router.put('/:id', auth, admin, async (req, res) => {
  const { id } = req.params;
  const { name, type, location, pricePerHour, images, description, amenities, openTime, closeTime, slotDuration, status } = req.body;

  if (!name || !type || !location || !pricePerHour) {
    return res.status(400).json({ message: 'Name, type, location and price per hour are required.' });
  }

  try {
    // Check if facility exists
    const checkRes = await query('SELECT * FROM facilities WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Facility not found.' });
    }

    const result = await query(
      `UPDATE facilities 
       SET name = $1, type = $2, location = $3, price_per_hour = $4, images = $5, description = $6, amenities = $7, open_time = $8, close_time = $9, slot_duration = $10, status = $11 
       WHERE id = $12 
       RETURNING *`,
      [
        name,
        type,
        location,
        parseFloat(pricePerHour),
        images || [],
        description || '',
        amenities || [],
        openTime,
        closeTime,
        parseInt(slotDuration, 10) || 60,
        status || 'active',
        id
      ]
    );

    res.json({
      message: 'Facility updated successfully!',
      facility: result.rows[0]
    });
  } catch (err) {
    console.error('Update facility error:', err);
    res.status(500).json({ message: 'Server error updating facility.' });
  }
});

// @route   DELETE /api/facilities/:id
// @desc    Delete a facility (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, admin, async (req, res) => {
  const { id } = req.params;

  try {
    const checkRes = await query('SELECT * FROM facilities WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Facility not found.' });
    }

    // Set to inactive or delete. Let's delete completely (or set status to maintenance/inactive).
    // Deleting completely is requested, but cascade references will delete bookings as well. Let's do DELETE.
    await query('DELETE FROM facilities WHERE id = $1', [id]);

    res.json({ message: 'Facility deleted successfully!' });
  } catch (err) {
    console.error('Delete facility error:', err);
    res.status(500).json({ message: 'Server error deleting facility.' });
  }
});

export default router;
