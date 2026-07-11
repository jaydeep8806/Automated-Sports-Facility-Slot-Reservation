import express from 'express';
import { query } from '../db.js';
import { auth, admin } from '../middleware/auth.js';

const router = express.Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

// GET /api/canteen/categories
router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT * FROM food_categories ORDER BY display_order');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ message: 'Server error fetching categories.' });
  }
});

// GET /api/canteen/items?facilityId=&categoryId=
router.get('/items', async (req, res) => {
  const { facilityId, categoryId } = req.query;
  try {
    let sql = `
      SELECT fi.*, fc.name AS category_name, fc.icon AS category_icon
      FROM food_items fi
      LEFT JOIN food_categories fc ON fi.category_id = fc.id
      WHERE 1=1
    `;
    const params = [];
    if (facilityId) {
      params.push(facilityId);
      sql += ` AND (fi.facility_id = $${params.length} OR fi.facility_id IS NULL)`;
    }
    if (categoryId) {
      params.push(categoryId);
      sql += ` AND fi.category_id = $${params.length}`;
    }
    sql += ' ORDER BY fc.display_order, fi.id';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch food items error:', err);
    res.status(500).json({ message: 'Server error fetching food items.' });
  }
});

// ─── USER (Protected) ──────────────────────────────────────────────────────────

// POST /api/canteen/orders  — Place a food order
router.post('/orders', auth, async (req, res) => {
  const { bookingId, facilityId, items, totalPrice, deliveryTime, paymentMethod } = req.body;
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0 || !totalPrice) {
    return res.status(400).json({ message: 'Order must contain at least one item.' });
  }

  try {
    // Verify booking belongs to user if provided
    if (bookingId) {
      const bookingRes = await query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [bookingId, userId]);
      if (bookingRes.rows.length === 0) {
        return res.status(403).json({ message: 'Booking not found or not owned by you.' });
      }
    }

    const paymentStatus = paymentMethod === 'online' ? 'paid' : 'pending';

    const result = await query(
      `INSERT INTO food_orders (booking_id, user_id, facility_id, items, total_price, delivery_time, payment_method, payment_status, order_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [
        bookingId || null,
        userId,
        facilityId || null,
        JSON.stringify(items),
        parseFloat(totalPrice),
        deliveryTime || 'before',
        paymentMethod || 'canteen',
        paymentStatus
      ]
    );

    res.status(201).json({ message: 'Order placed successfully!', order: result.rows[0] });
  } catch (err) {
    console.error('Place order error:', err);
    res.status(500).json({ message: 'Server error placing food order.' });
  }
});

// GET /api/canteen/my-orders
router.get('/my-orders', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT fo.*, f.name AS facility_name, f.location AS facility_location
       FROM food_orders fo
       LEFT JOIN facilities f ON fo.facility_id = f.id
       WHERE fo.user_id = $1
       ORDER BY fo.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch user orders error:', err);
    res.status(500).json({ message: 'Server error fetching your orders.' });
  }
});

// GET /api/canteen/orders/all
router.get('/orders/all', auth, admin, async (req, res) => {
  try {
    const { location, search, orderStatus, paymentStatus, date, page = 1, limit = 10 } = req.query;

    let queryText = `
      SELECT fo.*, f.name AS facility_name, f.location AS facility_location, f.type AS facility_type, u.name AS user_name, u.email AS user_email
      FROM food_orders fo
      LEFT JOIN facilities f ON fo.facility_id = f.id
      LEFT JOIN users u ON fo.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];

    if (location && location !== 'all') {
      queryParams.push(`%${location}%`);
      queryText += ` AND f.location ILIKE $${queryParams.length}`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (u.name ILIKE $${queryParams.length} OR u.email ILIKE $${queryParams.length} OR f.name ILIKE $${queryParams.length} OR CAST(fo.id AS TEXT) ILIKE $${queryParams.length})`;
    }

    if (orderStatus && orderStatus !== 'all') {
      queryParams.push(orderStatus);
      queryText += ` AND fo.order_status = $${queryParams.length}`;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      queryParams.push(paymentStatus);
      queryText += ` AND fo.payment_status = $${queryParams.length}`;
    }

    if (date) {
      queryParams.push(date);
      queryText += ` AND DATE(fo.created_at) = $${queryParams.length}`;
    }

    // Get total count for pagination before appending limit/offset
    const countRes = await query(
      `SELECT COUNT(*) FROM (${queryText}) AS total`,
      queryParams
    );
    const totalCount = parseInt(countRes.rows[0].count, 10);

    queryText += ` ORDER BY fo.created_at DESC`;

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

    res.json({
      data: result.rows,
      pagination: {
        total: totalCount,
        page: parseInt(page, 10),
        limit: limit === 'all' ? totalCount : parseInt(limit, 10),
        pages: limit === 'all' ? 1 : Math.ceil(totalCount / parseInt(limit, 10))
      }
    });
  } catch (err) {
    console.error('Fetch all orders error:', err);
    res.status(500).json({ message: 'Server error fetching all food orders.' });
  }
});

// GET /api/canteen/orders/:id  — Get single order (owner or admin)
router.get('/orders/:id', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT fo.*, f.name AS facility_name, f.location AS facility_location
       FROM food_orders fo
       LEFT JOIN facilities f ON fo.facility_id = f.id
       WHERE fo.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    const order = result.rows[0];
    if (order.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order.' });
    }
    res.json(order);
  } catch (err) {
    console.error('Fetch order error:', err);
    res.status(500).json({ message: 'Server error fetching order.' });
  }
});

// PUT /api/canteen/orders/:id/cancel
router.put('/orders/:id/cancel', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const result = await query('SELECT * FROM food_orders WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    const order = result.rows[0];
    if (order.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this order.' });
    }
    if (order.order_status !== 'pending') {
      return res.status(400).json({ message: 'Order can only be cancelled before preparation starts.' });
    }
    const updated = await query(
      "UPDATE food_orders SET order_status = 'cancelled' WHERE id = $1 RETURNING *",
      [id]
    );
    res.json({ message: 'Order cancelled successfully.', order: updated.rows[0] });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ message: 'Server error cancelling order.' });
  }
});



// PUT /api/canteen/orders/:id/status
router.put('/orders/:id/status', auth, admin, async (req, res) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus } = req.body;
  try {
    const fields = [];
    const params = [];
    if (orderStatus) {
      params.push(orderStatus);
      fields.push(`order_status = $${params.length}`);
    }
    if (paymentStatus) {
      params.push(paymentStatus);
      fields.push(`payment_status = $${params.length}`);
    }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'Provide orderStatus or paymentStatus to update.' });
    }
    params.push(id);
    const result = await query(
      `UPDATE food_orders SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    res.json({ message: 'Order status updated.', order: result.rows[0] });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ message: 'Server error updating order status.' });
  }
});

// GET /api/canteen/admin/items
router.get('/admin/items', auth, admin, async (req, res) => {
  try {
    const result = await query(
      `SELECT fi.*, fc.name AS category_name
       FROM food_items fi
       LEFT JOIN food_categories fc ON fi.category_id = fc.id
       ORDER BY fc.display_order, fi.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch admin items error:', err);
    res.status(500).json({ message: 'Server error fetching food items.' });
  }
});

// POST /api/canteen/admin/items
router.post('/admin/items', auth, admin, async (req, res) => {
  const { categoryId, facilityId, name, description, price, imageUrl, isVeg, isAvailable } = req.body;
  if (!name || !price) {
    return res.status(400).json({ message: 'Name and price are required.' });
  }
  try {
    const result = await query(
      `INSERT INTO food_items (category_id, facility_id, name, description, price, image_url, is_veg, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [categoryId || null, facilityId || null, name, description || '', parseFloat(price), imageUrl || '', isVeg !== false, isAvailable !== false]
    );
    res.status(201).json({ message: 'Food item added.', item: result.rows[0] });
  } catch (err) {
    console.error('Add item error:', err);
    res.status(500).json({ message: 'Server error adding food item.' });
  }
});

// PUT /api/canteen/admin/items/:id
router.put('/admin/items/:id', auth, admin, async (req, res) => {
  const { id } = req.params;
  const { categoryId, facilityId, name, description, price, imageUrl, isVeg, isAvailable } = req.body;
  try {
    const result = await query(
      `UPDATE food_items
       SET category_id=$1, facility_id=$2, name=$3, description=$4, price=$5, image_url=$6, is_veg=$7, is_available=$8
       WHERE id=$9 RETURNING *`,
      [categoryId || null, facilityId || null, name, description || '', parseFloat(price), imageUrl || '', isVeg !== false, isAvailable !== false, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found.' });
    res.json({ message: 'Food item updated.', item: result.rows[0] });
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ message: 'Server error updating food item.' });
  }
});

// DELETE /api/canteen/admin/items/:id
router.delete('/admin/items/:id', auth, admin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM food_items WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found.' });
    res.json({ message: 'Food item deleted.' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ message: 'Server error deleting food item.' });
  }
});

export default router;
