import express from 'express';
import db from '../db/connection.js';
import { requireAdmin } from '../middleware/auth.js';
import { logAdminAction } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/delivery/zones - Public active delivery zones
router.get('/zones', (req, res) => {
  const zones = db.prepare('SELECT * FROM delivery_zones WHERE is_active = 1 ORDER BY price ASC').all();
  res.json({ success: true, zones });
});

// Admin: GET /api/delivery/admin/all
router.get('/admin/all', requireAdmin, (req, res) => {
  const zones = db.prepare('SELECT * FROM delivery_zones ORDER BY id ASC').all();
  res.json({ success: true, zones });
});

// Admin: POST /api/delivery/admin/create
router.post('/admin/create', requireAdmin, (req, res) => {
  const { name, region, price, free_threshold, estimated_time, is_active = 1 } = req.body;

  if (!name || !region || price === undefined || !estimated_time) {
    return res.status(400).json({ success: false, message: 'Name, region, price, and estimated time are required.' });
  }

  const result = db.prepare(`
    INSERT INTO delivery_zones (name, region, price, free_threshold, estimated_time, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name,
    region,
    Number(price),
    free_threshold ? Number(free_threshold) : null,
    estimated_time,
    is_active ? 1 : 0
  );

  const zone = db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(result.lastInsertRowid);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'CREATE_DELIVERY_ZONE',
    entity: 'delivery_zones',
    entityId: zone.id,
    newValue: zone
  });

  res.status(201).json({ success: true, message: 'Delivery zone created.', zone });
});

// Admin: PUT /api/delivery/admin/:id
router.put('/admin/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Delivery zone not found.' });
  }

  const { name, region, price, free_threshold, estimated_time, is_active } = req.body;

  db.prepare(`
    UPDATE delivery_zones SET
      name = COALESCE(?, name),
      region = COALESCE(?, region),
      price = COALESCE(?, price),
      free_threshold = ?,
      estimated_time = COALESCE(?, estimated_time),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    name,
    region,
    price !== undefined ? Number(price) : existing.price,
    free_threshold !== undefined ? (free_threshold ? Number(free_threshold) : null) : existing.free_threshold,
    estimated_time,
    is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
    id
  );

  const updated = db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'UPDATE_DELIVERY_ZONE',
    entity: 'delivery_zones',
    entityId: id,
    oldValue: existing,
    newValue: updated
  });

  res.json({ success: true, message: 'Delivery zone updated.', zone: updated });
});

// Admin: DELETE /api/delivery/admin/:id
router.delete('/admin/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM delivery_zones WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Delivery zone not found.' });
  }

  db.prepare('DELETE FROM delivery_zones WHERE id = ?').run(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'DELETE_DELIVERY_ZONE',
    entity: 'delivery_zones',
    entityId: id,
    oldValue: existing
  });

  res.json({ success: true, message: 'Delivery zone deleted.' });
});

export default router;
