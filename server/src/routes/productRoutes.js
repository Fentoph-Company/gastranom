import express from 'express';
import db from '../db/connection.js';
import { requireAdmin, optionalAuth } from '../middleware/auth.js';
import { augmentProductWithDiscounts } from '../services/discountEngine.js';
import { logAdminAction } from '../services/auditLogger.js';

const router = express.Router();

// Helper to generate slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// GET /api/products - Catalog with search, multi-filters, sorting & pagination
router.get('/', (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      brand,
      min_price,
      max_price,
      in_stock,
      on_sale,
      featured,
      popular,
      is_new,
      sort = 'recommended',
      tag
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let conditions = ["p.status = 'active'"];
    let params = [];

    if (search && search.trim()) {
      conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.tags LIKE ? OR b.name LIKE ?)');
      const q = `%${search.trim()}%`;
      params.push(q, q, q, q, q, q);
    }

    if (category) {
      conditions.push('(c.slug = ? OR c.id = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ?))');
      params.push(category, category, category);
    }

    if (brand) {
      conditions.push('(b.slug = ? OR b.id = ?)');
      params.push(brand, brand);
    }

    if (min_price) {
      conditions.push('p.price >= ?');
      params.push(Number(min_price));
    }

    if (max_price) {
      conditions.push('p.price <= ?');
      params.push(Number(max_price));
    }

    if (in_stock === 'true' || in_stock === '1') {
      conditions.push('p.stock_quantity > 0');
    }

    if (featured === 'true' || featured === '1') {
      conditions.push('p.is_featured = 1');
    }

    if (popular === 'true' || popular === '1') {
      conditions.push('p.is_popular = 1');
    }

    if (is_new === 'true' || is_new === '1') {
      conditions.push('p.is_new = 1');
    }

    if (tag) {
      conditions.push('p.tags LIKE ?');
      params.push(`%${tag}%`);
    }

    let orderBy = 'p.id DESC';
    switch (sort) {
      case 'newest':
        orderBy = 'p.created_at DESC';
        break;
      case 'price_asc':
        orderBy = 'p.price ASC';
        break;
      case 'price_desc':
        orderBy = 'p.price DESC';
        break;
      case 'popular':
        orderBy = 'p.sold_quantity DESC, p.is_popular DESC';
        break;
      case 'discount':
        orderBy = '(p.previous_price - p.price) DESC';
        break;
      case 'recommended':
      default:
        orderBy = 'p.is_featured DESC, p.sold_quantity DESC, p.id DESC';
        break;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count for pagination
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
    `;
    const totalResult = db.prepare(countSql).get(...params);
    const total = totalResult ? totalResult.total : 0;

    // Fetch products
    const productsSql = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) as primary_image,
        (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND status = 'approved') as average_rating,
        (SELECT COUNT(id) FROM reviews WHERE product_id = p.id AND status = 'approved') as reviews_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const rawProducts = db.prepare(productsSql).all(...params, Number(limit), offset);

    // Apply live discounts
    let products = rawProducts.map(p => augmentProductWithDiscounts(p));

    if (on_sale === 'true' || on_sale === '1') {
      products = products.filter(p => p.has_discount);
    }

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve products' });
  }
});

// GET /api/products/search/suggestions
router.get('/search/suggestions', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    return res.json({ success: true, suggestions: [] });
  }

  const query = `%${q.trim()}%`;
  const products = db.prepare(`
    SELECT p.id, p.name, p.slug, p.price, p.stock_quantity, p.unit,
      (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as image,
      b.name as brand_name
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE p.status = 'active' AND (
      p.name LIKE ? OR p.tags LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR b.name LIKE ?
    )
    LIMIT 8
  `).all(query, query, query, query, query);

  const categories = db.prepare(`
    SELECT id, name, slug FROM categories WHERE is_active = 1 AND name LIKE ? LIMIT 3
  `).all(query);

  res.json({
    success: true,
    suggestions: {
      products: products.map(p => augmentProductWithDiscounts(p)),
      categories
    }
  });
});

// GET /api/products/:slugOrId - Single product with gallery, variants, specs, reviews
router.get('/:slugOrId', optionalAuth, (req, res) => {
  const { slugOrId } = req.params;

  const isNumeric = /^\d+$/.test(slugOrId);
  const sql = `
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug,
      b.name as brand_name,
      b.slug as brand_slug,
      (SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND status = 'approved') as average_rating,
      (SELECT COUNT(id) FROM reviews WHERE product_id = p.id AND status = 'approved') as reviews_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'}
  `;

  const rawProduct = db.prepare(sql).get(slugOrId);
  if (!rawProduct) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Parse specifications JSON if exists
  let specs = [];
  try {
    if (rawProduct.specifications) {
      specs = JSON.parse(rawProduct.specifications);
    }
  } catch (e) {
    specs = [];
  }

  // Get images
  const images = db.prepare(`
    SELECT id, image_url, is_primary, sort_order
    FROM product_images
    WHERE product_id = ?
    ORDER BY is_primary DESC, sort_order ASC
  `).all(rawProduct.id);

  // Get variants
  const variants = db.prepare(`
    SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC
  `).all(rawProduct.id).map(v => {
    let attrs = {};
    try {
      if (v.attributes) attrs = JSON.parse(v.attributes);
    } catch (e) {}
    return { ...v, attributes: attrs };
  });

  // Check if current user has wishlisted this product
  let isWishlisted = false;
  if (req.user) {
    const wish = db.prepare('SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?').get(req.user.id, rawProduct.id);
    if (wish) isWishlisted = true;
  }

  // Related products in same category
  const relatedRaw = db.prepare(`
    SELECT p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC LIMIT 1) as primary_image
    FROM products p
    WHERE p.category_id = ? AND p.id != ? AND p.status = 'active'
    LIMIT 4
  `).all(rawProduct.category_id, rawProduct.id);

  const related = relatedRaw.map(p => augmentProductWithDiscounts(p));
  const product = augmentProductWithDiscounts(rawProduct);

  res.json({
    success: true,
    product: {
      ...product,
      specifications: specs,
      images,
      variants,
      isWishlisted,
      related
    }
  });
});

// Admin: POST /api/products - Create product
router.post('/', requireAdmin, (req, res) => {
  const {
    name,
    category_id,
    brand_id,
    sku,
    price,
    previous_price,
    stock_quantity,
    description,
    short_description,
    weight,
    dimensions,
    tags,
    specifications,
    images = [],
    variants = [],
    is_featured = 0,
    is_popular = 0,
    is_new = 1,
    is_bestseller = 0,
    unit = 'dona',
    barcode = null,
    min_order_quantity = 1,
    max_order_quantity = 99,
    status = 'active'
  } = req.body;

  if (!name || !category_id || !sku || price === undefined) {
    return res.status(400).json({ success: false, message: 'Name, Category, SKU, and Price are required.' });
  }

  const existingSku = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
  if (existingSku) {
    return res.status(400).json({ success: false, message: 'SKU already exists.' });
  }

  let slug = slugify(name);
  let slugExists = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
  if (slugExists) {
    slug = `${slug}-${Date.now()}`;
  }

  const specsJson = typeof specifications === 'object' ? JSON.stringify(specifications) : specifications;

  const insertTx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO products (
        name, slug, description, short_description, category_id, brand_id, sku,
        price, previous_price, stock_quantity, status, weight, dimensions, tags,
        specifications, is_featured, is_popular, is_new, is_bestseller, unit, barcode, min_order_quantity, max_order_quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      slug,
      description || '',
      short_description || '',
      category_id,
      brand_id || null,
      sku,
      Number(price),
      previous_price ? Number(previous_price) : null,
      Number(stock_quantity || 0),
      status,
      weight || null,
      dimensions || null,
      tags || null,
      specsJson || '[]',
      is_featured ? 1 : 0,
      is_popular ? 1 : 0,
      is_new ? 1 : 0,
      is_bestseller ? 1 : 0,
      unit || 'dona',
      barcode || null,
      Number(min_order_quantity || 1),
      Number(max_order_quantity || 99)
    );

    const productId = result.lastInsertRowid;

    // Insert images
    if (images && images.length > 0) {
      const imgStmt = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)');
      images.forEach((img, idx) => {
        const url = typeof img === 'string' ? img : img.image_url;
        imgStmt.run(productId, url, idx, idx === 0 ? 1 : 0);
      });
    }

    // Insert variants
    if (variants && variants.length > 0) {
      const varStmt = db.prepare(`
        INSERT INTO product_variants (product_id, title, sku, price, stock_quantity, image_url, attributes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      variants.forEach(v => {
        varStmt.run(
          productId,
          v.title,
          v.sku || `${sku}-${slugify(v.title)}`,
          Number(v.price || price),
          Number(v.stock_quantity || 0),
          v.image_url || null,
          typeof v.attributes === 'object' ? JSON.stringify(v.attributes) : v.attributes || '{}'
        );
      });
    }

    return productId;
  });

  const productId = insertTx();

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'CREATE_PRODUCT',
    entity: 'products',
    entityId: productId,
    newValue: { name, sku, price, stock_quantity }
  });

  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  res.status(201).json({ success: true, message: 'Product created successfully', product: created });
});

// Admin: PUT /api/products/:id - Update product
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const oldProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!oldProduct) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const {
    name,
    category_id,
    brand_id,
    sku,
    price,
    previous_price,
    stock_quantity,
    description,
    short_description,
    weight,
    dimensions,
    tags,
    specifications,
    images,
    variants,
    is_featured,
    is_popular,
    is_new,
    is_bestseller,
    unit,
    barcode,
    min_order_quantity,
    max_order_quantity,
    status
  } = req.body;

  const updateTx = db.transaction(() => {
    const specsJson = typeof specifications === 'object' ? JSON.stringify(specifications) : (specifications ?? oldProduct.specifications);

    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        short_description = COALESCE(?, short_description),
        category_id = COALESCE(?, category_id),
        brand_id = ?,
        sku = COALESCE(?, sku),
        price = COALESCE(?, price),
        previous_price = ?,
        stock_quantity = COALESCE(?, stock_quantity),
        status = COALESCE(?, status),
        weight = ?,
        dimensions = ?,
        tags = COALESCE(?, tags),
        specifications = ?,
        is_featured = COALESCE(?, is_featured),
        is_popular = COALESCE(?, is_popular),
        is_new = COALESCE(?, is_new),
        is_bestseller = COALESCE(?, is_bestseller),
        unit = COALESCE(?, unit),
        barcode = ?,
        min_order_quantity = COALESCE(?, min_order_quantity),
        max_order_quantity = COALESCE(?, max_order_quantity),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name,
      description,
      short_description,
      category_id,
      brand_id !== undefined ? brand_id : oldProduct.brand_id,
      sku,
      price !== undefined ? Number(price) : oldProduct.price,
      previous_price !== undefined ? Number(previous_price) : oldProduct.previous_price,
      stock_quantity !== undefined ? Number(stock_quantity) : oldProduct.stock_quantity,
      status,
      weight !== undefined ? weight : oldProduct.weight,
      dimensions !== undefined ? dimensions : oldProduct.dimensions,
      tags,
      specsJson,
      is_featured !== undefined ? (is_featured ? 1 : 0) : oldProduct.is_featured,
      is_popular !== undefined ? (is_popular ? 1 : 0) : oldProduct.is_popular,
      is_new !== undefined ? (is_new ? 1 : 0) : oldProduct.is_new,
      is_bestseller !== undefined ? (is_bestseller ? 1 : 0) : oldProduct.is_bestseller,
      unit !== undefined ? unit : oldProduct.unit,
      barcode !== undefined ? barcode : oldProduct.barcode,
      min_order_quantity !== undefined ? Number(min_order_quantity) : oldProduct.min_order_quantity,
      max_order_quantity !== undefined ? Number(max_order_quantity) : oldProduct.max_order_quantity,
      id
    );

    // Update images if provided
    if (images && Array.isArray(images)) {
      db.prepare('DELETE FROM product_images WHERE product_id = ?').run(id);
      const imgStmt = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)');
      images.forEach((img, idx) => {
        const url = typeof img === 'string' ? img : img.image_url;
        imgStmt.run(id, url, idx, idx === 0 ? 1 : 0);
      });
    }

    // Update variants if provided
    if (variants && Array.isArray(variants)) {
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(id);
      const varStmt = db.prepare(`
        INSERT INTO product_variants (product_id, title, sku, price, stock_quantity, image_url, attributes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      variants.forEach(v => {
        varStmt.run(
          id,
          v.title,
          v.sku || `${sku || oldProduct.sku}-${slugify(v.title)}`,
          Number(v.price || price || oldProduct.price),
          Number(v.stock_quantity || 0),
          v.image_url || null,
          typeof v.attributes === 'object' ? JSON.stringify(v.attributes) : v.attributes || '{}'
        );
      });
    }
  });

  updateTx();

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'UPDATE_PRODUCT',
    entity: 'products',
    entityId: id,
    oldValue: { name: oldProduct.name, price: oldProduct.price, stock: oldProduct.stock_quantity },
    newValue: { name, price, stock_quantity }
  });

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({ success: true, message: 'Product updated successfully', product: updated });
});

// Admin: DELETE /api/products/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'DELETE_PRODUCT',
    entity: 'products',
    entityId: id,
    oldValue: { name: product.name, sku: product.sku }
  });

  res.json({ success: true, message: 'Product deleted successfully.' });
});

// Admin: POST /api/products/bulk - Bulk operations
router.post('/bulk', requireAdmin, (req, res) => {
  const { action, ids, data } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'No products selected.' });
  }

  const placeholders = ids.map(() => '?').join(',');

  const bulkTx = db.transaction(() => {
    switch (action) {
      case 'delete':
        db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...ids);
        break;
      case 'change_status':
        if (!data || !data.status) throw new Error('Status is required');
        db.prepare(`UPDATE products SET status = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`).run(data.status, ...ids);
        break;
      case 'change_category':
        if (!data || !data.category_id) throw new Error('Category is required');
        db.prepare(`UPDATE products SET category_id = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`).run(data.category_id, ...ids);
        break;
      case 'adjust_price':
        // e.g. percent change or fixed change
        if (data && data.percent) {
          db.prepare(`
            UPDATE products 
            SET price = ROUND(price * (1 + ? / 100)), updated_at = datetime('now')
            WHERE id IN (${placeholders})
          `).run(Number(data.percent), ...ids);
        }
        break;
      case 'adjust_stock':
        if (data && data.stock !== undefined) {
          db.prepare(`
            UPDATE products 
            SET stock_quantity = ?, updated_at = datetime('now')
            WHERE id IN (${placeholders})
          `).run(Number(data.stock), ...ids);
        }
        break;
      default:
        throw new Error(`Unsupported bulk action: ${action}`);
    }
  });

  try {
    bulkTx();
    logAdminAction({
      adminId: req.user.id,
      adminName: req.user.name,
      action: `BULK_${action.toUpperCase()}`,
      entity: 'products',
      entityId: ids.join(','),
      newValue: data
    });

    res.json({ success: true, message: `Bulk action "${action}" completed for ${ids.length} products.` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
