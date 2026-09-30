import db from '../db/connection.js';

/**
 * Calculates delivery fee based on delivery zone and subtotal
 */
export function calculateDeliveryFee(deliveryZoneId, subtotal) {
  if (!deliveryZoneId) {
    return {
      fee: 25000, // standard default 25,000 UZS
      isFree: false,
      zoneName: 'Standard Delivery',
      estimatedTime: '1-2 business days'
    };
  }

  const zone = db.prepare('SELECT * FROM delivery_zones WHERE id = ? AND is_active = 1').get(deliveryZoneId);
  if (!zone) {
    return {
      fee: 25000,
      isFree: false,
      zoneName: 'Standard Delivery',
      estimatedTime: '1-2 business days'
    };
  }

  let fee = zone.price;
  let isFree = false;

  if (zone.free_threshold && subtotal >= zone.free_threshold) {
    fee = 0;
    isFree = true;
  }

  return {
    fee,
    isFree,
    zoneId: zone.id,
    zoneName: zone.name,
    region: zone.region,
    estimatedTime: zone.estimated_time,
    freeThreshold: zone.free_threshold
  };
}
