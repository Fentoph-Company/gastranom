import express from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications
router.get('/', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

  let notifications;
  if (isAdmin) {
    // Admin gets both user-specific and admin-type notifications
    notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ? OR (user_id IS NULL AND type LIKE 'admin_%')
      ORDER BY id DESC
      LIMIT 30
    `).all(req.user.id);
  } else {
    notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 30
    `).all(req.user.id);
  }

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  res.json({ success: true, notifications, unreadCount });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, (req, res) => {
  const { id } = req.params;
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  res.json({ success: true, message: 'Notification marked as read.' });
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, (req, res) => {
  const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
  if (isAdmin) {
    db.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE user_id = ? OR (user_id IS NULL AND type LIKE 'admin_%')
    `).run(req.user.id);
  } else {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  }
  res.json({ success: true, message: 'All notifications marked as read.' });
});

export default router;
