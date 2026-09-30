import React, { useState, useEffect } from 'react';
import { Percent, Plus, Tag, Clock, Trash2, Edit2, X, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminDiscounts() {
  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' or 'coupons'
  const [discounts, setDiscounts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Discount Campaign Modal
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState(null);
  const [discTitle, setDiscTitle] = useState('');
  const [discType, setDiscType] = useState('percentage');
  const [discValue, setDiscValue] = useState('');
  const [discStartDate, setDiscStartDate] = useState('');
  const [discEndDate, setDiscEndDate] = useState('');
  const [discCategory, setDiscCategory] = useState('');
  const [discMaxAmount, setDiscMaxAmount] = useState('');

  // Coupon Modal
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [coupCode, setCoupCode] = useState('');
  const [coupType, setCoupType] = useState('percentage');
  const [coupValue, setCoupValue] = useState('');
  const [coupMinOrder, setCoupMinOrder] = useState('100000');
  const [coupMaxUses, setCoupMaxUses] = useState('100');
  const [coupExpires, setCoupExpires] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
    api.getCategories().then((res) => {
      if (res.success) setCategories(res.categories || []);
    }).catch(() => {});
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'campaigns') {
        const res = await api.admin.getAllDiscounts();
        if (res.success) setDiscounts(res.discounts || []);
      } else {
        const res = await api.admin.getAllCoupons();
        if (res.success) setCoupons(res.coupons || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCampaignModal = (item = null) => {
    if (item) {
      setEditingDisc(item);
      setDiscTitle(item.title);
      setDiscType(item.type);
      setDiscValue(String(item.value));
      setDiscStartDate(item.start_date?.slice(0, 16) || '');
      setDiscEndDate(item.end_date?.slice(0, 16) || '');
      setDiscCategory(item.category_id || '');
      setDiscMaxAmount(item.max_discount_amount ? String(item.max_discount_amount) : '');
    } else {
      setEditingDisc(null);
      setDiscTitle('');
      setDiscType('percentage');
      setDiscValue('15');
      const now = new Date();
      setDiscStartDate(now.toISOString().slice(0, 16));
      now.setDate(now.getDate() + 14);
      setDiscEndDate(now.toISOString().slice(0, 16));
      setDiscCategory('');
      setDiscMaxAmount('50000');
    }
    setCampaignModalOpen(true);
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: discTitle,
        type: discType,
        value: Number(discValue),
        start_date: new Date(discStartDate).toISOString(),
        end_date: new Date(discEndDate).toISOString(),
        category_id: discCategory ? Number(discCategory) : null,
        max_discount_amount: discMaxAmount ? Number(discMaxAmount) : null
      };

      if (editingDisc) {
        await api.admin.updateDiscount(editingDisc.id, payload);
        showToast('Chegirma kampaniyasi yangilandi!');
      } else {
        await api.admin.createDiscount(payload);
        showToast('Yangi chegirma kampaniyasi yaratildi!');
      }

      setCampaignModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Chegirma kampaniyasini o‘chirishni tasdiqlaysizmi?')) return;
    try {
      await api.admin.deleteDiscount(id);
      showToast('Aksiya o‘chirildi.');
      await loadData();
    } catch (err) {
      showToast(err.message || 'O‘chirib bo‘lmadi.', 'error');
    }
  };

  // Coupons
  const handleOpenCouponModal = (coup = null) => {
    if (coup) {
      setEditingCoupon(coup);
      setCoupCode(coup.code);
      setCoupType(coup.discount_type);
      setCoupValue(String(coup.discount_value));
      setCoupMinOrder(String(coup.min_order_amount || 0));
      setCoupMaxUses(String(coup.max_uses || 100));
      setCoupExpires(coup.expires_at?.slice(0, 16) || '');
    } else {
      setEditingCoupon(null);
      setCoupCode(`PROMO${Math.floor(10 + Math.random() * 90)}`);
      setCoupType('percentage');
      setCoupValue('10');
      setCoupMinOrder('100000');
      setCoupMaxUses('100');
      const now = new Date();
      now.setDate(now.getDate() + 30);
      setCoupExpires(now.toISOString().slice(0, 16));
    }
    setCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: coupCode.toUpperCase().trim(),
        discount_type: coupType,
        discount_value: Number(coupValue),
        min_order_amount: Number(coupMinOrder || 0),
        max_uses: Number(coupMaxUses || 100),
        expires_at: coupExpires ? new Date(coupExpires).toISOString() : null
      };

      if (editingCoupon) {
        await api.admin.updateCoupon(editingCoupon.id, payload);
        showToast('Kupon yangilandi!');
      } else {
        await api.admin.createCoupon(payload);
        showToast('Yangi kupon yaratildi!');
      }

      setCouponModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Kuponni o‘chirishni tasdiqlaysizmi?')) return;
    try {
      await api.admin.deleteCoupon(id);
      showToast('Kupon o‘chirildi.');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Chegirmalar va Promokodlar Boshqaruvi</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rejalashtirilgan aksiyalar, sanalar bo‘yicha chegirmalar va kupon kodlari</p>
        </div>

        <button
          onClick={() => (activeTab === 'campaigns' ? handleOpenCampaignModal(null) : handleOpenCouponModal(null))}
          className="btn btn-primary"
        >
          <Plus size={18} /> {activeTab === 'campaigns' ? 'Yangi Aksiya yaratish' : 'Yangi Kupon yaratish'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('campaigns')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'campaigns' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'campaigns' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Clock size={16} /> Rejalashtirilgan Chegirma Kampaniyalari ({discounts.length})
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'coupons' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'coupons' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Tag size={16} /> Promokodlar va Kuponlar ({coupons.length})
        </button>
      </div>

      {/* Tab 1: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Aksiya nomi</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Chegirma</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Qamrovi</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Boshlanish vaqti</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Tugash vaqti</th>
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
                ) : discounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aksiya kampaniyalari mavjud emas.
                    </td>
                  </tr>
                ) : (
                  discounts.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{d.title}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-danger">
                          {d.type === 'percentage' ? `-${d.value}%` : `-${Number(d.value).toLocaleString()} UZS`}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        {d.category_name ? `Kategoriya: ${d.category_name}` : d.brand_name ? `Brend: ${d.brand_name}` : d.product_name ? `Tovar: ${d.product_name}` : 'Barcha tovarlar'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>{new Date(d.start_date).toLocaleDateString()}</td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>{new Date(d.end_date).toLocaleDateString()}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${d.is_active === 1 ? 'badge-success' : 'badge-neutral'}`}>
                          {d.is_active === 1 ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button onClick={() => handleOpenCampaignModal(d)} className="btn btn-secondary btn-sm btn-icon">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDeleteCampaign(d.id)} className="btn btn-outline btn-sm btn-icon" style={{ color: 'var(--danger)' }}>
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
      )}

      {/* Tab 2: Coupons */}
      {activeTab === 'coupons' && (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Promokod</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Chegirma miqdori</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Minimal xarid</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Ishlatilgan / Limit</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Amal qilish muddati</th>
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
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Kuponlar mavjud emas.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: '800', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : `${Number(c.discount_value).toLocaleString()} UZS`}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>{Number(c.min_order_amount || 0).toLocaleString()} so‘m</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{c.current_uses} / {c.max_uses} ta</td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem' }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Cheksiz'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${c.is_active === 1 ? 'badge-success' : 'badge-neutral'}`}>
                          {c.is_active === 1 ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button onClick={() => handleOpenCouponModal(c)} className="btn btn-secondary btn-sm btn-icon">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => handleDeleteCoupon(c.id)} className="btn btn-outline btn-sm btn-icon" style={{ color: 'var(--danger)' }}>
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
      )}

      {/* Campaign Modal */}
      {campaignModalOpen && (
        <div className="modal-overlay" onClick={() => setCampaignModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem' }}>
              {editingDisc ? 'Aksiyani tahrirlash' : 'Yangi Chegirma Kampaniyasi'}
            </h3>
            <form onSubmit={handleSaveCampaign}>
              <div className="form-group">
                <label className="form-label">Aksiya nomi *</label>
                <input
                  type="text"
                  required
                  value={discTitle}
                  onChange={(e) => setDiscTitle(e.target.value)}
                  placeholder="Masalan: Kuzgi Bayram Chegirmasi"
                  className="form-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Turi *</label>
                  <select
                    value={discType}
                    onChange={(e) => setDiscType(e.target.value)}
                    className="form-control"
                  >
                    <option value="percentage">Foiz (%)</option>
                    <option value="fixed">Qat’iy summa (so‘m)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Qiymati *</label>
                  <input
                    type="number"
                    required
                    value={discValue}
                    onChange={(e) => setDiscValue(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Boshlanish sanasi va vaqti *</label>
                  <input
                    type="datetime-local"
                    required
                    value={discStartDate}
                    onChange={(e) => setDiscStartDate(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tugash sanasi va vaqti *</label>
                  <input
                    type="datetime-local"
                    required
                    value={discEndDate}
                    onChange={(e) => setDiscEndDate(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Qaysi kategoriyaga qo‘llansin?</label>
                <select
                  value={discCategory}
                  onChange={(e) => setDiscCategory(e.target.value)}
                  className="form-control"
                >
                  <option value="">Barcha kategoriyalarga</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setCampaignModalOpen(false)} className="btn btn-secondary">
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

      {/* Coupon Modal */}
      {couponModalOpen && (
        <div className="modal-overlay" onClick={() => setCouponModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem' }}>
              {editingCoupon ? 'Kuponni tahrirlash' : 'Yangi Promokod'}
            </h3>
            <form onSubmit={handleSaveCoupon}>
              <div className="form-group">
                <label className="form-label">Promokod kodi (Katta harflarda) *</label>
                <input
                  type="text"
                  required
                  value={coupCode}
                  onChange={(e) => setCoupCode(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="form-control"
                  style={{ textTransform: 'uppercase', fontWeight: '700' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Chegirma turi *</label>
                  <select
                    value={coupType}
                    onChange={(e) => setCoupType(e.target.value)}
                    className="form-control"
                  >
                    <option value="percentage">Foiz (%)</option>
                    <option value="fixed">Qat’iy summa (so‘m)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Qiymati *</label>
                  <input
                    type="number"
                    required
                    value={coupValue}
                    onChange={(e) => setCoupValue(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Minimal xarid (so‘m)</label>
                  <input
                    type="number"
                    value={coupMinOrder}
                    onChange={(e) => setCoupMinOrder(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Maksimal foydalanish soni</label>
                  <input
                    type="number"
                    value={coupMaxUses}
                    onChange={(e) => setCoupMaxUses(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amal qilish muddati</label>
                <input
                  type="datetime-local"
                  value={coupExpires}
                  onChange={(e) => setCoupExpires(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setCouponModalOpen(false)} className="btn btn-secondary">
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
