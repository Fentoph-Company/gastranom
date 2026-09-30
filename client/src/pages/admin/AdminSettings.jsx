import React, { useState, useEffect } from 'react';
import { Settings, Image, Plus, Trash2, Edit2, Save, X, MapPin, ExternalLink, Send } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'banners'
  const [settings, setSettings] = useState({
    store_name: '',
    store_tagline: '',
    contact_phone: '',
    contact_email: '',
    store_address: '',
    working_hours: '',
    free_delivery_threshold: 150000,
    store_type: 'Oziq-ovqat do‘koni',
    plus_code: '99J4+JF',
    store_rating: 4.1,
    store_review_count: 94,
    maps_url: '',
    google_maps_url: '',
    store_coordinates: { lat: 41.381527, lng: 60.355998 },
    telegram_bot_token: '',
    telegram_chat_id: ''
  });

  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);

  // Banner Modal
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [banTitle, setBanTitle] = useState('');
  const [banSubtitle, setBanSubtitle] = useState('');
  const [banImage, setBanImage] = useState('');
  const [banLink, setBanLink] = useState('');
  const [banBadge, setBanBadge] = useState('');
  const [banSort, setBanSort] = useState('0');

  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'settings') {
        const res = await api.getSettings();
        if (res.success && res.settings) {
          setSettings((prev) => ({ ...prev, ...res.settings }));
        }
      } else {
        const res = await api.admin.getAllBanners();
        if (res.success) setBanners(res.banners || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.admin.updateSettings(settings);
      showToast('Do‘kon sozlamalari muvaffaqiyatli saqlandi!');
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      showToast('Iltimos, avval Telegram Bot Token va Chat ID ni kiriting.', 'warning');
      return;
    }
    setTestingTelegram(true);
    try {
      const res = await api.admin.testTelegram({
        bot_token: settings.telegram_bot_token,
        chat_id: settings.telegram_chat_id
      });
      if (res.success) {
        showToast('Telegramga test xabar yuborildi! Telegram guruhingizni tekshiring.');
      } else {
        showToast(res.message || 'Xatolik yuz berdi.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Telegramga ulanib bo‘lmadi.', 'error');
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleOpenBannerModal = (b = null) => {
    if (b) {
      setEditingBanner(b);
      setBanTitle(b.title);
      setBanSubtitle(b.subtitle || '');
      setBanImage(b.image_url);
      setBanLink(b.link_url);
      setBanBadge(b.badge_text || '');
      setBanSort(String(b.sort_order || 0));
    } else {
      setEditingBanner(null);
      setBanTitle('');
      setBanSubtitle('');
      setBanImage('https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600');
      setBanLink('/products');
      setBanBadge('Maxsus Aksiya');
      setBanSort('0');
    }
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: banTitle,
        subtitle: banSubtitle,
        image_url: banImage,
        link_url: banLink,
        badge_text: banBadge,
        sort_order: Number(banSort)
      };

      if (editingBanner) {
        await api.admin.updateBanner(editingBanner.id, payload);
        showToast('Banner yangilandi!');
      } else {
        await api.admin.createBanner(payload);
        showToast('Yangi banner qo‘shildi!');
      }

      setBannerModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm('Bannerni o‘chirishni tasdiqlaysizmi?')) return;
    try {
      await api.admin.deleteBanner(id);
      showToast('Banner o‘chirildi.');
      await loadData();
    } catch (err) {
      showToast(err.message || 'O‘chirib bo‘lmadi.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Do‘kon Sozlamalari & Kontent</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Do‘kon nomi, aloqa vositalari va bosh sahifa bannerlarini boshqarish</p>
        </div>

        {activeTab === 'banners' && (
          <button onClick={() => handleOpenBannerModal(null)} className="btn btn-primary">
            <Plus size={18} /> Yangi banner
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'settings' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Settings size={16} /> Asosiy Do‘kon Sozlamalari
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'banners' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'banners' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Image size={16} /> Bosh Sahifa Bannerlari ({banners.length})
        </button>
      </div>

      {/* Tab 1: Store Settings Form */}
      {activeTab === 'settings' && (
        <div className="card" style={{ padding: '2rem', maxWidth: '780px' }}>
          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Do‘kon nomi *</label>
                <input
                  type="text"
                  required
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Shior (Tagline)</label>
                <input
                  type="text"
                  value={settings.store_tagline}
                  onChange={(e) => setSettings({ ...settings, store_tagline: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Aloqa telefoni</label>
                <input
                  type="text"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Aloqa elektron pochtasi</label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Do‘kon manzili</label>
                <input
                  type="text"
                  value={settings.store_address}
                  onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kenglik (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  value={settings.store_coordinates?.lat || 41.381527}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store_coordinates: {
                        ...(settings.store_coordinates || {}),
                        lat: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Uzunlik (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  value={settings.store_coordinates?.lng || 60.355998}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      store_coordinates: {
                        ...(settings.store_coordinates || {}),
                        lng: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                  className="form-control"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Xarita havolasi (Yandex Maps URL)</label>
                  {settings.maps_url && (
                    <a
                      href={settings.maps_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}
                    >
                      <MapPin size={13} /> Xaritani ochish <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <input
                  type="text"
                  value={settings.maps_url || ''}
                  onChange={(e) => setSettings({ ...settings, maps_url: e.target.value })}
                  placeholder="https://yandex.uz/maps/?pt=60.355998,41.381527&z=17&l=map"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ish vaqti</label>
                <input
                  type="text"
                  value={settings.working_hours}
                  onChange={(e) => setSettings({ ...settings, working_hours: e.target.value })}
                  placeholder="Har kuni 10:00–23:00"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Do‘kon turi</label>
                <input
                  type="text"
                  value={settings.store_type || ''}
                  onChange={(e) => setSettings({ ...settings, store_type: e.target.value })}
                  placeholder="Oziq-ovqat do‘koni"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Plus-kod (Google / Maps)</label>
                <input
                  type="text"
                  value={settings.plus_code || ''}
                  onChange={(e) => setSettings({ ...settings, plus_code: e.target.value })}
                  placeholder="99J4+JF"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Do‘kon reytingi (0 - 5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={settings.store_rating || 4.1}
                  onChange={(e) => setSettings({ ...settings, store_rating: parseFloat(e.target.value) || 0 })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Baholar soni</label>
                <input
                  type="number"
                  min="0"
                  value={settings.store_review_count || 94}
                  onChange={(e) => setSettings({ ...settings, store_review_count: parseInt(e.target.value) || 0 })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bepul yetkazib berish chegarasi (so‘m)</label>
                <input
                  type="number"
                  value={settings.free_delivery_threshold}
                  onChange={(e) => setSettings({ ...settings, free_delivery_threshold: Number(e.target.value) })}
                  className="form-control"
                />
              </div>

              {/* Telegram Bot Integration */}
              <div style={{ gridColumn: 'span 2', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                      <span>✈️ Telegram Bot Integratsiyasi (Xabarnomalar)</span>
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                      Yangi buyurtmalar kelganda do‘kon ma’murlari va kuryerlar guruhiga zudlik bilan avtomatik xabar yuboriladi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Send size={14} /> {testingTelegram ? 'Yuborilmoqda...' : 'Sinov xabari yuborish'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Telegram Bot Token (@BotFather orqali olingan)</label>
                    <input
                      type="text"
                      value={settings.telegram_bot_token || ''}
                      onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                      placeholder="Masalan: 7123456789:AAH..."
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telegram Chat ID (Guruh yoki Kanal IDsi)</label>
                    <input
                      type="text"
                      value={settings.telegram_chat_id || ''}
                      onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                      placeholder="Masalan: -1001234567890 yoki @gastronom_orders"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="btn btn-primary"
              style={{ marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Save size={16} />
              <span>{savingSettings ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Banners */}
      {activeTab === 'banners' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {banners.map((b) => (
            <div key={b.id} className="card" style={{ overflow: 'hidden' }}>
              <div style={{ height: '160px', position: 'relative' }}>
                <img src={b.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {b.badge_text && (
                  <span className="badge badge-primary" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                    {b.badge_text}
                  </span>
                )}
              </div>
              <div style={{ padding: '1rem' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.35rem' }}>{b.title}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{b.subtitle}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Havola: <b>{b.link_url}</b>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                  <button onClick={() => handleOpenBannerModal(b)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    <Edit2 size={14} /> Tahrirlash
                  </button>
                  <button onClick={() => handleDeleteBanner(b.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner Modal */}
      {bannerModalOpen && (
        <div className="modal-overlay" onClick={() => setBannerModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem' }}>
              {editingBanner ? 'Bannerni tahrirlash' : 'Yangi Banner qo‘shish'}
            </h3>
            <form onSubmit={handleSaveBanner}>
              <div className="form-group">
                <label className="form-label">Sarlavha (Title) *</label>
                <input
                  type="text"
                  required
                  value={banTitle}
                  onChange={(e) => setBanTitle(e.target.value)}
                  placeholder="Masalan: Yangi va Tabiiy Mahsulotlar"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Qo‘shimcha matn (Subtitle)</label>
                <input
                  type="text"
                  value={banSubtitle}
                  onChange={(e) => setBanSubtitle(e.target.value)}
                  placeholder="Masalan: 45 daqiqada uyingizda"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rasm URL *</label>
                <input
                  type="url"
                  required
                  value={banImage}
                  onChange={(e) => setBanImage(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">O‘tish havolasi (Link) *</label>
                <input
                  type="text"
                  required
                  value={banLink}
                  onChange={(e) => setBanLink(e.target.value)}
                  placeholder="/products yoki /discounts"
                  className="form-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Badge matni</label>
                  <input
                    type="text"
                    value={banBadge}
                    onChange={(e) => setBanBadge(e.target.value)}
                    placeholder="Masalan: Chegirma 20%"
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tartib raqami</label>
                  <input
                    type="number"
                    value={banSort}
                    onChange={(e) => setBanSort(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setBannerModalOpen(false)} className="btn btn-secondary">
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
