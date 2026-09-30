import express from 'express';
import db from '../db/connection.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logAdminAction } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/reviews/product/:productId - Get approved reviews for product
router.get('/product/:productId', (req, res) => {
  const { productId } = req.params;

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ? AND r.status = 'approved'
    ORDER BY r.id DESC
  `).all(productId);

  const stats = db.prepare(`
    SELECT 
      COUNT(id) as total_reviews,
      AVG(rating) as average_rating,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as star_5,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as star_4,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as star_3,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as star_2,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as star_1
    FROM reviews
    WHERE product_id = ? AND status = 'approved'
  `).get(productId);

  res.json({
    success: true,
    reviews,
    stats: {
      total: stats?.total_reviews || 0,
      average: Number((stats?.average_rating || 0).toFixed(1)),
      breakdown: {
        5: stats?.star_5 || 0,
        4: stats?.star_4 || 0,
        3: stats?.star_3 || 0,
        2: stats?.star_2 || 0,
        1: stats?.star_1 || 0
      }
    }
  });
});

// POST /api/reviews - Submit review (verified purchase check)
router.post('/', requireAuth, (req, res) => {
  const { productId, rating, comment, imageUrl } = req.body;

  if (!productId || !rating || !comment) {
    return res.status(400).json({ success: false, message: 'Product ID, rating (1-5), and comment are required.' });
  }

  const numRating = Number(rating);
  if (numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  // Check verified purchase
  const orderCheck = db.prepare(`
    SELECT o.id FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status = 'delivered'
    LIMIT 1
  `).get(req.user.id, productId);

  const isVerified = orderCheck ? 1 : 0;

  // Insert review (default approved if verified, or pending)
  const result = db.prepare(`
    INSERT INTO reviews (product_id, user_id, order_id, rating, comment, image_url, is_verified_purchase, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
  `).run(
    productId,
    req.user.id,
    orderCheck ? orderCheck.id : null,
    numRating,
    comment.trim(),
    imageUrl || null,
    isVerified
  );

  // Notify admin of new review
  const prod = db.prepare('SELECT name FROM products WHERE id = ?').get(productId);
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (NULL, 'admin_review', 'New Product Review', ?, ?)
  `).run(
    `${req.user.name} reviewed "${prod?.name || 'Product'}" with ${numRating} stars.`,
    `/admin/reviews`
  );

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, message: 'Review submitted successfully!', review });
});

// Admin: GET /api/reviews/admin/all
router.get('/admin/all', requireAdmin, (req, res) => {
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name, u.email as user_email, p.name as product_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    JOIN products p ON r.product_id = p.id
    ORDER BY r.id DESC
  `).all();

  res.json({ success: true, reviews });
});

// Admin: PUT /api/reviews/admin/:id/status
router.put('/admin/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'pending', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid review status.' });
  }

  db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'MODERATE_REVIEW',
    entity: 'reviews',
    entityId: id,
    newValue: status
  });

  res.json({ success: true, message: `Review status changed to ${status}.` });
});

// Admin: DELETE /api/reviews/admin/:id
router.delete('/admin/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'DELETE_REVIEW',
    entity: 'reviews',
    entityId: id
  });

  res.json({ success: true, message: 'Review deleted.' });
});

export default router;
