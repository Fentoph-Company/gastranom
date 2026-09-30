import express from 'express';
import db from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';
import { augmentProductWithDiscounts } from '../services/discountEngine.js';
import { calculateDeliveryFee } from '../services/deliveryEngine.js';
import { validateStockAvailability, deductOrderStock } from '../services/inventoryEngine.js';
import { formatOrderTelegramMessage, sendTelegramNotification } from '../services/telegramService.js';

const router = express.Router();

// Helper to validate and calculate coupon
function processCoupon(couponCode, subtotal, userId) {
  if (!couponCode) return { isValid: false, discount: 0, code: null };

  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(couponCode.toUpperCase().trim());
  if (!coupon) {
    return { isValid: false, message: 'Coupon code not found or inactive.', discount: 0, code: null };
  }

  // Check expiration
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { isValid: false, message: 'This coupon code has expired.', discount: 0, code: null };
  }

  // Check total uses
  if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
    return { isValid: false, message: 'This coupon usage limit has been reached.', discount: 0, code: null };
  }

  // Check minimum order amount
  if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
    return {
      isValid: false,
      message: `Minimum order amount for this coupon is ${coupon.min_order_amount.toLocaleString()} UZS.`,
      discount: 0,
      code: null
    };
  }

  // Check per-user limit
  if (userId) {
    const userUsages = db.prepare('SELECT COUNT(id) as count FROM coupon_usages WHERE coupon_id = ? AND user_id = ?').get(coupon.id, userId);
    if (userUsages && userUsages.count >= coupon.per_user_limit) {
      return { isValid: false, message: 'You have already used this coupon maximum times.', discount: 0, code: null };
    }
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage') {
    discount = Math.round((subtotal * coupon.discount_value) / 100);
  } else {
    discount = coupon.discount_value;
  }

  if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
    discount = coupon.max_discount_amount;
  }

  if (discount > subtotal) {
    discount = subtotal;
  }

  return {
    isValid: true,
    couponId: coupon.id,
    code: coupon.code,
    discount,
    discountType: coupon.discount_type,
    discountValue: coupon.discount_value
  };
}

// POST /api/checkout/validate-coupon
router.post('/validate-coupon', optionalAuth, (req, res) => {
  const { code, subtotal = 0 } = req.body;
  const result = processCoupon(code, Number(subtotal), req.user?.id);
  if (!result.isValid) {
    return res.status(400).json({ success: false, message: result.message || 'Invalid coupon' });
  }

  res.json({
    success: true,
    coupon: {
      code: result.code,
      discount: result.discount,
      discountType: result.discountType,
      discountValue: result.discountValue
    }
  });
});

// POST /api/checkout/calculate - Server-side price calculation
router.post('/calculate', optionalAuth, (req, res) => {
  try {
    const { items = [], deliveryZoneId, couponCode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order items are required' });
    }

    let verifiedSubtotal = 0;
    let verifiedDiscount = 0;
    const verifiedItems = [];

    for (const item of items) {
      const prod = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'active'").get(item.productId);
      if (!prod) {
        return res.status(400).json({ success: false, message: `Product ID ${item.productId} is not available` });
      }

      let unitPrice = prod.price;
      let variantTitle = null;

      if (item.variantId) {
        const variant = db.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ?').get(item.variantId, prod.id);
        if (!variant) {
          return res.status(400).json({ success: false, message: `Variant for "${prod.name}" not found` });
        }
        unitPrice = variant.price;
        variantTitle = variant.title;
      }

      const disc = augmentProductWithDiscounts({
        ...prod,
        price: unitPrice
      });

      const effectiveUnitPrice = disc.effective_price;
      const originalUnitPrice = disc.original_display_price;
      const quantity = Math.max(1, Number(item.quantity));
      const lineTotal = effectiveUnitPrice * quantity;
      const lineSavings = (originalUnitPrice - effectiveUnitPrice) * quantity;

      verifiedSubtotal += lineTotal;
      verifiedDiscount += lineSavings;

      verifiedItems.push({
        productId: prod.id,
        variantId: item.variantId || null,
        productName: prod.name,
        variantName: variantTitle,
        sku: prod.sku,
        unitPrice: effectiveUnitPrice,
        originalPrice: originalUnitPrice,
        discountApplied: originalUnitPrice - effectiveUnitPrice,
        quantity,
        totalPrice: lineTotal
      });
    }

    // Delivery calculation
    const deliveryType = req.body.deliveryType || 'delivery';
    let delivery = { fee: 0, isFree: true, zoneName: 'Do‘kondan olib ketish (Mustaqillik 17)', estimatedTime: '24/7 tayyor' };

    if (deliveryType !== 'pickup') {
      delivery = calculateDeliveryFee(deliveryZoneId, verifiedSubtotal);
    }

    // Coupon calculation
    let couponDiscount = 0;
    let validCoupon = null;
    if (couponCode) {
      const couponRes = processCoupon(couponCode, verifiedSubtotal, req.user?.id);
      if (couponRes.isValid) {
        couponDiscount = couponRes.discount;
        validCoupon = couponRes;
      }
    }

    const finalTotal = Math.max(0, verifiedSubtotal - couponDiscount + delivery.fee);

    res.json({
      success: true,
      calculation: {
        items: verifiedItems,
        subtotal: verifiedSubtotal,
        discountAmount: verifiedDiscount,
        deliveryFee: delivery.fee,
        isFreeDelivery: delivery.isFree,
        deliveryType,
        deliveryZone: delivery.zoneName,
        estimatedTime: delivery.estimatedTime,
        couponCode: validCoupon?.code || null,
        couponDiscount,
        finalTotal
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/checkout/place-order
router.post('/place-order', optionalAuth, (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryZoneId,
      deliveryType = 'delivery',
      region = 'Xorazm viloyati',
      city = 'Xiva shahri',
      street = 'Mustaqillik ko‘chasi',
      house = '17-uy',
      deliveryInstructions,
      paymentMethod = 'cod',
      items = [],
      couponCode,
      sessionId
    } = req.body;

    // Validate customer contact
    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required.' });
    }

    if (deliveryType !== 'pickup' && (!region || !city || !street || !house)) {
      return res.status(400).json({ success: false, message: 'Full delivery address is required for courier delivery.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items cannot be empty.' });
    }

    // Payment validation: if online payment requested, verify if configured
    if (paymentMethod === 'online' || paymentMethod === 'payme' || paymentMethod === 'click') {
      const onlineCfgRow = db.prepare("SELECT value FROM settings WHERE key = 'online_payment_configured'").get();
      const isOnlineConfigured = onlineCfgRow ? JSON.parse(onlineCfgRow.value) : false;
      if (!isOnlineConfigured) {
        return res.status(400).json({
          success: false,
          message: 'Onlayn to‘lov tizimi (Payme / Click) hozirda texnik sozlanmoqda. Iltimos, yetkazilganda naqd pul yoki karta orqali to‘lovni tanlang.'
        });
      }
    }

    // Step 1: Validate stock availability
    validateStockAvailability(items);

    // Step 2: Compute verified prices strictly server-side
    let subtotal = 0;
    let totalDiscount = 0;
    const orderItems = [];

    for (const it of items) {
      const prod = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'active'").get(it.productId);
      if (!prod) throw new Error(`Product "${it.productId}" is currently unavailable.`);

      let unitPrice = prod.price;
      let variantTitle = null;

      if (it.variantId) {
        const variant = db.prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ?').get(it.variantId, prod.id);
        if (!variant) throw new Error(`Product variant is unavailable.`);
        unitPrice = variant.price;
        variantTitle = variant.title;
      }

      const disc = augmentProductWithDiscounts({ ...prod, price: unitPrice });
      const effectiveUnitPrice = disc.effective_price;
      const originalUnitPrice = disc.original_display_price;
      const quantity = Math.max(1, Number(it.quantity));
      const lineTotal = effectiveUnitPrice * quantity;
      const lineSavings = (originalUnitPrice - effectiveUnitPrice) * quantity;

      subtotal += lineTotal;
      totalDiscount += lineSavings;

      orderItems.push({
        productId: prod.id,
        variantId: it.variantId || null,
        productName: prod.name,
        variantName: variantTitle,
        sku: prod.sku,
        unitPrice: effectiveUnitPrice,
        originalPrice: originalUnitPrice,
        discountApplied: originalUnitPrice - effectiveUnitPrice,
        quantity,
        totalPrice: lineTotal
      });
    }

    // Delivery
    let delivery = { fee: 0, isFree: true, zoneName: 'Do‘kondan olib ketish (Mustaqillik 17)', estimatedTime: '24/7 tayyor' };
    if (deliveryType !== 'pickup') {
      delivery = calculateDeliveryFee(deliveryZoneId, subtotal);
    }

    // Coupon
    let couponDiscount = 0;
    let processedCoupon = null;
    if (couponCode) {
      processedCoupon = processCoupon(couponCode, subtotal, req.user?.id);
      if (processedCoupon.isValid) {
        couponDiscount = processedCoupon.discount;
      }
    }

    const finalTotal = Math.max(0, subtotal - couponDiscount + delivery.fee);

    // Generate unique order number (e.g. GS-10482)
    const randSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `GS-${randSuffix}`;

    const formattedAddress = JSON.stringify({
      deliveryType,
      region: deliveryType === 'pickup' ? 'Xorazm viloyati' : region,
      city: deliveryType === 'pickup' ? 'Xiva shahri' : city,
      street: deliveryType === 'pickup' ? 'Mustaqillik ko‘chasi' : street,
      house: deliveryType === 'pickup' ? '17-uy (Gastronom Do‘koni)' : house,
      zoneName: delivery.zoneName
    });

    // Step 3: Run Database Transaction to insert order, items, deduct stock, log coupon
    const orderTx = db.transaction(() => {
      const orderInsert = db.prepare(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_phone, customer_email,
          delivery_zone_id, delivery_address, delivery_fee, delivery_instructions,
          subtotal, discount_amount, coupon_code, coupon_discount, total_amount,
          payment_method, payment_status, order_status, delivery_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'received', ?)
      `).run(
        orderNumber,
        req.user?.id || null,
        customerName.trim(),
        customerPhone.trim(),
        customerEmail || null,
        deliveryType === 'pickup' ? null : (deliveryZoneId || null),
        formattedAddress,
        delivery.fee,
        deliveryInstructions || null,
        subtotal,
        totalDiscount,
        processedCoupon?.code || null,
        couponDiscount,
        finalTotal,
        paymentMethod,
        deliveryType
      );

      const orderId = orderInsert.lastInsertRowid;

      // Insert Order Items
      const itemStmt = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, variant_name,
          sku, unit_price, original_price, discount_applied, quantity, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of orderItems) {
        itemStmt.run(
          orderId,
          item.productId,
          item.variantId,
          item.productName,
          item.variantName,
          item.sku,
          item.unitPrice,
          item.originalPrice,
          item.discountApplied,
          item.quantity,
          item.totalPrice
        );
      }

      // Record coupon usage
      if (processedCoupon?.isValid && processedCoupon.couponId) {
        db.prepare('UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?').run(processedCoupon.couponId);
        db.prepare('INSERT INTO coupon_usages (coupon_id, user_id, order_id) VALUES (?, ?, ?)').run(
          processedCoupon.couponId,
          req.user?.id || null,
          orderId
        );
      }

      // Deduct inventory atomically
      deductOrderStock(orderId);

      // Clear user/guest cart
      if (req.user) {
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
      } else if (sessionId) {
        db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sessionId);
      }

      // Customer notification
      if (req.user) {
        db.prepare(`
          INSERT INTO notifications (user_id, type, title, message, link)
          VALUES (?, 'order_status', 'Order Received!', ?, ?)
        `).run(
          req.user.id,
          `Your order #${orderNumber} for ${finalTotal.toLocaleString()} UZS has been received and is being processed.`,
          `/orders/${orderNumber}`
        );
      }

      // Admin notification
      db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (NULL, 'admin_new_order', 'New Order Received', ?, ?)
      `).run(
        `New order #${orderNumber} placed by ${customerName} (${finalTotal.toLocaleString()} UZS).`,
        `/admin/orders?search=${orderNumber}`
      );

      return orderId;
    });

    const newOrderId = orderTx();
    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(newOrderId);

    // Send Telegram Notification according to Requirement 19
    try {
      const telegramText = formatOrderTelegramMessage(createdOrder, orderItems);
      sendTelegramNotification(telegramText);
    } catch (tgErr) {
      console.warn('Telegram notification skipped:', tgErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderNumber,
      order: createdOrder
    });
  } catch (err) {
    console.error('Error placing order:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
