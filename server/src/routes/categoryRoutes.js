import express from 'express';
import db from '../db/connection.js';
import { requireAdmin } from '../middleware/auth.js';
import { logAdminAction } from '../services/auditLogger.js';

const router = express.Router();

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// GET /api/categories
router.get('/', (req, res) => {
  const categories = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(id) FROM products WHERE category_id = c.id AND status = 'active') as products_count
    FROM categories c
    ORDER BY c.sort_order ASC, c.name ASC
  `).all();

  res.json({ success: true, categories });
});

// GET /api/categories/:slug
router.get('/:slug', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
  if (!category) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  const subcategories = db.prepare('SELECT * FROM categories WHERE parent_id = ? ORDER BY sort_order ASC').all(category.id);
  res.json({ success: true, category, subcategories });
});

// Admin: POST /api/categories
router.post('/', requireAdmin, (req, res) => {
  const { name, description, image_url, parent_id, sort_order = 0, is_active = 1 } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required' });
  }

  let slug = slugify(name);
  const exists = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
  if (exists) {
    slug = `${slug}-${Date.now()}`;
  }

  const result = db.prepare(`
    INSERT INTO categories (name, slug, description, image_url, parent_id, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, description || null, image_url || null, parent_id || null, sort_order, is_active ? 1 : 0);

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'CREATE_CATEGORY',
    entity: 'categories',
    entityId: category.id,
    newValue: { name, slug }
  });

  res.status(201).json({ success: true, message: 'Category created', category });
});

// Admin: PUT /api/categories/:id
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, image_url, parent_id, sort_order, is_active } = req.body;

  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  db.prepare(`
    UPDATE categories
    SET name = COALESCE(?, name),
        description = ?,
        image_url = ?,
        parent_id = ?,
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    name,
    description !== undefined ? description : existing.description,
    image_url !== undefined ? image_url : existing.image_url,
    parent_id !== undefined ? parent_id : existing.parent_id,
    sort_order,
    is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
    id
  );

  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'UPDATE_CATEGORY',
    entity: 'categories',
    entityId: id,
    oldValue: existing,
    newValue: updated
  });

  res.json({ success: true, message: 'Category updated', category: updated });
});

// Admin: DELETE /api/categories/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Category not found' });
  }

  // Check if products exist in category
  const prodCount = db.prepare('SELECT COUNT(id) as count FROM products WHERE category_id = ?').get(id);
  if (prodCount && prodCount.count > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete category because it contains ${prodCount.count} products. Reassign or delete the products first.`
    });
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);

  logAdminAction({
    adminId: req.user.id,
    adminName: req.user.name,
    action: 'DELETE_CATEGORY',
    entity: 'categories',
    entityId: id,
    oldValue: existing
  });

  res.json({ success: true, message: 'Category deleted' });
});

export default router;
