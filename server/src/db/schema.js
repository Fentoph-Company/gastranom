import db from './connection.js';

export function initializeSchema() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer', -- 'customer', 'admin', 'superadmin', 'manager'
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'disabled'
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Addresses table
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'Home',
      recipient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      region TEXT NOT NULL,
      city TEXT NOT NULL,
      street TEXT NOT NULL,
      house TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Brands table
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      short_description TEXT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      brand_id INTEGER REFERENCES brands(id),
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      previous_price REAL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      reserved_stock INTEGER NOT NULL DEFAULT 0,
      sold_quantity INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'draft', 'archived'
      weight TEXT,
      dimensions TEXT,
      tags TEXT, -- comma-separated
      specifications TEXT, -- JSON array of {key, value}
      is_featured INTEGER DEFAULT 0,
      is_popular INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Product Images table
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0
    );

    -- Product Variants table (Size, Color, Weight, Storage, etc.)
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      sku TEXT UNIQUE,
      price REAL NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      attributes TEXT, -- JSON object e.g. {"Weight": "1 kg"}
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Scheduled Discounts & Promotions
    CREATE TABLE IF NOT EXISTS discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL, -- 'percentage', 'fixed'
      value REAL NOT NULL,
      start_date TEXT NOT NULL, -- ISO timestamp
      end_date TEXT NOT NULL, -- ISO timestamp
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount_amount REAL,
      banner_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Coupons table
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount_amount REAL,
      max_uses INTEGER DEFAULT 100,
      current_uses INTEGER DEFAULT 0,
      per_user_limit INTEGER DEFAULT 1,
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Coupon Usage table
    CREATE TABLE IF NOT EXISTS coupon_usages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      used_at TEXT DEFAULT (datetime('now'))
    );

    -- Delivery Zones table
    CREATE TABLE IF NOT EXISTS delivery_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      price REAL NOT NULL,
      free_threshold REAL,
      estimated_time TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      delivery_zone_id INTEGER REFERENCES delivery_zones(id),
      delivery_address TEXT NOT NULL,
      delivery_fee REAL NOT NULL DEFAULT 0,
      delivery_instructions TEXT,
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      coupon_code TEXT,
      coupon_discount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cod', -- 'cod', 'payme', 'click', 'card'
      payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
      order_status TEXT NOT NULL DEFAULT 'received', -- 'received', 'confirmed', 'preparing', 'ready', 'courier_assigned', 'out_for_delivery', 'delivered', 'cancelled'
      internal_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Order Items table
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      product_name TEXT NOT NULL,
      variant_name TEXT,
      sku TEXT,
      unit_price REAL NOT NULL,
      original_price REAL NOT NULL,
      discount_applied REAL DEFAULT 0,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL
    );

    -- Product Reviews & Ratings
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      image_url TEXT,
      is_verified_purchase INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Customer Wishlist
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );

    -- Cart Items
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      session_id TEXT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL, -- 'order_status', 'promotion', 'admin_new_order', 'admin_low_stock', 'admin_review'
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Banners for Home / Promotions
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subtitle TEXT,
      image_url TEXT NOT NULL,
      link_url TEXT NOT NULL,
      badge_text TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Central Store Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Admin Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- OTP verification table
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_discounts_dates ON discounts(start_date, end_date, is_active);
    CREATE INDEX IF NOT EXISTS idx_cart_session ON cart_items(session_id);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
  `);

  // Safe migrations for newly added columns
  const addColumnIfNotExists = (table, colDef) => {
    try {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${colDef}`).run();
    } catch (e) {
      // Column already exists
    }
  };

  addColumnIfNotExists('products', "unit TEXT DEFAULT 'dona'");
  addColumnIfNotExists('products', "barcode TEXT");
  addColumnIfNotExists('products', "min_order_quantity INTEGER DEFAULT 1");
  addColumnIfNotExists('products', "max_order_quantity INTEGER DEFAULT 50");
  addColumnIfNotExists('products', "is_bestseller INTEGER DEFAULT 0");
  addColumnIfNotExists('orders', "delivery_type TEXT DEFAULT 'delivery'");
  addColumnIfNotExists('orders', "delivery_worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL");

  try {
    db.prepare('CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)').run();
  } catch (e) {}

  console.log('Database schema successfully initialized.');
}
