import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Package,
  Heart,
  Lock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  ExternalLink,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

export default function CustomerProfilePage({ initialTab = 'profile', onNavigate, onSelectProduct }) {
  const { user, addresses, refreshMe, openAuthModal } = useAuth();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile Edit Form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // New Address Form Modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addrTitle, setAddrTitle] = useState('Uy');
  const [addrRecipient, setAddrRecipient] = useState(user?.name || '');
  const [addrPhone, setAddrPhone] = useState(user?.phone || '');
  const [addrRegion, setAddrRegion] = useState('Xorazm viloyati');
  const [addrCity, setAddrCity] = useState('Xiva shahri');
  const [addrStreet, setAddrStreet] = useState('Mustaqillik ko‘chasi');
  const [addrHouse, setAddrHouse] = useState('17-uy');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setAddrRecipient(user.name);
      setAddrPhone(user.phone || '');
    }
  }, [user]);

  // Fetch orders when orders tab active
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      setLoadingOrders(true);
      api.getMyOrders()
        .then((res) => {
          if (res.success) setOrders(res.orders || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingOrders(false));
    }
  }, [activeTab, user]);

  if (!user) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>
          Shaxsiy kabinetga kirish talab etiladi
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Buyurtmalaringiz, manzillaringiz va profilingizni ko‘rish uchun tizimga kiring.
        </p>
        <button onClick={() => openAuthModal('login')} className="btn btn-primary">
          Kirish / Ro‘yxatdan o‘tish
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await api.updateProfile({ name, phone });
      if (res.success) {
        showToast('Profil ma’lumotlari saqlandi!');
        await refreshMe();
      }
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setUpdatingPassword(true);
    try {
      const res = await api.changePassword({ currentPassword, newPassword });
      if (res.success) {
        showToast('Parolingiz muvaffaqiyatli o‘zgartirildi!');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      showToast(err.message || 'Parolni o‘zgartirib bo‘lmadi.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: addrTitle,
        recipient_name: addrRecipient,
        phone: addrPhone,
        region: addrRegion,
        city: addrCity,
        street: addrStreet,
        house: addrHouse,
        is_default: addrIsDefault ? 1 : 0
      };

      if (editingAddressId) {
        await api.updateAddress(editingAddressId, payload);
        showToast('Manzil yangilandi!');
      } else {
        await api.addAddress(payload);
        showToast('Yangi manzil qo‘shildi!');
      }

      setAddressModalOpen(false);
      setEditingAddressId(null);
      await refreshMe();
    } catch (err) {
      showToast(err.message || 'Manzilni saqlashda xatolik yuz berdi.', 'error');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Haqiqatan ham bu manzilni o‘chirmoqchimisiz?')) return;
    try {
      await api.deleteAddress(id);
      showToast('Manzil o‘chirildi.');
      await refreshMe();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const openAddressEditor = (addr = null) => {
    if (addr) {
      setEditingAddressId(addr.id);
      setAddrTitle(addr.title);
      setAddrRecipient(addr.recipient_name);
      setAddrPhone(addr.phone);
      setAddrRegion(addr.region);
      setAddrCity(addr.city);
      setAddrStreet(addr.street);
      setAddrHouse(addr.house);
      setAddrIsDefault(addr.is_default === 1);
    } else {
      setEditingAddressId(null);
      setAddrTitle('Uy');
      setAddrRecipient(user.name);
      setAddrPhone(user.phone || '');
      setAddrRegion('Xorazm viloyati');
      setAddrCity('Xiva shahri');
      setAddrStreet('Mustaqillik ko‘chasi');
      setAddrHouse('');
      setAddrIsDefault(false);
    }
    setAddressModalOpen(true);
  };

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: '800' }}>
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{user.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user.email} • {user.phone || 'Telefon biriktirilmagan'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'profile' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <User size={16} /> Profil ma’lumotlari
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'addresses' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'addresses' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <MapPin size={16} /> Yetkazib berish manzillari ({addresses.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'orders' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Package size={16} /> Buyurtmalar tarixi
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: '700',
            fontSize: '0.9rem',
            color: activeTab === 'wishlist' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'wishlist' ? '3px solid var(--primary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Heart size={16} /> Sevimlilar ({wishlist.length})
        </button>
      </div>

      {/* Tab 1: Profile & Password */}
      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Profile Details */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem' }}>Shaxsiy ma’lumotlar</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">To‘liq ism</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Elektron pochta</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="form-control"
                  style={{ backgroundColor: 'var(--bg-subtle)', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email manzilini o‘zgartirib bo‘lmaydi.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Telefon raqam</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 (90) 123-45-67"
                  className="form-control"
                />
              </div>

              <button type="submit" disabled={updatingProfile} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                {updatingProfile ? 'Saqlanmoqda...' : 'O‘zgarishlarni saqlash'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem' }}>Parolni o‘zgartirish</h3>
            <form onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label className="form-label">Hozirgi parol</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Amaldagi parolingiz"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Yangi parol</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  className="form-control"
                />
              </div>

              <button type="submit" disabled={updatingPassword} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
                {updatingPassword ? 'Yangilanmoqda...' : 'Yangi parolni o‘rnatish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Addresses */}
      {activeTab === 'addresses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Saqlangan manzillar</h3>
            <button onClick={() => openAddressEditor(null)} className="btn btn-primary btn-sm">
              <Plus size={16} /> Yangi manzil qo‘shish
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {addresses.map((a) => (
              <div key={a.id} className="card" style={{ padding: '1.25rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={18} color="var(--primary)" />
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{a.title}</span>
                  </div>
                  {a.is_default === 1 && (
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Bosh manzil</span>
                  )}
                </div>

                <div style={{ fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--text-main)', marginBottom: '1rem' }}>
                  <div><b>Qabul qiluvchi:</b> {a.recipient_name}</div>
                  <div><b>Telefon:</b> {a.phone}</div>
                  <div><b>Manzil:</b> {a.street}, {a.house}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{a.city}, {a.region}</div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <button onClick={() => openAddressEditor(a)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    <Edit2 size={14} /> Tahrirlash
                  </button>
                  <button onClick={() => handleDeleteAddress(a.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Orders History */}
      {activeTab === 'orders' && (
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem' }}>Buyurtmalar tarixi</h3>
          {loadingOrders ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <Package size={36} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Sizda hali buyurtmalar yo‘q</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Katalogdan yangi mahsulotlarni tanlang va xaridni amalga oshiring.
              </p>
              <button onClick={() => onNavigate('catalog')} className="btn btn-primary">
                Katalogga o‘tish
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map((ord) => (
                <div key={ord.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>#{ord.order_number}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                        {ord.order_status.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => onNavigate('track-order', { orderNumber: ord.order_number })}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ExternalLink size={14} /> Kuzatish
                      </button>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {ord.items?.map((it) => (
                      <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <img src={it.product_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                          <span>{it.product_name} x {it.quantity}</span>
                        </div>
                        <span style={{ fontWeight: '600' }}>{it.total_price.toLocaleString()} so‘m</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', fontSize: '1rem', fontWeight: '800', color: 'var(--primary)' }}>
                    Jami: {ord.total_amount.toLocaleString()} so‘m
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Wishlist */}
      {activeTab === 'wishlist' && (
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.5rem' }}>Sevimlilar ro‘yxati</h3>
          {wishlist.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '16px' }}>
              <Heart size={36} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
              <h4>Sevimlilar ro‘yxati bo‘sh</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                O‘zingizga ma’qul kelgan mahsulotlarni yurakcha belgisini bosib saqlang.
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {wishlist.map((p) => (
                <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <img
                    src={p.primary_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                    alt={p.name}
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.5rem' }}>{p.name}</h4>
                      <div style={{ fontWeight: '800', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                        {p.price.toLocaleString()} so‘m
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => addToCart(p.id, null, 1)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        Savatga
                      </button>
                      <button
                        onClick={() => toggleWishlist(p.id)}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Address Edit / Create Modal */}
      {addressModalOpen && (
        <div className="modal-overlay" onClick={() => setAddressModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '1.75rem', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.25rem' }}>
              {editingAddressId ? 'Manzilni tahrirlash' : 'Yangi manzil qo‘shish'}
            </h3>
            <form onSubmit={handleSaveAddress}>
              <div className="form-group">
                <label className="form-label">Manzil nomi (Masalan: Uy, Ishxona)</label>
                <input
                  type="text"
                  required
                  value={addrTitle}
                  onChange={(e) => setAddrTitle(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Qabul qiluvchi ismi</label>
                <input
                  type="text"
                  required
                  value={addrRecipient}
                  onChange={(e) => setAddrRecipient(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefon raqam</label>
                <input
                  type="tel"
                  required
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Viloyat / Shahar</label>
                  <input
                    type="text"
                    required
                    value={addrRegion}
                    onChange={(e) => setAddrRegion(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tuman</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Ko‘cha</label>
                  <input
                    type="text"
                    required
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Uy / Xonadon</label>
                  <input
                    type="text"
                    required
                    value={addrHouse}
                    onChange={(e) => setAddrHouse(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Asosiy yetkazib berish manzili sifatida belgilash</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setAddressModalOpen(false)} className="btn btn-secondary">
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
