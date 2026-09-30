import db from '../db/connection.js';

/**
 * Validates stock availability for an array of items.
 * Each item has { productId, variantId, quantity }
 */
export function validateStockAvailability(items) {
  for (const item of items) {
    if (item.variantId) {
      const variant = db.prepare('SELECT id, stock_quantity, title FROM product_variants WHERE id = ?').get(item.variantId);
      if (!variant) {
        throw new Error(`Variant not found for ID: ${item.variantId}`);
      }
      if (variant.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for variant "${variant.title}". Available: ${variant.stock_quantity}, requested: ${item.quantity}`);
      }
    } else {
      const product = db.prepare('SELECT id, stock_quantity, name FROM products WHERE id = ?').get(item.productId);
      if (!product) {
        throw new Error(`Product not found for ID: ${item.productId}`);
      }
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}`);
      }
    }
  }
  return true;
}

/**
 * Decreases stock atomically when order is confirmed / placed.
 * Creates low-stock notifications for admins if stock drops below threshold.
 */
export function deductOrderStock(orderId) {
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  const deductTx = db.transaction(() => {
    for (const item of items) {
      if (item.variant_id) {
        db.prepare(`
          UPDATE product_variants
          SET stock_quantity = MAX(0, stock_quantity - ?)
          WHERE id = ?
        `).run(item.quantity, item.variant_id);
      }

      // Update parent product stock and sold quantity
      db.prepare(`
        UPDATE products
        SET stock_quantity = MAX(0, stock_quantity - ?),
            sold_quantity = sold_quantity + ?
        WHERE id = ?
      `).run(item.quantity, item.quantity, item.product_id);

      // Check if low stock reached
      const prod = db.prepare('SELECT id, name, stock_quantity, low_stock_threshold FROM products WHERE id = ?').get(item.product_id);
      if (prod && prod.stock_quantity <= prod.low_stock_threshold) {
        // Check if unread notification already exists to avoid spamming
        const exists = db.prepare(`
          SELECT id FROM notifications
          WHERE type = 'admin_low_stock' AND message LIKE ? AND is_read = 0
        `).get(`%${prod.name}%`);

        if (!exists) {
          db.prepare(`
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (NULL, 'admin_low_stock', 'Low Stock Alert', ?, ?)
          `).run(`Stock for "${prod.name}" has reached ${prod.stock_quantity} units.`, `/admin/products?id=${prod.id}`);
        }
      }
    }
  });

  deductTx();
}

/**
 * Restores stock when an order is cancelled
 */
export function restoreOrderStock(orderId) {
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  const restoreTx = db.transaction(() => {
    for (const item of items) {
      if (item.variant_id) {
        db.prepare(`
          UPDATE product_variants
          SET stock_quantity = stock_quantity + ?
          WHERE id = ?
        `).run(item.quantity, item.variant_id);
      }

      db.prepare(`
        UPDATE products
        SET stock_quantity = stock_quantity + ?,
            sold_quantity = MAX(0, sold_quantity - ?)
        WHERE id = ?
      `).run(item.quantity, item.quantity, item.product_id);
    }
  });

  restoreTx();
}
