import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FolderTree, X, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getCategories();
      if (res.success) setCategories(res.categories || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setDescription(cat.description || '');
      setImageUrl(cat.image_url || '');
      setSortOrder(String(cat.sort_order || 0));
      setIsActive(cat.is_active === 1);
    } else {
      setEditingCategory(null);
      setName('');
      setDescription('');
      setImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?w=500');
      setSortOrder('0');
      setIsActive(true);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        sort_order: Number(sortOrder),
        is_active: isActive ? 1 : 0
      };

      if (editingCategory) {
        await api.admin.updateCategory(editingCategory.id, payload);
        showToast('Kategoriya yangilandi!');
      } else {
        await api.admin.createCategory(payload);
        showToast('Yangi kategoriya yaratildi!');
      }

      setModalOpen(false);
      await loadCategories();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Kategoriyani o‘chirishni tasdiqlaysizmi?')) return;
    try {
      await api.admin.deleteCategory(id);
      showToast('Kategoriya o‘chirildi.');
      await loadCategories();
    } catch (err) {
      showToast(err.message || 'O‘chirib bo‘lmadi.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Kategoriyalar Boshqaruvi</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Do‘kondagi tovarlar bo‘limlarini boshqarish</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="btn btn-primary">
          <Plus size={18} /> Yangi kategoriya
        </button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Rasm</th>
                <th style={{ padding: '0.85rem 1rem' }}>Kategoriya nomi</th>
                <th style={{ padding: '0.85rem 1rem' }}>Slug</th>
                <th style={{ padding: '0.85rem 1rem' }}>Mahsulotlar soni</th>
                <th style={{ padding: '0.85rem 1rem' }}>Tartib</th>
                <th style={{ padding: '0.85rem 1rem' }}>Holati</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <img
                        src={c.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                        alt=""
                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{c.name}</td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{c.slug}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>{c.products_count || 0} ta</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{c.sort_order}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${c.is_active === 1 ? 'badge-success' : 'badge-neutral'}`}>
                        {c.is_active === 1 ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button onClick={() => handleOpenModal(c)} className="btn btn-secondary btn-sm btn-icon">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="btn btn-outline btn-sm btn-icon" style={{ color: 'var(--danger)' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem' }}>
              {editingCategory ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Kategoriya nomi *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Organik mahsulotlar"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rasm URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tavsif</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tartib raqami</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="form-control"
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Kategoriya faol holatda bo‘lsin</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
