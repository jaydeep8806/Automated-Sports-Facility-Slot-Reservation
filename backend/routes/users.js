import express from 'express';
import { query } from '../db.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/all
// @desc    Get all users with stats, filtering & search (Admin only)
// @access  Private/Admin
router.get('/all', auth, admin, async (req, res) => {
  try {
    const { search, status, date } = req.query;

    let queryText = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.password, 
        u.phone, 
        u.role, 
        COALESCE(u.account_status, 'Active') AS account_status,
        u.status AS email_status,
        u.created_at,
        u.last_login,
        COUNT(DISTINCT b.id) AS total_bookings,
        COUNT(DISTINCT fo.id) AS total_food_orders
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN food_orders fo ON u.id = fo.user_id
      WHERE 1=1
    `;
    const queryParams = [];

    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (u.name ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length} OR u.phone ILIKE $${queryParams.length})`;
    }

    if (status && status !== 'all') {
      queryParams.push(status);
      queryText += ` AND COALESCE(u.account_status, 'Active') ILIKE $${queryParams.length}`;
    }

    if (date) {
      queryParams.push(date);
      queryText += ` AND DATE(u.created_at) = $${queryParams.length}`;
    }

    queryText += ` GROUP BY u.id`;
    queryText += ` ORDER BY u.created_at DESC`;

    // Total registered users count
    const totalUsersRes = await query('SELECT COUNT(*) FROM users');
    const totalUsersCount = parseInt(totalUsersRes.rows[0].count, 10);

    const result = await query(queryText, queryParams);

    res.json({
      users: result.rows,
      totalUsers: totalUsersCount,
    });
  } catch (err) {
    console.error('Fetch admin users error:', err);
    res.status(500).json({ message: 'Server error fetching user list.' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user details (Name, Phone, Role, Account Status)
// @access  Private/Admin
router.put('/:id', auth, admin, async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, account_status } = req.body;

  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const updatedName = name || userRes.rows[0].name;
    const updatedPhone = phone || userRes.rows[0].phone;
    const updatedRole = role || userRes.rows[0].role;
    const updatedStatus = account_status || userRes.rows[0].account_status || 'Active';

    const result = await query(
      `UPDATE users 
       SET name = $1, phone = $2, role = $3, account_status = $4 
       WHERE id = $5 
       RETURNING id, name, email, phone, role, account_status, created_at, last_login`,
      [updatedName, updatedPhone, updatedRole, updatedStatus, id]
    );

    res.json({ message: 'User updated successfully!', user: result.rows[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error updating user.' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Toggle/Set user account status (Active / Blocked)
// @access  Private/Admin
router.put('/:id/status', auth, admin, async (req, res) => {
  const { id } = req.params;
  const { account_status } = req.body;

  if (!account_status || !['Active', 'Blocked'].includes(account_status)) {
    return res.status(400).json({ message: 'Valid status ("Active" or "Blocked") is required.' });
  }

  try {
    const result = await query(
      'UPDATE users SET account_status = $1 WHERE id = $2 RETURNING id, name, email, account_status',
      [account_status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: `User status updated to ${account_status}.`, user: result.rows[0] });
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ message: 'Server error changing user status.' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', auth, admin, async (req, res) => {
  const { id } = req.params;

  try {
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own logged-in admin account.' });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id, email', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User deleted successfully!' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
});

export default router;
