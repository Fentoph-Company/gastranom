import express from 'express';
import db from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';
import { augmentProductWithDiscounts } from '../services/discountEngine.js';

const router = express.Router();

// GET /api/wishlist - Get customer wishlist
router.get('/', requireAuth, (req, res) => {
  const items = db.prepare(`
    SELECT w.id as wishlist_id, w.created_at as added_at,
           p.*,
           c.name as category_name,
           b.name as brand_name,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as primary_image
    FROM wishlist w
    JOIN products p ON w.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE w.user_id = ?
    ORDER BY w.id DESC
  `).all(req.user.id);

  const augmented = items.map(p => augmentProductWithDiscounts(p));

  res.json({
    success: true,
    wishlist: augmented
  });
});

// POST /api/wishlist/toggle - Add or remove from wishlist
router.post('/toggle', requireAuth, (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required.' });
  }

  const existing = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);

  if (existing) {
    db.prepare('DELETE FROM wishlist WHERE id = ?').run(existing.id);
    return res.json({ success: true, isWishlisted: false, message: 'Removed from wishlist' });
  } else {
    db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user.id, productId);
    return res.json({ success: true, isWishlisted: true, message: 'Added to wishlist' });
  }
});

export default router;
