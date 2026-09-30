import jwt from 'jsonwebtoken';
import db from '../db/connection.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'gastranom_secret_jwt_key_2026_super_secure';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      // Fetch latest user status from DB
      const user = db.prepare('SELECT id, name, email, phone, role, status FROM users WHERE id = ?').get(decoded.id);
      if (user && user.status === 'active') {
        req.user = user;
      } else {
        req.user = null;
      }
    }
    next();
  });
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }

    const user = db.prepare('SELECT id, name, email, phone, role, status FROM users WHERE id = ?').get(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive or does not exist.' });
    }

    req.user = user;
    next();
  });
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const adminRoles = ['superadmin', 'admin', 'manager', 'operator', 'warehouse'];
    if (!adminRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied: Staff/Administrator privileges required.' });
    }
    next();
  });
}

export function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Super Admin privileges required.' });
    }
    next();
  });
}
