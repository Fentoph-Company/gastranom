import express from 'express';
import db from '../db/connection.js';
import { requireAdmin } from '../middleware/auth.js';
import { logAdminAction } from '../services/auditLogger.js';

const router = express.Router();

// GET /api/content/banners - Active banners
router.get('/banners', (req, res) => {
  const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id DESC').all();
  res.json({ success: true, banners });
});

// Admin: GET /api/content/banners/all
router.get('/banners/all', requireAdmin, (req, res) => {
  const banners = db.prepare('SELECT * FROM banners ORDER BY sort_order ASC, id DESC').all();
  res.json({ success: true, banners });
});

// Admin: POST /api/content/banners
router.post('/banners', requireAdmin, (req, res) => {
  const { title, subtitle, image_url, link_url, badge_text, sort_order = 0, is_active = 1 } = req.body;
  if (!title || !image_url || !link_url) {
    return res.status(400).json({ success: false, message: 'Title, image URL, and link URL are required.' });
  }

  const result = db.prepare(`
    INSERT INTO banners (title, subtitle, image_url, link_url, badge_text, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, subtitle || null, image_url, link_url, badge_text || null, Number(sort_order), is_active ? 1 : 0);

  const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(result.lastInsertRowid);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'CREATE_BANNER',
    entity: 'banners',
    entityId: banner.id,
    newValue: banner
  });

  res.status(201).json({ success: true, message: 'Banner created', banner });
});

// Admin: PUT /api/content/banners/:id
router.put('/banners/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Banner not found.' });
  }

  const { title, subtitle, image_url, link_url, badge_text, sort_order, is_active } = req.body;

  db.prepare(`
    UPDATE banners SET
      title = COALESCE(?, title),
      subtitle = ?,
      image_url = COALESCE(?, image_url),
      link_url = COALESCE(?, link_url),
      badge_text = ?,
      sort_order = COALESCE(?, sort_order),
      is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    title,
    subtitle !== undefined ? subtitle : existing.subtitle,
    image_url,
    link_url,
    badge_text !== undefined ? badge_text : existing.badge_text,
    sort_order !== undefined ? Number(sort_order) : existing.sort_order,
    is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
    id
  );

  const updated = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'UPDATE_BANNER',
    entity: 'banners',
    entityId: id,
    oldValue: existing,
    newValue: updated
  });

  res.json({ success: true, message: 'Banner updated', banner: updated });
});

// Admin: DELETE /api/content/banners/:id
router.delete('/banners/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Banner not found.' });
  }

  db.prepare('DELETE FROM banners WHERE id = ?').run(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'DELETE_BANNER',
    entity: 'banners',
    entityId: id,
    oldValue: existing
  });

  res.json({ success: true, message: 'Banner deleted' });
});

// GET /api/content/settings - Public store settings
router.get('/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => {
    try {
      settings[r.key] = JSON.parse(r.value);
    } catch (e) {
      settings[r.key] = r.value;
    }
  });

  res.json({ success: true, settings });
});

// Admin: PUT /api/content/settings - Update settings
router.put('/settings', requireAdmin, (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid settings payload.' });
  }

  const upsertStmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  const setTx = db.transaction(() => {
    for (const [key, val] of Object.entries(updates)) {
      const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
      upsertStmt.run(key, valStr);
    }
  });

  setTx();

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'UPDATE_SETTINGS',
    entity: 'settings',
    entityId: 'global',
    newValue: updates
  });

  res.json({ success: true, message: 'Store settings saved successfully.' });
});

// Admin: POST /api/content/test-telegram - Send a test message
router.post('/test-telegram', requireAdmin, async (req, res) => {
  try {
    const { bot_token, chat_id } = req.body;
    let token = bot_token;
    let targetChat = chat_id;

    if (!token) {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'telegram_bot_token'").get();
      if (row && row.value) {
        try { token = JSON.parse(row.value); } catch { token = row.value; }
      }
      if (!token) {
        token = process.env.TELEGRAM_BOT_TOKEN || '8857592268:AAGiB4PXMWli-Ag6s-LfBhK_hHeC4YQHWQE';
      }
    }
    if (!targetChat) {
      const row = db.prepare("SELECT value FROM settings WHERE key = 'telegram_chat_id'").get();
      if (row && row.value) {
        try { targetChat = JSON.parse(row.value); } catch { targetChat = row.value; }
      }
      if (!targetChat) {
        targetChat = process.env.TELEGRAM_CHAT_ID;
      }
    }

    if (!token || !targetChat) {
      return res.status(400).json({
        success: false,
        message: 'Telegram Bot Token yoki Chat ID kiritilmagan.'
      });
    }

    const text = `🟢 *Gastronom Khiva — Telegram Bot Aloqasi*\n\n` +
      `✅ Tabriklaymiz! Telegram Bot sozlamalari to‘g‘ri kiritildi.\n` +
      `🏪 Do‘kon: *Gastronom (Xiva, Mustaqillik ko‘chasi 17)*\n` +
      `🕒 Vaqt: ${new Date().toLocaleString('uz-UZ')}\n\n` +
      `Endilikda barcha yangi buyurtmalar ushbu guruh/kanalga lahzada yuboriladi!`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChat,
        text,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();
    if (!data.ok) {
      return res.status(400).json({
        success: false,
        message: `Telegram API xatosi: ${data.description || 'Xabar yuborilmadi'}`
      });
    }

    res.json({ success: true, message: 'Telegramga sinov xabari muvaffaqiyatli yuborildi!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Telegramga ulanishda xatolik: ' + err.message });
  }
});

export default router;
