import React, { useState, useEffect } from 'react';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Check,
  Search,
  AlertCircle,
  FileText,
  Phone,
  Printer,
  XCircle
} from 'lucide-react';
import { api } from '../services/api';

const STATUS_STEPS = [
  { key: 'received', label: 'Qabul qilindi', desc: 'Buyurtma tizimga kiritildi' },
  { key: 'confirmed', label: 'Tasdiqlandi', desc: 'Menejer tasdiqladi' },
  { key: 'preparing', label: 'Tayyorlanmoqda', desc: 'Ombordan saralanmoqda' },
  { key: 'ready', label: 'Tayyor', desc: 'Jo‘natishga tayyor' },
  { key: 'out_for_delivery', label: 'Yetkazilmoqda', desc: 'Kuryer yo‘lga chiqdi' },
  { key: 'delivered', label: 'Yetkazildi', desc: 'Mijozga topshirildi' }
];

export default function OrderTrackingPage({ orderNumber: initialOrderNumber, onNavigate }) {
  const [searchNumber, setSearchNumber] = useState(initialOrderNumber || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrderNumber) {
      handleTrack(initialOrderNumber);
    }
  }, [initialOrderNumber]);

  const handleTrack = async (numToTrack) => {
    const num = numToTrack || searchNumber;
    if (!num.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.trackOrder(num.trim());
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } catch (err) {
      setError(err.message || 'Bunday raqamli buyurtma topilmadi.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const currentStatusIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.order_status) : -1;
  const isCancelled = order?.order_status === 'cancelled';

  return (
    <div className="container" style={{ padding: '2rem 1.25rem', maxWidth: '880px' }}>
      {/* Search Bar for tracking */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
          Buyurtma holatini kuzatish
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Buyurtma raqamini kiriting va uning qaysi bosqichdaligini real vaqtda ko‘ring
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          style={{ display: 'flex', gap: '0.5rem', maxWidth: '480px', margin: '0 auto' }}
        >
          <input
            type="text"
            required
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value.toUpperCase())}
            placeholder="Masalan: GST-260930-1042"
            className="form-control"
            style={{ textTransform: 'uppercase', fontWeight: '600' }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '10px' }}>
            <Search size={18} />
            <span>Kuzatish</span>
          </button>
        </form>

        {error && (
          <div style={{ marginTop: '1rem', color: '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Order Status Display */}
      {order && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Status Header Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>Buyurtma #{order.order_number}</span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Sana: {new Date(order.created_at).toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--primary)' }}>
                  {order.total_amount.toLocaleString()} so‘m
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    To‘lov: {order.payment_status === 'paid' ? 'To‘langan' : 'Yetkazilganda to‘lanadi'}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-secondary btn-sm no-print"
                    style={{ padding: '0.25rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', borderRadius: '6px' }}
                    title="Supermarket kassa chekini chop etish"
                  >
                    <Printer size={13} />
                    <span>Chekni chop etish</span>
                  </button>
                </div>
              </div>
            </div>

            {/* If Cancelled */}
            {isCancelled ? (
              <div style={{ padding: '1.5rem', backgroundColor: '#fee2e2', borderRadius: '12px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <XCircle size={28} />
                <div>
                  <h4 style={{ fontWeight: '700', fontSize: '1.05rem' }}>Buyurtma bekor qilingan</h4>
                  <p style={{ fontSize: '0.875rem' }}>Ushbu buyurtma bekor qilindi va mahsulotlar ombor zaxirasiga qaytarildi.</p>
                </div>
              </div>
            ) : (
              /* Timeline Stepper */
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1.5rem' }}>Yetkazib berish bosqichlari</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;

                    return (
                      <div
                        key={step.key}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: isCurrent ? 'var(--primary)' : isCompleted ? '#10b981' : 'var(--bg-subtle)',
                            color: isCompleted ? '#ffffff' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            marginBottom: '0.5rem',
                            boxShadow: isCurrent ? '0 0 0 4px rgba(5, 150, 105, 0.25)' : 'none',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {isCompleted ? <Check size={18} /> : idx + 1}
                        </div>
                        <div style={{ fontSize: '0.825rem', fontWeight: isCurrent ? '800' : '600', color: isCurrent ? 'var(--primary)' : 'var(--text-main)', marginBottom: '2px' }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.2' }}>
                          {step.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Delivery & Items Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Delivery Details */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={18} color="var(--primary)" /> Yetkazib berish manzili
              </h4>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div><b>Qabul qiluvchi:</b> {order.customer_name}</div>
                <div><b>Telefon:</b> {order.customer_phone}</div>
                {order.customer_email && <div><b>Email:</b> {order.customer_email}</div>}
                <div>
                  <b>Manzil:</b> {order.delivery_address_details?.street}, {order.delivery_address_details?.house}, {order.delivery_address_details?.city}, {order.delivery_address_details?.region}
                </div>
                {order.delivery_instructions && (
                  <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <b>Ko‘rsatma:</b> {order.delivery_instructions}
                  </div>
                )}
                {order.zone && (
                  <div style={{ marginTop: '0.5rem', color: 'var(--primary)', fontWeight: '600' }}>
                    Zona: {order.zone.name} (Taxminiy vaqt: {order.zone.estimated_time})
                  </div>
                )}
              </div>
            </div>

            {/* Items Receipt */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={18} color="var(--primary)" /> Buyurtma cheki
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                {order.items?.map((it) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{it.product_name}</div>
                      {it.variant_name && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{it.variant_name}</span>}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>x {it.quantity}</span>
                    </div>
                    <span style={{ fontWeight: '700' }}>{it.total_price.toLocaleString()} so‘m</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Oraliq summa:</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{order.subtotal.toLocaleString()} so‘m</span>
                </div>
                {order.coupon_discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                    <span>Kupon ({order.coupon_code}):</span>
                    <span>-{order.coupon_discount.toLocaleString()} so‘m</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Yetkazib berish haqi:</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                    {order.delivery_fee === 0 ? 'BEPUL' : `${order.delivery_fee.toLocaleString()} so‘m`}
                  </span>
                </div>
                <div style={{ borderTop: '1.5px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  <span>Jami:</span>
                  <span style={{ color: 'var(--primary)' }}>{order.total_amount.toLocaleString()} so‘m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
