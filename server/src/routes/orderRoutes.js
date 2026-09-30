import express from 'express';
import db from '../db/connection.js';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js';
import { restoreOrderStock } from '../services/inventoryEngine.js';
import { logAdminAction } from '../services/auditLogger.js';

const router = express.Router();

// Order statuses array in pipeline order
export const ORDER_STATUSES = [
  'received',
  'confirmed',
  'preparing',
  'ready',
  'courier_assigned',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

// GET /api/orders/my-orders - Customer order history
router.get('/my-orders', requireAuth, (req, res) => {
  const orders = db.prepare(`
    SELECT * FROM orders
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(req.user.id);

  const ordersWithItems = orders.map(ord => {
    const items = db.prepare(`
      SELECT oi.*,
        (SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY is_primary DESC LIMIT 1) as product_image
      FROM order_items oi
      WHERE oi.order_id = ?
    `).all(ord.id);
    return { ...ord, items };
  });

  res.json({ success: true, orders: ordersWithItems });
});

// GET /api/orders/track/:orderNumber - Public/authenticated tracking
router.get('/track/:orderNumber', (req, res) => {
  const { orderNumber } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber.trim().toUpperCase());

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found with this number.' });
  }

  const items = db.prepare(`
    SELECT oi.*,
      (SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY is_primary DESC LIMIT 1) as product_image
    FROM order_items oi
    WHERE oi.order_id = ?
  `).all(order.id);

  let addressObj = {};
  try {
    addressObj = JSON.parse(order.delivery_address);
  } catch (e) {
    addressObj = { raw: order.delivery_address };
  }

  // Delivery zone details
  let zone = null;
  if (order.delivery_zone_id) {
    zone = db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(order.delivery_zone_id);
  }

  res.json({
    success: true,
    order: {
      ...order,
      delivery_address_details: addressObj,
      zone,
      items,
      statusesPipeline: ORDER_STATUSES
    }
  });
});

// GET /api/orders/:id - Details by ID
router.get('/:id', optionalAuth, (req, res) => {
  const { id } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  // Access check: allow if admin OR order belongs to user
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin' || req.user.id === order.user_id)) {
    const items = db.prepare(`
      SELECT oi.*,
        (SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY is_primary DESC LIMIT 1) as product_image
      FROM order_items oi
      WHERE oi.order_id = ?
    `).all(order.id);

    return res.json({ success: true, order: { ...order, items } });
  }

  res.status(403).json({ success: false, message: 'Access denied.' });
});

// Admin: GET /api/admin/orders - All orders with filters & search
router.get('/admin/list', requireAdmin, (req, res) => {
  const {
    page = 1,
    limit = 15,
    status,
    payment_status,
    search,
    start_date,
    end_date
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  let conditions = [];
  let params = [];

  if (status) {
    conditions.push('order_status = ?');
    params.push(status);
  }

  if (payment_status) {
    conditions.push('payment_status = ?');
    params.push(payment_status);
  }

  if (search && search.trim()) {
    conditions.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }

  if (start_date) {
    conditions.push('created_at >= ?');
    params.push(start_date);
  }

  if (end_date) {
    conditions.push('created_at <= ?');
    params.push(end_date);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(id) as count FROM orders ${whereClause}`).get(...params).count;

  const orders = db.prepare(`
    SELECT * FROM orders
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  // Attach items count and summary
  const enhancedOrders = orders.map(ord => {
    const items = db.prepare(`
      SELECT oi.*,
        (SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY is_primary DESC LIMIT 1) as product_image
      FROM order_items oi
      WHERE oi.order_id = ?
    `).all(ord.id);
    return { ...ord, items };
  });

  res.json({
    success: true,
    orders: enhancedOrders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

// Admin: PUT /api/admin/orders/:id/status - Update order status
router.put('/admin/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}` });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const oldStatus = order.order_status;
  if (oldStatus === status) {
    return res.json({ success: true, message: 'Status is unchanged.', order });
  }

  // If transitioning to cancelled from active status, restore inventory!
  if (status === 'cancelled' && oldStatus !== 'cancelled') {
    restoreOrderStock(id);
  }

  db.prepare(`
    UPDATE orders
    SET order_status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, id);

  // Notify customer if associated with account
  if (order.user_id) {
    const statusTitles = {
      confirmed: 'Order Confirmed',
      preparing: 'Order Being Prepared',
      ready: 'Order Ready for Delivery',
      courier_assigned: 'Courier Assigned',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Order Delivered Successfully!',
      cancelled: 'Order Cancelled'
    };

    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'order_status', ?, ?, ?)
    `).run(
      order.user_id,
      statusTitles[status] || 'Order Status Updated',
      `Your order #${order.order_number} status is now: ${status.replace('_', ' ').toUpperCase()}`,
      `/orders/${order.order_number}`
    );
  }

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'ORDER_STATUS_CHANGE',
    entity: 'orders',
    entityId: id,
    oldValue: oldStatus,
    newValue: status
  });

  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json({ success: true, message: `Order status updated to ${status}`, order: updatedOrder });
});

// Admin: PUT /api/admin/orders/:id/payment - Update payment status
router.put('/admin/:id/payment', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
  if (!validStatuses.includes(payment_status)) {
    return res.status(400).json({ success: false, message: `Invalid payment status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  db.prepare(`
    UPDATE orders
    SET payment_status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(payment_status, id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'ORDER_PAYMENT_STATUS_CHANGE',
    entity: 'orders',
    entityId: id,
    oldValue: order.payment_status,
    newValue: payment_status
  });

  res.json({ success: true, message: 'Payment status updated' });
});

// Admin: PUT /api/admin/orders/:id/notes - Internal notes
router.put('/admin/:id/notes', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  db.prepare(`
    UPDATE orders
    SET internal_notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(notes, id);

  res.json({ success: true, message: 'Internal notes saved' });
});

export default router;
