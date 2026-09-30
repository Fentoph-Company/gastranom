import React, { useState, useEffect } from 'react';
import { History, Shield, Filter, Search } from 'lucide-react';
import { api } from '../../services/api';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [entityFilter, actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAuditLogs({
        entity: entityFilter,
        action: actionFilter,
        limit: 50
      });
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Admin Audit Jurnali</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Tizimdagi barcha ma’muriy o‘zgarishlar, narx tahrirlashlari, holat almashuvlari va o‘chirishlar xronologiyasi
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto' }}
          >
            <option value="">Barcha bo‘limlar</option>
            <option value="products">Mahsulotlar</option>
            <option value="orders">Buyurtmalar</option>
            <option value="categories">Kategoriyalar</option>
            <option value="discounts">Chegirmalar</option>
            <option value="coupons">Kuponlar</option>
            <option value="users">Foydalanuvchilar</option>
            <option value="delivery_zones">Yetkazish zonalari</option>
            <option value="banners">Bannerlar</option>
            <option value="settings">Sozlamalar</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Vaqti</th>
                <th style={{ padding: '0.85rem 1rem' }}>Admin</th>
                <th style={{ padding: '0.85rem 1rem' }}>Amal turi</th>
                <th style={{ padding: '0.85rem 1rem' }}>Bo‘lim</th>
                <th style={{ padding: '0.85rem 1rem' }}>ID</th>
                <th style={{ padding: '0.85rem 1rem' }}>O‘zgarish tafsiloti</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Jurnal yuklanmoqda...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Hozircha audit yozuvlari mavjud emas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{log.admin_name}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-primary" style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {log.entity}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace' }}>#{log.entity_id}</td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', maxWidth: '350px' }}>
                      {log.old_value && (
                        <div style={{ color: '#dc2626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Oldingi: {log.old_value}
                        </div>
                      )}
                      {log.new_value && (
                        <div style={{ color: '#059669', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Yangi: {log.new_value}
                        </div>
                      )}
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
