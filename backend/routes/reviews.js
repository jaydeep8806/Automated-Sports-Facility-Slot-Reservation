import express from 'express';
import { query } from '../db.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Helper: Format date to local YYYY-MM-DD
const formatToYYYYMMDD = (d) => {
  const dateObj = new Date(d);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @route   POST /api/reviews
// @desc    Submit feedback/review for a booking immediately after payment or anytime
// @access  Private
router.post('/', auth, async (req, res) => {
  const { bookingId, rating, comment } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!bookingId || !rating) {
    return res.status(400).json({ message: 'Booking ID and star rating (1–5) are required.' });
  }

  const numRating = parseInt(rating, 10);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: 'Star rating must be between 1 and 5.' });
  }

  try {
    // 1. Fetch booking details
    const bookingRes = await query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];

    // 2. Authorization check
    if (booking.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to submit feedback for this booking.' });
    }

    // 3. Confirm booking is confirmed (not cancelled)
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot submit feedback for a cancelled booking.' });
    }

    // 4. Prevent duplicate feedback for the same booking
    const existingReview = await query('SELECT id FROM reviews WHERE booking_id = $1', [bookingId]);
    if (existingReview.rows.length > 0) {
      return res.status(400).json({ message: 'Feedback has already been submitted for this booking.' });
    }

    // 5. Insert new review
    const insertRes = await query(
      `INSERT INTO reviews (booking_id, facility_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [booking.id, booking.facility_id, userId, numRating, comment ? comment.trim() : '']
    );

    // 6. Fetch fully joined review for immediate frontend rendering
    const fullReviewRes = await query(
      `SELECT r.*, u.name AS user_name, f.name AS facility_name, f.location AS facility_location, f.type AS sport, f.type AS facility_type
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN facilities f ON r.facility_id = f.id
       WHERE r.id = $1`,
      [insertRes.rows[0].id]
    );

    res.status(201).json({
      message: 'Feedback submitted successfully! Thank you.',
      review: fullReviewRes.rows[0]
    });

  } catch (err) {
    console.error('Submit review error:', err);
    res.status(500).json({ message: 'Server error submitting feedback.' });
  }
});

// @route   GET /api/reviews/booking/:bookingId/status
// @desc    Check if feedback has already been submitted for a specific booking
// @access  Private
router.get('/booking/:bookingId/status', auth, async (req, res) => {
  const { bookingId } = req.params;
  try {
    const result = await query(
      `SELECT r.*, u.name AS user_name, f.name AS facility_name, f.type AS sport
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN facilities f ON r.facility_id = f.id
       WHERE r.booking_id = $1`,
      [bookingId]
    );
    if (result.rows.length > 0) {
      return res.json({ hasReviewed: true, review: result.rows[0] });
    }
    return res.json({ hasReviewed: false });
  } catch (err) {
    console.error('Check booking review status error:', err);
    res.status(500).json({ message: 'Server error checking review status.' });
  }
});

// @route   GET /api/reviews/recent
// @desc    Get latest live reviews for Home Page "What Players Say" section
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, 
              u.name AS user_name, 
              f.name AS facility_name, 
              f.location AS facility_location, 
              f.type AS facility_type,
              f.type AS sport
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN facilities f ON r.facility_id = f.id
       ORDER BY r.created_at DESC
       LIMIT 20`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch recent reviews error:', err);
    res.status(500).json({ message: 'Server error fetching recent reviews.' });
  }
});

// @route   GET /api/reviews/facility/:facilityId
// @desc    Get reviews for a specific facility
// @access  Public
router.get('/facility/:facilityId', async (req, res) => {
  const { facilityId } = req.params;
  try {
    const result = await query(
      `SELECT r.*, u.name AS user_name 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.facility_id = $1
       ORDER BY r.created_at DESC`,
      [facilityId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch facility reviews error:', err);
    res.status(500).json({ message: 'Server error fetching facility reviews.' });
  }
});

// @route   GET /api/reviews/facility-ratings
// @desc    Get average ratings and total counts for all facilities
// @access  Public
router.get('/facility-ratings', async (req, res) => {
  try {
    const result = await query(
      `SELECT facility_id, 
              ROUND(AVG(rating), 1)::float AS average_rating, 
              COUNT(*)::int AS total_reviews
       FROM reviews
       GROUP BY facility_id`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch facility ratings error:', err);
    res.status(500).json({ message: 'Server error fetching facility ratings.' });
  }
});

// @route   GET /api/reviews/my-reviews
// @desc    Get all reviews submitted by the logged-in user
// @access  Private
router.get('/my-reviews', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT r.*, f.name AS facility_name, f.type AS sport 
       FROM reviews r
       JOIN facilities f ON r.facility_id = f.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Fetch user reviews error:', err);
    res.status(500).json({ message: 'Server error fetching user reviews.' });
  }
});

export default router;
