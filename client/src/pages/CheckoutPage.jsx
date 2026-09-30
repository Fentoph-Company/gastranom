import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  Truck,
  CreditCard,
  Banknote,
  CheckCircle2,
  Tag,
  Clock,
  ArrowRight,
  AlertCircle,
  Store
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export default function CheckoutPage({ onNavigate }) {
  const { cart, subtotal, totalDiscount, clearCart } = useCart();
  const { user, addresses } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Contact Info
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  // Delivery Method: 'delivery' or 'pickup'
  const [deliveryType, setDeliveryType] = useState('delivery');

  // Address
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [region, setRegion] = useState('Xorazm viloyati');
  const [city, setCity] = useState('Xiva shahri');
  const [street, setStreet] = useState('Mustaqillik ko‘chasi');
  const [house, setHouse] = useState('17-uy');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Delivery Zones
  const [zones, setZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod', 'payme', 'click', 'card'

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Verified Calculation from server
  const [calculation, setCalculation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync user info if loaded
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
      if (!customerEmail && user.email) setCustomerEmail(user.email);
    }
  }, [user]);

  // Load delivery zones
  useEffect(() => {
    api.getDeliveryZones().then((res) => {
      if (res.success && res.zones?.length > 0) {
        setZones(res.zones);
        setSelectedZoneId(res.zones[0].id);
      }
    }).catch(() => {});
  }, []);

  // Set default address if user has saved addresses
  useEffect(() => {
    if (addresses?.length > 0 && !street) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
      setRegion(def.region);
      setCity(def.city);
      setStreet(def.street);
      setHouse(def.house);
    }
  }, [addresses]);

  // Server-side calculation update whenever cart, zone, coupon, or deliveryType changes
  useEffect(() => {
    if (cart.items.length === 0) return;

    const payload = {
      items: cart.items.map((it) => ({
        productId: it.productId,
        variantId: it.variantId,
        quantity: it.quantity
      })),
      deliveryType,
      deliveryZoneId: deliveryType === 'pickup' ? null : selectedZoneId,
      couponCode: appliedCoupon?.code || null
    };

    api.calculateCheckout(payload)
      .then((res) => {
        if (res.success && res.calculation) {
          setCalculation(res.calculation);
        }
      })
      .catch((err) => console.warn('Calculation error:', err));
  }, [cart.items, selectedZoneId, appliedCoupon, deliveryType]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const res = await api.validateCoupon(couponCode.trim(), subtotal);
      if (res.success && res.coupon) {
        setAppliedCoupon(res.coupon);
        showToast(`Promokod qo‘llandi! -${res.coupon.discount.toLocaleString()} so‘m tejov`);
      }
    } catch (err) {
      showToast(err.message || 'Yaroqsiz promokod', 'error');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      showToast('Ism va telefon raqamingizni kiriting.', 'warning');
      return;
    }

    if (deliveryType === 'delivery' && (!street.trim() || !house.trim())) {
      showToast('Yetkazib berish ko‘chasi va uy raqamini to‘liq kiriting.', 'warning');
      return;
    }

    if (cart.items.length === 0) {
      showToast('Savatingiz bo‘sh!', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || null,
        deliveryType,
        deliveryZoneId: deliveryType === 'pickup' ? null : selectedZoneId,
        region: deliveryType === 'pickup' ? 'Xorazm viloyati' : region,
        city: deliveryType === 'pickup' ? 'Xiva shahri' : city,
        street: deliveryType === 'pickup' ? 'Mustaqillik ko‘chasi' : street.trim(),
        house: deliveryType === 'pickup' ? '17-uy (Gastronom Do‘koni)' : house.trim(),
        deliveryInstructions: deliveryInstructions.trim() || null,
        paymentMethod,
        items: cart.items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId,
          quantity: it.quantity
        })),
        couponCode: appliedCoupon?.code || null
      };

      const res = await api.placeOrder(orderPayload);
      if (res.success && res.orderNumber) {
        showToast('Buyurtmangiz muvaffaqiyatli qabul qilindi!', 'success', 5000);
        clearCart();
        onNavigate('track-order', { orderNumber: res.orderNumber });
      }
    } catch (err) {
      showToast(err.message || 'Buyurtma rasmiylashtirishda xatolik yuz berdi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem' }}>Savatingiz bo‘sh</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Buyurtma berish uchun avval mahsulotlarni savatga qo‘shing.</p>
        <button onClick={() => onNavigate('catalog')} className="btn btn-primary">
          Katalogga o‘tish
        </button>
      </div>
    );
  }

  const finalTotal = calculation ? calculation.finalTotal : subtotal;
  const deliveryFee = calculation ? calculation.deliveryFee : 25000;
  const couponDiscount = calculation ? calculation.couponDiscount : 0;

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.75rem' }}>
        Buyurtmani rasmiylashtirish
      </h1>

      <form onSubmit={handlePlaceOrder}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'flex-start' }}>
          {/* Left Column: Details, Address, Zones, Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* 1. Contact Info */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>1</span>
                Qabul qiluvchi ma’lumotlari
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">To‘liq ism-familiya *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Masalan: Aslbek Qo‘ziboyev"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefon raqam *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+998 (90) 123-45-67"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Elektron pochta (ixtiyoriy)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="xarid@example.uz"
                    className="form-control"
                  />
                </div>
              </div>
            </div>

            {/* 2. Delivery Method & Address */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>2</span>
                {t('delivery_type')}
              </h3>

              {/* Delivery vs Pickup Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setDeliveryType('delivery')}
                  style={{
                    padding: '0.85rem 0.5rem',
                    borderRadius: '10px',
                    border: deliveryType === 'delivery' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: deliveryType === 'delivery' ? 'var(--primary-light)' : '#ffffff',
                    fontWeight: '700',
                    color: deliveryType === 'delivery' ? 'var(--primary)' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  <Truck size={18} />
                  <span>{t('delivery_courier')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  style={{
                    padding: '0.85rem 0.5rem',
                    borderRadius: '10px',
                    border: deliveryType === 'pickup' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: deliveryType === 'pickup' ? 'var(--primary-light)' : '#ffffff',
                    fontWeight: '700',
                    color: deliveryType === 'pickup' ? 'var(--primary)' : 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  <Store size={18} />
                  <span>{t('delivery_pickup')}</span>
                </button>
              </div>

              {/* Pickup Mode details */}
              {deliveryType === 'pickup' ? (
                <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: 'var(--primary-light)', border: '1.5px solid rgba(5,150,105,0.3)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
                    <MapPin size={18} /> Olib ketish manzili (Bepul):
                  </div>
                  <div style={{ fontSize: '0.925rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    Xiva, Mustaqillik ko‘chasi, 17 (Gastronom Supermarketi)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} color="#10b981" /> 24/7 kechayu-kunduz ochiq • Buyurtmangiz 15 daqiqada tayyor bo‘ladi
                  </div>
                </div>
              ) : (
                /* Delivery Mode: Zones & Address Inputs */
                <>
                  {/* Delivery Zone Selector */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">Yetkazib berish zonasi:</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {zones.map((z) => (
                        <label
                          key={z.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: selectedZoneId === z.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: selectedZoneId === z.id ? 'var(--primary-light)' : '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <input
                              type="radio"
                              name="delivery_zone"
                              checked={selectedZoneId === z.id}
                              onChange={() => setSelectedZoneId(z.id)}
                              style={{ accentColor: 'var(--primary)' }}
                            />
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{z.name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Muddati: {z.estimated_time}</div>
                            </div>
                          </div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: z.free_threshold && subtotal >= z.free_threshold ? '#10b981' : 'var(--text-main)' }}>
                            {z.free_threshold && subtotal >= z.free_threshold ? 'BEPUL' : `${z.price.toLocaleString()} so‘m`}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Saved Addresses quick pick if logged in */}
                  {addresses?.length > 0 && (
                    <div style={{ marginBottom: '1.25rem', backgroundColor: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '10px' }}>
                      <label className="form-label" style={{ marginBottom: '0.4rem', fontSize: '0.825rem' }}>Saqlangan manzillardan tanlash:</label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {addresses.map((a) => (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => {
                              setSelectedAddressId(a.id);
                              setRegion(a.region);
                              setCity(a.city);
                              setStreet(a.street);
                              setHouse(a.house);
                            }}
                            className={`badge ${selectedAddressId === a.id ? 'badge-primary' : 'badge-neutral'}`}
                            style={{ cursor: 'pointer', padding: '0.4rem 0.75rem' }}
                          >
                            {a.title}: {a.street}, {a.house}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Viloyat / Shahar *</label>
                      <input
                        type="text"
                        required={deliveryType === 'delivery'}
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="Masalan: Xorazm viloyati"
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tuman / Shahar *</label>
                      <input
                        type="text"
                        required={deliveryType === 'delivery'}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Masalan: Xiva shahri"
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Ko‘cha va mahalla *</label>
                      <input
                        type="text"
                        required={deliveryType === 'delivery'}
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Mustaqillik ko‘chasi"
                        className="form-control"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Uy / Xonadon raqami *</label>
                      <input
                        type="text"
                        required={deliveryType === 'delivery'}
                        value={house}
                        onChange={(e) => setHouse(e.target.value)}
                        placeholder="17-uy"
                        className="form-control"
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Kuryer uchun qo‘shimcha ko‘rsatma (ixtiyoriy)</label>
                      <input
                        type="text"
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder="Masalan: Domofon kodi 12B, 3-qavat"
                        className="form-control"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 3. Payment Method */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>3</span>
                To‘lov usuli
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: paymentMethod === 'cod' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: paymentMethod === 'cod' ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <Banknote size={20} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Naqd pul / Karta</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Yetkazilganda to‘lov</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: paymentMethod === 'payme' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: paymentMethod === 'payme' ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="payme"
                    checked={paymentMethod === 'payme'}
                    onChange={() => setPaymentMethod('payme')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <CreditCard size={20} color="#0284c7" />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Payme</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tezkor onlayn to‘lov</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: paymentMethod === 'click' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: paymentMethod === 'click' ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="click"
                    checked={paymentMethod === 'click'}
                    onChange={() => setPaymentMethod('click')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <CreditCard size={20} color="#059669" />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Click</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click ilovasi orqali</div>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: paymentMethod === 'card' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: paymentMethod === 'card' ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <CreditCard size={20} color="#ea580c" />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Bank kartasi</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Uzcard / Humo / Visa</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary, Coupon, Submit */}
          <div style={{ position: 'sticky', top: '90px' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                Buyurtmangiz tarkibi ({cart.itemCount} ta)
              </h3>

              {/* Items scroll */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '4px' }}>
                {cart.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      <img src={item.image} alt="" style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.quantity} x {item.unitPrice.toLocaleString()}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: '700', whiteSpace: 'nowrap' }}>{item.itemTotal.toLocaleString()} so‘m</span>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <div style={{ marginBottom: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.825rem' }}>Promokod yoki kupon:</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Masalan: WELCOME10"
                    className="form-control"
                    style={{ textTransform: 'uppercase', fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap', borderRadius: '10px' }}
                  >
                    {couponLoading ? '...' : 'Qo‘llash'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <CheckCircle2 size={13} /> Promokod qabul qilindi: <b>{appliedCoupon.code}</b>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Oraliq summa:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{subtotal.toLocaleString()} so‘m</span>
                </div>

                {totalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                    <span>Mahsulot chegirmasi:</span>
                    <span style={{ fontWeight: '700' }}>-{totalDiscount.toLocaleString()} so‘m</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                    <span>Promokod chegirmasi:</span>
                    <span style={{ fontWeight: '700' }}>-{couponDiscount.toLocaleString()} so‘m</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Yetkazib berish:</span>
                  <span style={{ fontWeight: '600', color: deliveryFee === 0 ? '#10b981' : 'var(--text-main)' }}>
                    {deliveryFee === 0 ? 'BEPUL' : `${deliveryFee.toLocaleString()} so‘m`}
                  </span>
                </div>

                <div style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '800' }}>
                  <span>Jami to‘lov:</span>
                  <span style={{ color: 'var(--primary)' }}>{finalTotal.toLocaleString()} so‘m</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1.05rem',
                  borderRadius: '12px',
                  marginTop: '1.5rem',
                  boxShadow: '0 8px 20px rgba(5,150,105,0.35)'
                }}
              >
                <span>{submitting ? 'Rasmiylashtirilmoqda...' : 'Buyurtmani tasdiqlash'}</span>
                <ArrowRight size={18} />
              </button>

              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <ShieldCheck size={15} color="var(--primary)" />
                Xavfsiz va kafolatlangan buyurtma
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
