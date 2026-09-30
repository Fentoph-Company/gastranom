import express from 'express';
import db from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';
import { augmentProductWithDiscounts } from '../services/discountEngine.js';

const router = express.Router();

// Helper to get cart owner condition
function getCartCondition(req) {
  if (req.user) {
    return { condition: 'user_id = ?', param: req.user.id, isUser: true };
  }
  const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'guest_default_session';
  return { condition: 'session_id = ? AND user_id IS NULL', param: sessionId, isUser: false, sessionId };
}

// GET /api/cart
router.get('/', optionalAuth, (req, res) => {
  const { condition, param } = getCartCondition(req);

  const rawItems = db.prepare(`
    SELECT ci.id as cart_item_id, ci.quantity, ci.product_id, ci.variant_id,
           p.name as product_name, p.slug as product_slug, p.price as base_price,
           p.stock_quantity as product_stock, p.category_id, p.brand_id, p.previous_price,
           pv.title as variant_title, pv.price as variant_price, pv.stock_quantity as variant_stock,
           pv.image_url as variant_image,
           (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as primary_image
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.${condition}
    ORDER BY ci.id DESC
  `).all(param);

  let items = [];
  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of rawItems) {
    // Calculate unit price and check discounts
    const priceToUse = item.variant_price ? item.variant_price : item.base_price;
    const stockAvailable = item.variant_stock !== null && item.variant_stock !== undefined ? item.variant_stock : item.product_stock;

    // Run discount engine
    const discInfo = augmentProductWithDiscounts({
      id: item.product_id,
      price: priceToUse,
      previous_price: item.previous_price,
      category_id: item.category_id,
      brand_id: item.brand_id
    });

    const unitPrice = discInfo.effective_price;
    const originalPrice = discInfo.original_display_price;
    const itemTotal = unitPrice * item.quantity;
    const itemSavings = (originalPrice - unitPrice) * item.quantity;

    subtotal += itemTotal;
    totalDiscount += Math.max(0, itemSavings);

    items.push({
      id: item.cart_item_id,
      productId: item.product_id,
      variantId: item.variant_id,
      name: item.product_name,
      slug: item.product_slug,
      variantTitle: item.variant_title,
      image: item.variant_image || item.primary_image,
      unitPrice,
      originalPrice,
      hasDiscount: discInfo.has_discount,
      discountPercent: discInfo.discount_percent,
      quantity: item.quantity,
      itemTotal,
      stockAvailable,
      isOutOfStock: stockAvailable <= 0,
      isExceedingStock: item.quantity > stockAvailable
    });
  }

  res.json({
    success: true,
    cart: {
      items,
      itemCount: items.reduce((sum, it) => sum + it.quantity, 0),
      subtotal,
      totalDiscount
    }
  });
});

// POST /api/cart/add
router.post('/add', optionalAuth, (req, res) => {
  const { productId, variantId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ success: false, message: 'Product ID is required.' });
  }

  const requestedQty = Math.max(1, Number(quantity));

  // Check product & stock
  const product = db.prepare("SELECT id, name, stock_quantity FROM products WHERE id = ? AND status = 'active'").get(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product is unavailable.' });
  }

  let availableStock = product.stock_quantity;
  if (variantId) {
    const variant = db.prepare('SELECT id, stock_quantity, title FROM product_variants WHERE id = ? AND product_id = ?').get(variantId, productId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Product variant is unavailable.' });
    }
    availableStock = variant.stock_quantity;
  }

  if (availableStock <= 0) {
    return res.status(400).json({ success: false, message: 'Sorry, this product is currently out of stock.' });
  }

  const { isUser, param } = getCartCondition(req);

  // Check if item already in cart
  let existing;
  if (isUser) {
    existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))')
      .get(param, productId, variantId || null, variantId || null);
  } else {
    existing = db.prepare('SELECT id, quantity FROM cart_items WHERE session_id = ? AND user_id IS NULL AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))')
      .get(param, productId, variantId || null, variantId || null);
  }

  let newQty = requestedQty;
  if (existing) {
    newQty = existing.quantity + requestedQty;
  }

  if (newQty > availableStock) {
    newQty = availableStock;
    if (existing && existing.quantity >= availableStock) {
      return res.status(400).json({
        success: false,
        message: `Maximum available stock (${availableStock}) is already in your cart.`
      });
    }
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = ?, updated_at = datetime("now") WHERE id = ?').run(newQty, existing.id);
  } else {
    db.prepare(`
      INSERT INTO cart_items (user_id, session_id, product_id, variant_id, quantity)
      VALUES (?, ?, ?, ?, ?)
    `).run(isUser ? param : null, !isUser ? param : null, productId, variantId || null, newQty);
  }

  res.json({
    success: true,
    message: 'Added to cart successfully.',
    currentQuantity: newQty
  });
});

// PUT /api/cart/update
router.put('/update', optionalAuth, (req, res) => {
  const { cartItemId, quantity } = req.body;
  if (!cartItemId || quantity === undefined) {
    return res.status(400).json({ success: false, message: 'Cart item ID and quantity are required.' });
  }

  const { condition, param } = getCartCondition(req);
  const cartItem = db.prepare(`SELECT * FROM cart_items WHERE id = ? AND ${condition}`).get(cartItemId, param);
  if (!cartItem) {
    return res.status(404).json({ success: false, message: 'Cart item not found.' });
  }

  const targetQty = Number(quantity);
  if (targetQty <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ?').run(cartItemId);
    return res.json({ success: true, message: 'Item removed from cart.' });
  }

  // Stock check
  let availableStock = 0;
  if (cartItem.variant_id) {
    const v = db.prepare('SELECT stock_quantity FROM product_variants WHERE id = ?').get(cartItem.variant_id);
    availableStock = v ? v.stock_quantity : 0;
  } else {
    const p = db.prepare('SELECT stock_quantity FROM products WHERE id = ?').get(cartItem.product_id);
    availableStock = p ? p.stock_quantity : 0;
  }

  if (targetQty > availableStock) {
    return res.status(400).json({
      success: false,
      message: `Only ${availableStock} units available in stock.`,
      availableStock
    });
  }

  db.prepare('UPDATE cart_items SET quantity = ?, updated_at = datetime("now") WHERE id = ?').run(targetQty, cartItemId);
  res.json({ success: true, message: 'Cart updated.' });
});

// DELETE /api/cart/remove/:id
router.delete('/remove/:id', optionalAuth, (req, res) => {
  const { id } = req.params;
  const { condition, param } = getCartCondition(req);

  db.prepare(`DELETE FROM cart_items WHERE id = ? AND ${condition}`).run(id, param);
  res.json({ success: true, message: 'Item removed from cart.' });
});

// POST /api/cart/clear
router.post('/clear', optionalAuth, (req, res) => {
  const { condition, param } = getCartCondition(req);
  db.prepare(`DELETE FROM cart_items WHERE ${condition}`).run(param);
  res.json({ success: true, message: 'Cart cleared.' });
});

// POST /api/cart/merge - Merge guest cart into user cart when user logs in
router.post('/merge', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required to merge cart.' });
  }

  const { sessionId } = req.body;
  if (!sessionId) {
    return res.json({ success: true, message: 'No guest session provided.' });
  }

  const guestItems = db.prepare('SELECT * FROM cart_items WHERE session_id = ? AND user_id IS NULL').all(sessionId);

  for (const item of guestItems) {
    const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))')
      .get(req.user.id, item.product_id, item.variant_id, item.variant_id);

    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(item.quantity, existing.id);
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(item.id);
    } else {
      db.prepare('UPDATE cart_items SET user_id = ?, session_id = NULL WHERE id = ?').run(req.user.id, item.id);
    }
  }

  res.json({ success: true, message: 'Cart merged successfully.' });
});

export default router;
