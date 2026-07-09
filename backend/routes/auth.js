import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { auth } from '../middleware/auth.js';
import { sendVerificationEmail } from '../utils/email.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Simple validation
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Please enter all required fields.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format.' });
  }

  try {
    // Check if user already exists
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create user (default role 'user', default status 'Unverified')
    const newUserRes = await query(
      'INSERT INTO users (name, email, password, phone, role, status, verification_otp, otp_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, role, phone, status',
      [name, email, hashedPassword, phone, 'user', 'Unverified', otp, otpExpiry]
    );

    const user = newUserRes.rows[0];

    // Send verification email synchronously
    try {
      await sendVerificationEmail(email, name, otp);
    } catch (err) {
      console.error('Failed to send verification email during registration. Rolling back user:', err);
      await query('DELETE FROM users WHERE id = $1', [user.id]);
      return res.status(500).json({ message: `Failed to send verification email: ${err.message}` });
    }

    res.status(201).json({
      message: 'Registration successful! A verification OTP has been sent to your email.',
      email: user.email,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    // Check for user
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const user = userRes.rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Check email verification status
    if (user.status !== 'Verified') {
      return res.status(401).json({
        message: 'Your email address is not verified. Please verify your email before logging in.',
        unverified: true,
        email: user.email,
      });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email using OTP
// @access  Public
router.post('/verify-email', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP code are required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format.' });
  }

  try {
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userRes.rows[0];

    if (user.status === 'Verified') {
      return res.status(400).json({ message: 'Email is already verified. Please login.' });
    }

    // Expiration check (5 minutes)
    if (user.otp_expiry && new Date(user.otp_expiry) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (user.verification_otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check and try again.' });
    }

    // Update user status
    await query(
      "UPDATE users SET status = 'Verified', verification_otp = NULL, otp_expiry = NULL WHERE id = $1",
      [user.id]
    );

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend email verification OTP
// @access  Public
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format.' });
  }

  try {
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = userRes.rows[0];

    if (user.status === 'Verified') {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Update OTP and Expiry in database
    await query(
      "UPDATE users SET verification_otp = $1, otp_expiry = $2 WHERE id = $3",
      [otp, otpExpiry, user.id]
    );

    // Send verification email synchronously
    try {
      await sendVerificationEmail(email, user.name, otp);
    } catch (err) {
      console.error('Failed to resend verification email:', err);
      return res.status(500).json({ message: `Failed to send verification email: ${err.message}` });
    }

    res.json({ message: 'A new verification OTP has been sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get user profile data
// @access  Private
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// @route   PUT /api/auth/profile
// @desc    Update user profile data
// @access  Private
router.put('/profile', auth, async (req, res) => {
  const { name, phone, email, password } = req.body;
  const userId = req.user.id;

  if (!name || !phone || !email) {
    return res.status(400).json({ message: 'Name, email and phone fields are required.' });
  }

  try {
    // Check if email already in use by another user
    const emailRes = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (emailRes.rows.length > 0) {
      return res.status(400).json({ message: 'This email is already in use by another account.' });
    }

    let queryStr = 'UPDATE users SET name = $1, email = $2, phone = $3';
    const queryParams = [name, email, phone];

    // If updating password
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      queryParams.push(hashedPassword);
      queryStr += `, password = $${queryParams.length}`;
    }

    queryParams.push(userId);
    queryStr += ` WHERE id = $${queryParams.length} RETURNING id, name, email, role, phone, status`;

    const updateRes = await query(queryStr, queryParams);

    res.json({
      message: 'Profile updated successfully!',
      user: updateRes.rows[0],
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// @route   DELETE /api/auth/account
// @desc    Permanently delete the authenticated user's account and all related data
// @access  Private
router.delete('/account', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    // Delete food orders (items are stored as JSONB, no separate items table)
    await query('DELETE FROM food_orders WHERE user_id = $1', [userId]);

    // Delete sport ground bookings
    await query('DELETE FROM bookings WHERE user_id = $1', [userId]);

    // Finally delete the user
    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Server error. Could not delete account.' });
  }
});

export default router;
