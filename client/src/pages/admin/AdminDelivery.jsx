import React, { useState, useEffect } from 'react';
import { Truck, Plus, Edit2, Trash2, X, MapPin } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminDelivery() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const [name, setName] = useState('');
  const [region, setRegion] = useState('Xorazm viloyati');
  const [price, setPrice] = useState('15000');
  const [freeThreshold, setFreeThreshold] = useState('150000');
  const [estimatedTime, setEstimatedTime] = useState('30-45 daqiqa');
  const [isActive, setIsActive] = useState(true);

  const { showToast } = useToast();

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAllDeliveryZones();
      if (res.success) setZones(res.zones || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (z = null) => {
    if (z) {
      setEditingZone(z);
      setName(z.name);
      setRegion(z.region);
      setPrice(String(z.price));
      setFreeThreshold(z.free_threshold ? String(z.free_threshold) : '');
      setEstimatedTime(z.estimated_time);
      setIsActive(z.is_active === 1);
    } else {
      setEditingZone(null);
      setName('');
      setRegion('Xorazm viloyati');
      setPrice('15000');
      setFreeThreshold('150000');
      setEstimatedTime('30-45 daqiqa');
      setIsActive(true);
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        region,
        price: Number(price),
        free_threshold: freeThreshold ? Number(freeThreshold) : null,
        estimated_time: estimatedTime,
        is_active: isActive ? 1 : 0
      };

      if (editingZone) {
        await api.admin.updateDeliveryZone(editingZone.id, payload);
        showToast('Yetkazib berish zonasi yangilandi!');
      } else {
        await api.admin.createDeliveryZone(payload);
        showToast('Yangi zona qo‘shildi!');
      }

      setModalOpen(false);
      await loadZones();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yetkazib berish zonasini o‘chirishni tasdiqlaysizmi?')) return;
    try {
      await api.admin.deleteDeliveryZone(id);
      showToast('Zona o‘chirildi.');
      await loadZones();
    } catch (err) {
      showToast(err.message || 'O‘chirib bo‘lmadi.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Yetkazib Berish Zonalarini Sozlash</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Hududlar, tariflar, bepul yetkazish chegaralari va yetkazish vaqtlari</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="btn btn-primary">
          <Plus size={18} /> Yangi zona qo‘shish
        </button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Zona nomi</th>
                <th style={{ padding: '0.85rem 1rem' }}>Viloyat / Shahar</th>
                <th style={{ padding: '0.85rem 1rem' }}>Standart narxi</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bepul xarid chegarasi</th>
                <th style={{ padding: '0.85rem 1rem' }}>Yetkazish vaqti</th>
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
                zones.map((z) => (
                  <tr key={z.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{z.name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{z.region}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{z.price.toLocaleString()} so‘m</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#10b981', fontWeight: '600' }}>
                      {z.free_threshold ? `≥ ${z.free_threshold.toLocaleString()} so‘m` : 'Mavjud emas'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>{z.estimated_time}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${z.is_active === 1 ? 'badge-success' : 'badge-neutral'}`}>
                        {z.is_active === 1 ? 'Faol' : 'Nofaol'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button onClick={() => handleOpenModal(z)} className="btn btn-secondary btn-sm btn-icon">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDelete(z.id)} className="btn btn-outline btn-sm btn-icon" style={{ color: 'var(--danger)' }}>
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

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem' }}>
              {editingZone ? 'Zonani tahrirlash' : 'Yangi yetkazib berish zonasi'}
            </h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Zona nomi *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Xiva markazi (0-5 km)"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Viloyat / Hudud *</label>
                <input
                  type="text"
                  required
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Yetkazish narxi (so‘m) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bepul yetkazish chegarasi</label>
                  <input
                    type="number"
                    value={freeThreshold}
                    onChange={(e) => setFreeThreshold(e.target.value)}
                    placeholder="Masalan: 250000"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Taxminiy yetkazish vaqti *</label>
                <input
                  type="text"
                  required
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                  placeholder="Masalan: 30-45 daqiqa"
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
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
