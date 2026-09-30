import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  X,
  Save,
  Printer
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = [
  'received',
  'confirmed',
  'preparing',
  'ready',
  'courier_assigned',
  'out_for_delivery',
  'delivered',
  'cancelled'
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [internalNotes, setInternalNotes] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadOrders();
  }, [search, statusFilter, paymentFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.payment_status = paymentFilter;

      const res = await api.admin.getOrders(params);
      if (res.success) {
        setOrders(res.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const res = await api.admin.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        showToast(`Buyurtma holati "${newStatus}" ga o‘zgartirildi.`);
        await loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, order_status: newStatus });
        }
      }
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const handleUpdatePayment = async (orderId, newPayment) => {
    try {
      const res = await api.admin.updateOrderPayment(orderId, newPayment);
      if (res.success) {
        showToast('To‘lov holati yangilandi.');
        await loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, payment_status: newPayment });
        }
      }
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    try {
      await api.admin.updateOrderNotes(selectedOrder.id, internalNotes);
      showToast('Ichki eslatma saqlandi.');
      await loadOrders();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setInternalNotes(order.internal_notes || '');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search & Filter Header */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: '620px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Raqam, mijoz ismi yoki telefon..."
              className="form-control"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">Barcha holatlar</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>{st.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="">To‘lov holati</option>
            <option value="pending">Kutilmoqda</option>
            <option value="paid">To‘langan</option>
            <option value="failed">Muvaffaqiyatsiz</option>
            <option value="refunded">Qaytarilgan</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Raqami</th>
                <th style={{ padding: '0.85rem 1rem' }}>Mijoz</th>
                <th style={{ padding: '0.85rem 1rem' }}>Mahsulotlar</th>
                <th style={{ padding: '0.85rem 1rem' }}>Summa</th>
                <th style={{ padding: '0.85rem 1rem' }}>Holati</th>
                <th style={{ padding: '0.85rem 1rem' }}>To‘lov</th>
                <th style={{ padding: '0.85rem 1rem' }}>Sana</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Buyurtmalar yuklanmoqda...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Buyurtmalar topilmadi.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '800' }}>#{ord.order_number}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '600' }}>{ord.customer_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customer_phone}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.85rem' }}>{ord.items?.length || 0} xil tovar</span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>
                      {ord.total_amount.toLocaleString()} so‘m
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <select
                        value={ord.order_status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                        className="form-control"
                        style={{
                          width: 'auto',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          backgroundColor: ord.order_status === 'delivered' ? '#ecfdf5' : ord.order_status === 'cancelled' ? '#fee2e2' : 'var(--bg-subtle)',
                          color: ord.order_status === 'delivered' ? '#047857' : ord.order_status === 'cancelled' ? '#b91c1c' : 'var(--text-main)'
                        }}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>{st.replace('_', ' ').toUpperCase()}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <select
                        value={ord.payment_status}
                        onChange={(e) => handleUpdatePayment(ord.id, e.target.value)}
                        className="form-control"
                        style={{
                          width: 'auto',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.78rem',
                          fontWeight: '700'
                        }}
                      >
                        <option value="pending">Kutilmoqda</option>
                        <option value="paid">To‘langan</option>
                        <option value="failed">Muvaffaqiyatsiz</option>
                        <option value="refunded">Qaytarilgan</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => openOrderDetails(ord)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={14} /> Batafsil
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '780px', padding: '1.75rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                  Buyurtma #{selectedOrder.order_number}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Yaratilgan vaqti: {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Printer size={15} /> Chekni chop etish
                </button>
                <button onClick={() => setSelectedOrder(null)} className="btn-icon">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Customer and Delivery info */}
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px', fontSize: '0.875rem', lineHeight: '1.6' }}>
                <h4 style={{ fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={16} color="var(--primary)" /> Mijoz va Yetkazish
                </h4>
                <div><b>Mijoz:</b> {selectedOrder.customer_name}</div>
                <div><b>Telefon:</b> {selectedOrder.customer_phone}</div>
                <div><b>Yetkazish turi:</b> {selectedOrder.delivery_type === 'pickup' ? '🏪 Do‘kondan olib ketish (Mustaqillik 17)' : '🚗 Kuryer orqali yetkazish'}</div>
                <div><b>To‘lov usuli:</b> {selectedOrder.payment_method.toUpperCase()}</div>
                <div><b>Manzil:</b> {selectedOrder.delivery_address}</div>
                {selectedOrder.delivery_instructions && (
                  <div style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                    <b>Ko‘rsatma:</b> {selectedOrder.delivery_instructions}
                  </div>
                )}
              </div>

              {/* Status & Actions */}
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: '10px' }}>
                <h4 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Holatni boshqarish</h4>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Buyurtma bosqichi:</label>
                  <select
                    value={selectedOrder.order_status}
                    onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                    className="form-control"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>To‘lov holati:</label>
                  <select
                    value={selectedOrder.payment_status}
                    onChange={(e) => handleUpdatePayment(selectedOrder.id, e.target.value)}
                    className="form-control"
                  >
                    <option value="pending">Kutilmoqda</option>
                    <option value="paid">To‘langan</option>
                    <option value="failed">Muvaffaqiyatsiz</option>
                    <option value="refunded">Qaytarilgan</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items table */}
            <h4 style={{ fontWeight: '700', marginBottom: '0.75rem' }}>Tovarlar ro‘yxati</h4>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <tr>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left' }}>Tovar</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>Soni</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Birlik narxi</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((it) => (
                    <tr key={it.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.6rem 0.8rem' }}>
                        <div style={{ fontWeight: '600' }}>{it.product_name}</div>
                        {it.variant_name && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{it.variant_name}</span>}
                      </td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>{it.unit_price.toLocaleString()} so‘m</td>
                      <td style={{ padding: '0.6rem 0.8rem', textAlign: 'right', fontWeight: '700' }}>{it.total_price.toLocaleString()} so‘m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Internal Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Ichki admin eslatmasi (faqat xodimlar uchun):</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Kuryerga eslatma, mijoz istaklari..."
                  className="form-control"
                />
                <button type="button" onClick={handleSaveNotes} className="btn btn-secondary">
                  <Save size={16} /> Saqlash
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.9rem' }}>
              <div>Tovarlar summasi: <b>{(selectedOrder.subtotal_amount || selectedOrder.items?.reduce((s, i) => s + i.total_price, 0) || 0).toLocaleString()} so‘m</b></div>
              {Number(selectedOrder.discount_amount) > 0 && (
                <div style={{ color: '#10b981' }}>Chegirma: <b>-{Number(selectedOrder.discount_amount).toLocaleString()} so‘m</b></div>
              )}
              <div>Yetkazib berish: <b>{Number(selectedOrder.delivery_fee || 0) === 0 ? 'Bepul' : `${Number(selectedOrder.delivery_fee).toLocaleString()} so‘m`}</b></div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', marginTop: '0.4rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem' }}>
                <span>Jami: <span style={{ color: 'var(--primary)' }}>{selectedOrder.total_amount.toLocaleString()} so‘m</span></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
