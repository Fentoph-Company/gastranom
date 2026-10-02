import db from '../db/connection.js';

/**
 * Format telegram message exactly as specified in Requirement 19:
 * 
 * 🛒 Yangi buyurtma
 * 
 * Order:
 * #GS-10482
 * 
 * Customer:
 * Ali Valiyev
 * 
 * Phone:
 * +998 XX XXX XX XX
 * 
 * Products:
 * * Coca-Cola 1L × 2
 * * Non × 3
 * 
 * Total:
 * 87,000 UZS
 * 
 * Delivery:
 * 15,000 UZS
 * 
 * Grand Total:
 * 102,000 UZS
 * 
 * Address:
 * Khiva, ...
 */
export function formatOrderTelegramMessage(order, items) {
  let addressText = 'Xiva, Mustaqillik ko‘chasi, 17 (Do‘kondan olib ketish)';
  try {
    const addr = typeof order.delivery_address === 'string' ? JSON.parse(order.delivery_address) : order.delivery_address;
    if (addr.deliveryType === 'pickup') {
      addressText = 'Khiva, Mustaqillik Street 17 (Do‘kondan olib ketish - Pickup)';
    } else {
      addressText = `Khiva, ${addr.street || ''} ${addr.house || ''}, ${addr.city || 'Khiva'}`;
    }
  } catch (e) {
    addressText = order.delivery_address || 'Khiva';
  }

  const productsLines = items.map((it) => `* ${it.product_name || it.productName} × ${it.quantity}`).join('\n');

  return `🛒 Yangi buyurtma

Order:
#${order.order_number}

Customer:
${order.customer_name}

Phone:
${order.customer_phone}

Products:
${productsLines}

Total:
${Number(order.subtotal).toLocaleString()} UZS

Delivery:
${Number(order.delivery_fee) > 0 ? `${Number(order.delivery_fee).toLocaleString()} UZS` : '0 UZS (Bepul)'}

Grand Total:
${Number(order.total_amount).toLocaleString()} UZS

Address:
${addressText}`;
}

/**
 * Send notification to configured Telegram Bot / Channel
 */
export async function sendTelegramNotification(text) {
  try {
    const botTokenRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
    const chatIdRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
    const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'telegram_enabled'").get();

    const getSettingVal = (row, fallback = '') => {
      if (!row || row.value === undefined || row.value === null) return fallback;
      try {
        const parsed = JSON.parse(row.value);
        return parsed !== '' && parsed !== null && parsed !== undefined ? parsed : fallback;
      } catch {
        return row.value || fallback;
      }
    };

    const botToken = getSettingVal(botTokenRow, process.env.TELEGRAM_BOT_TOKEN || '8857592268:AAGiB4PXMWli-Ag6s-LfBhK_hHeC4YQHWQE');
    const chatId = getSettingVal(chatIdRow, process.env.TELEGRAM_CHAT_ID || '');
    const isEnabled = Number(getSettingVal(enabledRow, 1)) !== 0;

    if (!isEnabled || !botToken || !chatId) {
      // Telegram not configured or disabled - graceful silent return
      return { success: false, reason: 'unconfigured' };
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML' // or plain text
      })
    });

    const data = await res.json();
    return { success: data.ok, data };
  } catch (err) {
    console.warn('Telegram notification dispatch failed:', err.message);
    return { success: false, error: err.message };
  }
}
