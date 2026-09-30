import db from '../db/connection.js';

/**
 * Calculates current active discount for a product at server time.
 * Business rule:
 * - Before start_date: Normal price
 * - During active period (start_date <= now <= end_date): Discounted price
 * - After end_date: Normal price
 * If multiple discounts match, chooses the one that gives the greatest customer saving, capped by max_discount_amount.
 */
export function calculateProductDiscount(product, now = new Date().toISOString()) {
  const basePrice = Number(product.price);
  if (!basePrice || basePrice <= 0) {
    return {
      finalPrice: basePrice,
      originalPrice: basePrice,
      hasDiscount: false,
      discountPercent: 0,
      discountAmount: 0,
      activePromotion: null
    };
  }

  // Find all active discounts matching product, its category, or its brand
  const query = `
    SELECT * FROM discounts
    WHERE is_active = 1
      AND start_date <= ?
      AND end_date >= ?
      AND (
        product_id = ?
        OR (product_id IS NULL AND category_id = ?)
        OR (product_id IS NULL AND category_id IS NULL AND brand_id = ?)
        OR (product_id IS NULL AND category_id IS NULL AND brand_id IS NULL)
      )
    ORDER BY created_at DESC
  `;

  const matchingDiscounts = db.prepare(query).all(
    now,
    now,
    product.id,
    product.category_id || null,
    product.brand_id || null
  );

  let bestSaving = 0;
  let bestDiscount = null;

  for (const disc of matchingDiscounts) {
    let saving = 0;
    if (disc.type === 'percentage') {
      saving = (basePrice * disc.value) / 100;
    } else if (disc.type === 'fixed') {
      saving = disc.value;
    }

    if (disc.max_discount_amount && saving > disc.max_discount_amount) {
      saving = disc.max_discount_amount;
    }

    // Do not allow price to drop below 0
    if (saving > basePrice) {
      saving = basePrice;
    }

    if (saving > bestSaving) {
      bestSaving = saving;
      bestDiscount = disc;
    }
  }

  if (bestSaving > 0 && bestDiscount) {
    const finalPrice = Math.round(basePrice - bestSaving);
    const discountPercent = Math.round((bestSaving / basePrice) * 100);

    return {
      finalPrice,
      originalPrice: basePrice,
      hasDiscount: true,
      discountPercent,
      discountAmount: Math.round(bestSaving),
      activePromotion: {
        id: bestDiscount.id,
        title: bestDiscount.title,
        type: bestDiscount.type,
        value: bestDiscount.value,
        endDate: bestDiscount.end_date,
        bannerUrl: bestDiscount.banner_url
      }
    };
  }

  // Check if product has a static previous_price with higher value
  if (product.previous_price && Number(product.previous_price) > basePrice) {
    const prev = Number(product.previous_price);
    const saving = prev - basePrice;
    const discountPercent = Math.round((saving / prev) * 100);
    return {
      finalPrice: basePrice,
      originalPrice: prev,
      hasDiscount: true,
      discountPercent,
      discountAmount: Math.round(saving),
      activePromotion: null
    };
  }

  return {
    finalPrice: basePrice,
    originalPrice: basePrice,
    hasDiscount: false,
    discountPercent: 0,
    discountAmount: 0,
    activePromotion: null
  };
}

/**
 * Augments a product or list of products with real-time discount info
 */
export function augmentProductWithDiscounts(product) {
  if (!product) return null;
  const discountInfo = calculateProductDiscount(product);
  return {
    ...product,
    effective_price: discountInfo.finalPrice,
    original_display_price: discountInfo.originalPrice,
    has_discount: discountInfo.hasDiscount,
    discount_percent: discountInfo.discountPercent,
    discount_amount: discountInfo.discountAmount,
    active_promotion: discountInfo.activePromotion
  };
}
