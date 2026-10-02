import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import db from './db/connection.js';
import { initializeSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import checkoutRoutes from './routes/checkoutRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import contentRoutes from './routes/contentRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite Database schema
initializeSchema();

// Auto-seed if database is fresh (crucial for Render first deployment)
try {
  const adminCheck = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get();
  if (!adminCheck || adminCheck.count === 0) {
    console.log('[RENDER DEPLOYMENT] Fresh database detected. Auto-seeding catalog & admin...');
    seedDatabase(false);
  }
} catch (e) {
  console.warn('[DB AUTO-SEED] Skipped:', e.message);
}

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists on host (e.g. Render)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static uploads directory
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Gastronom E-commerce API',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production'
  });
});

// SEO Endpoints (Section 26)
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send("User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://gastronom.uz/sitemap.xml\n");
});

app.get('/sitemap.xml', (req, res) => {
  const sitemapPath = path.join(__dirname, '../../client/public/sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    res.type('application/xml').sendFile(sitemapPath);
  } else {
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://gastronom.uz/</loc><priority>1.0</priority></url>
</urlset>`);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);

// Global Error Handler (Section 30: Never expose raw stack traces)
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred. Please try again later.'
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Gastranom E-Commerce API running on port ${PORT}`);
  console.log(` Ready for customer & admin operations`);
  console.log(`===============================================`);
});

export default app;
