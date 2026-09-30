import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
  Image,
  Tag,
  Boxes,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [prevPrice, setPrevPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState('active');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [unit, setUnit] = useState('dona');
  const [barcode, setBarcode] = useState('');
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [minOrderQty, setMinOrderQty] = useState('1');
  const [maxOrderQty, setMaxOrderQty] = useState('99');

  // Variants state in modal
  const [variants, setVariants] = useState([]);
  const [varTitle, setVarTitle] = useState('');
  const [varPrice, setVarPrice] = useState('');
  const [varStock, setVarStock] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [search, selectedCategory]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success) setCategories(res.categories || []);
    } catch (e) {}
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.getProducts(params);
      if (res.success) setProducts(res.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setName(prod.name);
      setSku(prod.sku);
      setPrice(prod.price);
      setPrevPrice(prod.previous_price || '');
      setStock(prod.stock_quantity);
      setCategoryId(prod.category_id);
      setDescription(prod.description || '');
      setWeight(prod.weight || '');
      setStatus(prod.status || 'active');
      setImageUrl(prod.primary_image || '');
      setIsFeatured(prod.is_featured === 1);
      setUnit(prod.unit || 'dona');
      setBarcode(prod.barcode || '');
      setIsBestseller(prod.is_bestseller === 1);
      setIsNew(prod.is_new === 1);
      setMinOrderQty(prod.min_order_quantity || '1');
      setMaxOrderQty(prod.max_order_quantity || '99');
      setVariants(prod.variants || []);
    } else {
      setEditingProduct(null);
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setPrice('');
      setPrevPrice('');
      setStock('20');
      setCategoryId(categories[0]?.id || '');
      setDescription('');
      setWeight('');
      setStatus('active');
      setImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?w=800');
      setIsFeatured(false);
      setUnit('dona');
      setBarcode(Math.floor(4780000000000 + Math.random() * 999999999).toString());
      setIsBestseller(false);
      setIsNew(true);
      setMinOrderQty('1');
      setMaxOrderQty('99');
      setVariants([]);
    }
    setModalOpen(true);
  };

  const handleAddVariant = () => {
    if (!varTitle.trim() || !varPrice) {
      showToast('Variant nomi va narxi talab qilinadi.', 'warning');
      return;
    }

    setVariants([
      ...variants,
      {
        title: varTitle.trim(),
        price: Number(varPrice),
        stock_quantity: Number(varStock || stock || 10)
      }
    ]);
    setVarTitle('');
    setVarPrice('');
    setVarStock('');
  };

  const handleRemoveVariant = (idx) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!name || !sku || !price || !categoryId) {
      showToast('Nomi, SKU, Narxi va Kategoriyasi to‘ldirilishi shart.', 'warning');
      return;
    }

    try {
      const payload = {
        name,
        sku,
        price: Number(price),
        previous_price: prevPrice ? Number(prevPrice) : null,
        stock_quantity: Number(stock || 0),
        category_id: Number(categoryId),
        description,
        weight,
        status,
        images: imageUrl ? [imageUrl] : [],
        variants,
        is_featured: isFeatured ? 1 : 0,
        unit,
        barcode: barcode || null,
        is_bestseller: isBestseller ? 1 : 0,
        is_new: isNew ? 1 : 0,
        min_order_quantity: Number(minOrderQty || 1),
        max_order_quantity: Number(maxOrderQty || 99)
      };

      if (editingProduct) {
        await api.admin.updateProduct(editingProduct.id, payload);
        showToast('Mahsulot yangilandi!');
      } else {
        await api.admin.createProduct(payload);
        showToast('Yangi mahsulot yaratildi!');
      }

      setModalOpen(false);
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Ushbu mahsulotni o‘chirishni tasdiqlaysizmi?')) return;
    try {
      await api.admin.deleteProduct(id);
      showToast('Mahsulot o‘chirildi.');
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'O‘chirib bo‘lmadi.', 'error');
    }
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`${selectedIds.length} ta mahsulotni o‘chirishni tasdiqlaysizmi?`)) return;

    try {
      let data = {};
      if (action === 'change_status') {
        const newStatus = prompt('Yangi holatni kiriting (active / draft / archived):', 'active');
        if (!newStatus) return;
        data.status = newStatus;
      } else if (action === 'change_category') {
        const catOptions = categories.map((c) => `${c.id}: ${c.name}`).join('\n');
        const chosenId = prompt(`Yangi kategoriya ID raqamini kiriting:\n${catOptions}`);
        if (!chosenId) return;
        data.category_id = Number(chosenId);
      } else if (action === 'adjust_price') {
        const percentStr = prompt('Narxni necha foizga o‘zgartirmoqchisiz? (Masalan: 10 oshirish uchun, yoki -15 chegirma uchun):', '10');
        if (!percentStr) return;
        data.percent = Number(percentStr);
      } else if (action === 'adjust_stock') {
        const stockStr = prompt('Barcha tanlangan mahsulotlar uchun yangi ombor qoldig‘i miqdorini kiriting:', '50');
        if (!stockStr) return;
        data.stock = Number(stockStr);
      }

      await api.admin.bulkProducts(action, selectedIds, data);
      showToast(`Tanlangan ${selectedIds.length} ta mahsulot bo‘yicha "${action}" amali muvaffaqiyatli bajarildi.`);
      setSelectedIds([]);
      await loadProducts();
    } catch (err) {
      showToast(err.message || 'Amalni bajarib bo‘lmadi.', 'error');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nomi yoki SKU bo‘yicha qidirish..."
              className="form-control"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-control"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <button onClick={() => handleOpenModal(null)} className="btn btn-primary">
          <Plus size={18} />
          <span>Yangi mahsulot</span>
        </button>
      </div>

      {/* Bulk actions bar if items selected */}
      {selectedIds.length > 0 && (
        <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem' }}>
            Tanlandi: <b>{selectedIds.length}</b> ta mahsulot
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button onClick={() => handleBulkAction('change_status')} className="btn btn-secondary btn-sm">
              Holat
            </button>
            <button onClick={() => handleBulkAction('change_category')} className="btn btn-secondary btn-sm">
              Kategoriya
            </button>
            <button onClick={() => handleBulkAction('adjust_price')} className="btn btn-secondary btn-sm">
              Narx %
            </button>
            <button onClick={() => handleBulkAction('adjust_stock')} className="btn btn-secondary btn-sm">
              Qoldiq
            </button>
            <button onClick={() => handleBulkAction('delete')} className="btn btn-danger btn-sm">
              O‘chirish
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={toggleSelectAll}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                </th>
                <th style={{ padding: '0.85rem 1rem' }}>Mahsulot</th>
                <th style={{ padding: '0.85rem 1rem' }}>Kategoriya</th>
                <th style={{ padding: '0.85rem 1rem' }}>SKU</th>
                <th style={{ padding: '0.85rem 1rem' }}>Narx</th>
                <th style={{ padding: '0.85rem 1rem' }}>Qoldiq</th>
                <th style={{ padding: '0.85rem 1rem' }}>Holat</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Mahsulotlar yuklanmoqda...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Mahsulotlar topilmadi.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: isSelected ? 'var(--primary-light)' : 'transparent' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(p.id)}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={p.primary_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'}
                            alt=""
                            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{p.name}</div>
                            {p.has_discount && (
                              <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                                -{p.discount_percent}% Chegirma
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{p.category_name}</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.sku}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>
                        <div>{p.effective_price.toLocaleString()} so‘m</div>
                        {p.has_discount && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {p.original_display_price.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: '700', color: p.stock_quantity <= 5 ? '#dc2626' : 'var(--text-main)' }}>
                          {p.stock_quantity} ta
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleOpenModal(p)}
                            className="btn btn-secondary btn-sm btn-icon"
                            title="Tahrirlash"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="btn btn-outline btn-sm btn-icon"
                            style={{ color: 'var(--danger)' }}
                            title="O‘chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                {editingProduct ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot yaratish'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="btn-icon">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Mahsulot nomi *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: Lavazza Qualità Oro 100% Arabica"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kategoriya *</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="form-control"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">SKU kodi *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Narxi (so‘m) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Masalan: 120000"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Oldingi narxi (chegirma bo‘lsa)</label>
                  <input
                    type="number"
                    value={prevPrice}
                    onChange={(e) => setPrevPrice(e.target.value)}
                    placeholder="Masalan: 150000"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ombordagi qoldiq soni *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">O‘lchov birligi (Unit) *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="form-control"
                  >
                    <option value="dona">dona (Dona)</option>
                    <option value="kg">kg (Kilogramm)</option>
                    <option value="g">g (Gramm)</option>
                    <option value="litr">litr (Litr)</option>
                    <option value="ml">ml (Millilitr)</option>
                    <option value="qadoq">qadoq (Qadoq / Pachka)</option>
                    <option value="blok">blok (Blok)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Shtrix-kod (Barcode)</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Masalan: 4780054321012"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Holat</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="form-control"
                  >
                    <option value="active">Active (Faol)</option>
                    <option value="draft">Draft (Qoralama)</option>
                    <option value="archived">Archived (Arxiv)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Min / Max buyurtma miqdori</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="1"
                      placeholder="Min: 1"
                      value={minOrderQty}
                      onChange={(e) => setMinOrderQty(e.target.value)}
                      className="form-control"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Max: 99"
                      value={maxOrderQty}
                      onChange={(e) => setMaxOrderQty(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Rasm havolasi (URL)</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="form-control"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Batafsil tavsif</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mahsulot tarkibi, foydasi va xususiyatlari..."
                    className="form-control"
                  />
                </div>

                {/* Variants Manager */}
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Variantlar (Hajm, Og‘irlik yoki Rang)</label>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder="Masalan: 500 g"
                      value={varTitle}
                      onChange={(e) => setVarTitle(e.target.value)}
                      className="form-control"
                    />
                    <input
                      type="number"
                      placeholder="Narxi"
                      value={varPrice}
                      onChange={(e) => setVarPrice(e.target.value)}
                      className="form-control"
                    />
                    <input
                      type="number"
                      placeholder="Qoldiq"
                      value={varStock}
                      onChange={(e) => setVarStock(e.target.value)}
                      className="form-control"
                      style={{ width: '100px' }}
                    />
                    <button type="button" onClick={handleAddVariant} className="btn btn-secondary">
                      Variant qo‘shish
                    </button>
                  </div>

                  {variants.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {variants.map((v, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <span><b>{v.title}</b> — {Number(v.price).toLocaleString()} so‘m ({v.stock_quantity} dona)</span>
                          <button type="button" onClick={() => handleRemoveVariant(i)} style={{ color: 'var(--danger)' }}>
                            <X size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: 'span 2', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>⭐ Tanlangan (Featured)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={isBestseller}
                      onChange={(e) => setIsBestseller(e.target.checked)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>🔥 Xaridorgir (Bestseller)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={isNew}
                      onChange={(e) => setIsNew(e.target.checked)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>✨ Yangi mahsulot (New)</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Saqlash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
