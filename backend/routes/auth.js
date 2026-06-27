import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { auth } from '../middleware/auth.js';

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

  try {
    // Check if user already exists
    const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (default role 'user')
    const newUserRes = await query(
      'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone',
      [name, email, hashedPassword, phone, 'user']
    );

    const user = newUserRes.rows[0];

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user,
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
      },
    });
  } catch (err) {
    console.error('Login error:', err);
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
    queryStr += ` WHERE id = $${queryParams.length} RETURNING id, name, email, role, phone`;

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

export default router;
