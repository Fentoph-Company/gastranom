import React, { useState, useEffect } from 'react';
import { Users, Search, Ban, CheckCircle2, ShoppingBag } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getCustomers({ search });
      if (res.success) setCustomers(res.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const actionWord = nextStatus === 'disabled' ? 'bloklashni' : 'faollashtirishni';

    if (!window.confirm(`Mijoz hisobini ${actionWord} tasdiqlaysizmi?`)) return;

    try {
      await api.admin.updateCustomerStatus(id, nextStatus);
      showToast(`Mijoz hisobi ${nextStatus === 'active' ? 'faollashtirildi' : 'bloklandi'}.`);
      await loadCustomers();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Mijozlar Bazasi</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Ro‘yxatdan o‘tgan xaridorlar, buyurtmalar soni va sarflangan mablag‘</p>
        </div>

        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, email yoki telefon..."
            className="form-control"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Mijoz</th>
                <th style={{ padding: '0.85rem 1rem' }}>Aloqa</th>
                <th style={{ padding: '0.85rem 1rem' }}>Buyurtmalar soni</th>
                <th style={{ padding: '0.85rem 1rem' }}>Jami sarflagan</th>
                <th style={{ padding: '0.85rem 1rem' }}>Ro‘yxatdan o‘tgan</th>
                <th style={{ padding: '0.85rem 1rem' }}>Holati</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Mijozlar yuklanmoqda...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Mijozlar topilmadi.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                          {c.name.charAt(0)}
                        </div>
                        <div style={{ fontWeight: '700' }}>{c.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>{c.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone || 'Telefon yo‘q'}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>
                      {c.total_orders || 0} ta
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {Number(c.total_spent || 0).toLocaleString()} so‘m
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {c.status === 'active' ? 'Faol' : 'Bloklangan'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        className={`btn btn-sm ${c.status === 'active' ? 'btn-outline' : 'btn-primary'}`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {c.status === 'active' ? 'Bloklash' : 'Faollashtirish'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
