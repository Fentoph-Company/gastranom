import express from 'express';
import db from '../db/connection.js';
import { requireAdmin } from '../middleware/auth.js';
import { logAdminAction } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/discounts/active - Public active discounts and promotions
router.get('/active', (req, res) => {
  const now = new Date().toISOString();
  const discounts = db.prepare(`
    SELECT d.*,
      c.name as category_name,
      b.name as brand_name,
      p.name as product_name
    FROM discounts d
    LEFT JOIN categories c ON d.category_id = c.id
    LEFT JOIN brands b ON d.brand_id = b.id
    LEFT JOIN products p ON d.product_id = p.id
    WHERE d.is_active = 1
      AND d.start_date <= ?
      AND d.end_date >= ?
    ORDER BY d.id DESC
  `).all(now, now);

  res.json({ success: true, discounts, serverTime: now });
});

// Admin: GET /api/discounts/admin/all
router.get('/admin/all', requireAdmin, (req, res) => {
  const discounts = db.prepare(`
    SELECT d.*,
      c.name as category_name,
      b.name as brand_name,
      p.name as product_name
    FROM discounts d
    LEFT JOIN categories c ON d.category_id = c.id
    LEFT JOIN brands b ON d.brand_id = b.id
    LEFT JOIN products p ON d.product_id = p.id
    ORDER BY d.id DESC
  `).all();

  res.json({ success: true, discounts });
});

// Admin: POST /api/discounts/admin/create
router.post('/admin/create', requireAdmin, (req, res) => {
  const {
    title,
    type,
    value,
    start_date,
    end_date,
    category_id,
    brand_id,
    product_id,
    min_order_amount = 0,
    max_discount_amount,
    banner_url,
    is_active = 1
  } = req.body;

  if (!title || !type || value === undefined || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Title, type, value, start date, and end date are required.' });
  }

  if (new Date(start_date) >= new Date(end_date)) {
    return res.status(400).json({ success: false, message: 'End date must be after start date.' });
  }

  const result = db.prepare(`
    INSERT INTO discounts (
      title, type, value, start_date, end_date, category_id, brand_id, product_id,
      min_order_amount, max_discount_amount, banner_url, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    type,
    Number(value),
    start_date,
    end_date,
    category_id || null,
    brand_id || null,
    product_id || null,
    Number(min_order_amount || 0),
    max_discount_amount ? Number(max_discount_amount) : null,
    banner_url || null,
    is_active ? 1 : 0
  );

  const newDisc = db.prepare('SELECT * FROM discounts WHERE id = ?').get(result.lastInsertRowid);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'CREATE_DISCOUNT',
    entity: 'discounts',
    entityId: newDisc.id,
    newValue: newDisc
  });

  res.status(201).json({ success: true, message: 'Discount campaign created.', discount: newDisc });
});

// Admin: PUT /api/discounts/admin/:id
router.put('/admin/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM discounts WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Discount not found' });
  }

  const {
    title,
    type,
    value,
    start_date,
    end_date,
    category_id,
    brand_id,
    product_id,
    min_order_amount,
    max_discount_amount,
    banner_url,
    is_active
  } = req.body;

  db.prepare(`
    UPDATE discounts SET
      title = COALESCE(?, title),
      type = COALESCE(?, type),
      value = COALESCE(?, value),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      category_id = ?,
      brand_id = ?,
      product_id = ?,
      min_order_amount = COALESCE(?, min_order_amount),
      max_discount_amount = ?,
      banner_url = ?,
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    title,
    type,
    value !== undefined ? Number(value) : existing.value,
    start_date,
    end_date,
    category_id !== undefined ? category_id : existing.category_id,
    brand_id !== undefined ? brand_id : existing.brand_id,
    product_id !== undefined ? product_id : existing.product_id,
    min_order_amount !== undefined ? Number(min_order_amount) : existing.min_order_amount,
    max_discount_amount !== undefined ? (max_discount_amount ? Number(max_discount_amount) : null) : existing.max_discount_amount,
    banner_url !== undefined ? banner_url : existing.banner_url,
    is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
    id
  );

  const updated = db.prepare('SELECT * FROM discounts WHERE id = ?').get(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'UPDATE_DISCOUNT',
    entity: 'discounts',
    entityId: id,
    oldValue: existing,
    newValue: updated
  });

  res.json({ success: true, message: 'Discount updated', discount: updated });
});

// Admin: DELETE /api/discounts/admin/:id
router.delete('/admin/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM discounts WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Discount not found' });
  }

  db.prepare('DELETE FROM discounts WHERE id = ?').run(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'DELETE_DISCOUNT',
    entity: 'discounts',
    entityId: id,
    oldValue: existing
  });

  res.json({ success: true, message: 'Discount deleted' });
});

// COUPONS CRUD
// Admin: GET /api/discounts/coupons
router.get('/admin/coupons/all', requireAdmin, (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all();
  res.json({ success: true, coupons });
});

// Admin: POST /api/discounts/coupons
router.post('/admin/coupons/create', requireAdmin, (req, res) => {
  const {
    code,
    discount_type,
    discount_value,
    min_order_amount = 0,
    max_discount_amount,
    max_uses = 100,
    per_user_limit = 1,
    expires_at,
    is_active = 1
  } = req.body;

  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ success: false, message: 'Code, discount type, and value are required.' });
  }

  const cleanCode = code.toUpperCase().trim();
  const existing = db.prepare('SELECT id FROM coupons WHERE code = ?').get(cleanCode);
  if (existing) {
    return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
  }

  const result = db.prepare(`
    INSERT INTO coupons (
      code, discount_type, discount_value, min_order_amount, max_discount_amount,
      max_uses, per_user_limit, expires_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    cleanCode,
    discount_type,
    Number(discount_value),
    Number(min_order_amount || 0),
    max_discount_amount ? Number(max_discount_amount) : null,
    Number(max_uses || 100),
    Number(per_user_limit || 1),
    expires_at || null,
    is_active ? 1 : 0
  );

  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'CREATE_COUPON',
    entity: 'coupons',
    entityId: coupon.id,
    newValue: coupon
  });

  res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
});

// Admin: PUT /api/discounts/coupons/:id
router.put('/admin/coupons/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Coupon not found.' });
  }

  const {
    code,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    max_uses,
    per_user_limit,
    expires_at,
    is_active
  } = req.body;

  db.prepare(`
    UPDATE coupons SET
      code = COALESCE(?, code),
      discount_type = COALESCE(?, discount_type),
      discount_value = COALESCE(?, discount_value),
      min_order_amount = COALESCE(?, min_order_amount),
      max_discount_amount = ?,
      max_uses = COALESCE(?, max_uses),
      per_user_limit = COALESCE(?, per_user_limit),
      expires_at = ?,
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    code ? code.toUpperCase().trim() : null,
    discount_type,
    discount_value !== undefined ? Number(discount_value) : existing.discount_value,
    min_order_amount !== undefined ? Number(min_order_amount) : existing.min_order_amount,
    max_discount_amount !== undefined ? (max_discount_amount ? Number(max_discount_amount) : null) : existing.max_discount_amount,
    max_uses !== undefined ? Number(max_uses) : existing.max_uses,
    per_user_limit !== undefined ? Number(per_user_limit) : existing.per_user_limit,
    expires_at !== undefined ? expires_at : existing.expires_at,
    is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
    id
  );

  const updated = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'UPDATE_COUPON',
    entity: 'coupons',
    entityId: id,
    oldValue: existing,
    newValue: updated
  });

  res.json({ success: true, message: 'Coupon updated', coupon: updated });
});

// Admin: DELETE /api/discounts/coupons/:id
router.delete('/admin/coupons/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM coupons WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Coupon not found.' });
  }

  db.prepare('DELETE FROM coupons WHERE id = ?').run(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'DELETE_COUPON',
    entity: 'coupons',
    entityId: id,
    oldValue: existing
  });

  res.json({ success: true, message: 'Coupon deleted' });
});

export default router;
