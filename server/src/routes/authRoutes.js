import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Register new customer
router.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, 'customer', 'active')
  `).run(name.trim(), email.toLowerCase().trim(), passwordHash, phone || null);

  const user = db.prepare('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ success: false, message: 'This account has been disabled. Contact support.' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    created_at: user.created_at
  };

  const token = generateToken(safeUser);

  res.json({
    success: true,
    message: 'Logged in successfully',
    token,
    user: safeUser
  });
});

// POST /api/auth/send-otp
router.post('/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.trim().length < 9) {
    return res.status(400).json({ success: false, message: 'Yaroqli telefon raqamini kiriting.' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // Invalidate previous OTPs for this phone
  db.prepare('UPDATE otps SET used = 1 WHERE phone = ?').run(cleanPhone);

  db.prepare(`
    INSERT INTO otps (phone, code, expires_at, used)
    VALUES (?, ?, ?, 0)
  `).run(cleanPhone, otpCode, expiresAt);

  console.log(`[OTP] Generated verification code for ${cleanPhone}: ${otpCode}`);

  res.json({
    success: true,
    message: 'Tasdiqlash kodi telefoningizga yuborildi.',
    demoCode: otpCode,
    expiresInSeconds: 300
  });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { phone, code, name } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ success: false, message: 'Telefon raqam va tasdiqlash kodi kiritilishi shart.' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const cleanCode = code.trim();

  const record = db.prepare(`
    SELECT * FROM otps
    WHERE phone = ? AND code = ? AND used = 0 AND datetime(expires_at) > datetime('now')
    ORDER BY id DESC LIMIT 1
  `).get(cleanPhone, cleanCode);

  if (!record) {
    return res.status(400).json({ success: false, message: 'Kiritilgan kod noto‘g‘ri yoki muddati o‘tgan.' });
  }

  // Mark OTP as used
  db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(record.id);

  // Check if user exists by phone
  let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(cleanPhone);

  if (!user) {
    const syntheticEmail = `user_${cleanPhone.replace(/[^0-9]/g, '')}@gastronom.uz`;
    const defaultName = name && name.trim() ? name.trim() : `Mijoz (${cleanPhone.slice(-4)})`;
    const dummyPasswordHash = bcrypt.hashSync(Math.random().toString(), 10);

    const insertResult = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, role, status)
      VALUES (?, ?, ?, ?, 'customer', 'active')
    `).run(defaultName, syntheticEmail, dummyPasswordHash, cleanPhone);

    user = db.prepare('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?').get(insertResult.lastInsertRowid);
  }

  if (user.status !== 'active') {
    return res.status(403).json({ success: false, message: 'Ushbu hisob faol emas. Qo‘llab-quvvatlash xizmatiga murojaat qiling.' });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    created_at: user.created_at
  };

  const token = generateToken(safeUser);

  res.json({
    success: true,
    message: 'Muvaffaqiyatli tizimga kirildi!',
    token,
    user: safeUser
  });
});

// Current user profile
router.get('/me', requireAuth, (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user.id);
  res.json({
    success: true,
    user: req.user,
    addresses
  });
});

// Update profile
router.put('/profile', requireAuth, (req, res) => {
  const { name, phone } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
  }

  db.prepare(`
    UPDATE users
    SET name = ?, phone = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(name.trim(), phone || null, req.user.id);

  const updated = db.prepare('SELECT id, name, email, phone, role, status FROM users WHERE id = ?').get(req.user.id);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: updated
  });
});

// Change password
router.put('/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  const isValid = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare(`
    UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
  `).run(newHash, req.user.id);

  res.json({ success: true, message: 'Password changed successfully.' });
});

// Manage Addresses
router.get('/addresses', requireAuth, (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC').all(req.user.id);
  res.json({ success: true, addresses });
});

router.post('/addresses', requireAuth, (req, res) => {
  const { title, recipient_name, phone, region, city, street, house, is_default } = req.body;

  if (!recipient_name || !phone || !region || !city || !street || !house) {
    return res.status(400).json({ success: false, message: 'All address fields are required.' });
  }

  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }

  const result = db.prepare(`
    INSERT INTO addresses (user_id, title, recipient_name, phone, region, city, street, house, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    title || 'Home',
    recipient_name,
    phone,
    region,
    city,
    street,
    house,
    is_default ? 1 : 0
  );

  const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, message: 'Address added', address });
});

router.put('/addresses/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { title, recipient_name, phone, region, city, street, house, is_default } = req.body;

  const existing = db.prepare('SELECT id FROM addresses WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Address not found' });
  }

  if (is_default) {
    db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }

  db.prepare(`
    UPDATE addresses
    SET title = ?, recipient_name = ?, phone = ?, region = ?, city = ?, street = ?, house = ?, is_default = ?
    WHERE id = ? AND user_id = ?
  `).run(
    title || 'Home',
    recipient_name,
    phone,
    region,
    city,
    street,
    house,
    is_default ? 1 : 0,
    id,
    req.user.id
  );

  const updated = db.prepare('SELECT * FROM addresses WHERE id = ?').get(id);
  res.json({ success: true, message: 'Address updated', address: updated });
});

router.delete('/addresses/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(id, req.user.id);
  res.json({ success: true, message: 'Address removed' });
});

export default router;
