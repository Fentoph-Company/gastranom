import express from 'express';
import db from '../db/connection.js';
import { requireAdmin } from '../middleware/auth.js';
import { logAdminAction } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/admin/dashboard - Complete admin analytics & metrics
router.get('/dashboard', requireAdmin, (req, res) => {
  try {
    // Total Revenue (all non-cancelled orders)
    const rev = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END), 0) as today_revenue,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now') THEN total_amount ELSE 0 END), 0) as month_revenue
      FROM orders
      WHERE order_status != 'cancelled'
    `).get();

    // Order Counts
    const ordersStats = db.prepare(`
      SELECT 
        COUNT(id) as total_orders,
        SUM(CASE WHEN order_status = 'received' OR order_status = 'confirmed' OR order_status = 'preparing' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
      FROM orders
    `).get();

    // Total Customers
    const customerCount = db.prepare(`SELECT COUNT(id) as count FROM users WHERE role = 'customer'`).get().count;

    // Total Products
    const productCount = db.prepare(`SELECT COUNT(id) as count FROM products WHERE status = 'active'`).get().count;

    // Low stock products
    const lowStockCount = db.prepare(`
      SELECT COUNT(id) as count FROM products WHERE stock_quantity <= low_stock_threshold AND status = 'active'
    `).get().count;

    // Active discounts
    const now = new Date().toISOString();
    const activeDiscountsCount = db.prepare(`
      SELECT COUNT(id) as count FROM discounts WHERE is_active = 1 AND start_date <= ? AND end_date >= ?
    `).get(now, now).count;

    // Sales over past 7 days
    const salesOverTime = db.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(id) as order_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM orders
      WHERE order_status != 'cancelled'
        AND created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all();

    // Orders status distribution
    const statusDistribution = db.prepare(`
      SELECT order_status as status, COUNT(id) as count
      FROM orders
      GROUP BY order_status
    `).all();

    // Top selling products
    const topProducts = db.prepare(`
      SELECT 
        p.id, p.name, p.price, p.sold_quantity, p.stock_quantity,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image
      FROM products p
      ORDER BY p.sold_quantity DESC
      LIMIT 5
    `).all();

    // Recent 5 orders
    const recentOrders = db.prepare(`
      SELECT id, order_number, customer_name, customer_phone, total_amount, order_status, payment_status, created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 6
    `).all();

    res.json({
      success: true,
      metrics: {
        totalRevenue: rev.total_revenue,
        todayRevenue: rev.today_revenue,
        monthRevenue: rev.month_revenue,
        totalOrders: ordersStats.total_orders,
        pendingOrders: ordersStats.pending_orders || 0,
        completedOrders: ordersStats.completed_orders || 0,
        cancelledOrders: ordersStats.cancelled_orders || 0,
        totalCustomers: customerCount,
        totalProducts: productCount,
        lowStockProducts: lowStockCount,
        activeDiscounts: activeDiscountsCount
      },
      charts: {
        salesOverTime,
        statusDistribution,
        topProducts
      },
      recentOrders
    });
  } catch (err) {
    console.error('Error compiling dashboard metrics:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard metrics' });
  }
});

// GET /api/admin/inventory - Inventory overview & low stock alerts
router.get('/inventory', requireAdmin, (req, res) => {
  const { lowStockOnly } = req.query;

  let query = `
    SELECT p.id, p.name, p.sku, p.price, p.stock_quantity, p.reserved_stock, p.sold_quantity,
           p.low_stock_threshold, p.status, c.name as category_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
  `;

  if (lowStockOnly === 'true' || lowStockOnly === '1') {
    query += ' WHERE p.stock_quantity <= p.low_stock_threshold';
  }

  query += ' ORDER BY p.stock_quantity ASC, p.id DESC';

  const inventory = db.prepare(query).all();
  res.json({ success: true, inventory });
});

// PUT /api/admin/inventory/adjust - Stock adjustment
router.put('/inventory/adjust', requireAdmin, (req, res) => {
  const { productId, variantId, newStock, lowStockThreshold } = req.body;

  if (!productId || newStock === undefined) {
    return res.status(400).json({ success: false, message: 'Product ID and new stock amount are required.' });
  }

  const stockNum = Math.max(0, Number(newStock));

  if (variantId) {
    db.prepare('UPDATE product_variants SET stock_quantity = ? WHERE id = ?').run(stockNum, variantId);
  }

  const oldProduct = db.prepare('SELECT name, stock_quantity FROM products WHERE id = ?').get(productId);

  db.prepare(`
    UPDATE products
    SET stock_quantity = ?,
        low_stock_threshold = COALESCE(?, low_stock_threshold),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(stockNum, lowStockThreshold ? Number(lowStockThreshold) : null, productId);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'ADJUST_INVENTORY',
    entity: 'products',
    entityId: productId,
    oldValue: { stock: oldProduct?.stock_quantity },
    newValue: { stock: stockNum }
  });

  res.json({ success: true, message: `Stock for "${oldProduct?.name || 'Product'}" updated to ${stockNum}.` });
});

// GET /api/admin/customers - Customer management list
router.get('/customers', requireAdmin, (req, res) => {
  const { search } = req.query;

  let where = `WHERE u.role = 'customer'`;
  let params = [];

  if (search && search.trim()) {
    where += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
    const q = `%${search.trim()}%`;
    params.push(q, q, q);
  }

  const customers = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
           COUNT(o.id) as total_orders,
           COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_spent,
           MAX(o.created_at) as last_order_date
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    ${where}
    GROUP BY u.id
    ORDER BY u.id DESC
  `).all(...params);

  res.json({ success: true, customers });
});

// PUT /api/admin/customers/:id/status - Toggle active/disabled
router.put('/customers/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'disabled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be "active" or "disabled".' });
  }

  const customer = db.prepare('SELECT name, status FROM users WHERE id = ?').get(id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  db.prepare(`UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'TOGGLE_CUSTOMER_STATUS',
    entity: 'users',
    entityId: id,
    oldValue: customer.status,
    newValue: status
  });

  res.json({ success: true, message: `Customer account is now ${status}.` });
});

// GET /api/admin/audit-logs - View audit trail
router.get('/audit-logs', requireAdmin, (req, res) => {
  const { page = 1, limit = 20, entity, action } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let conditions = [];
  let params = [];

  if (entity) {
    conditions.push('entity = ?');
    params.push(entity);
  }

  if (action) {
    conditions.push('action LIKE ?');
    params.push(`%${action}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(id) as count FROM audit_logs ${whereClause}`).get(...params).count;
  const logs = db.prepare(`
    SELECT * FROM audit_logs
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  res.json({
    success: true,
    logs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  });
});

export default router;
