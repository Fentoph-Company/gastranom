import React, { useState, useEffect } from 'react';
import { Star, CheckCircle2, XCircle, Trash2, ShieldCheck, Check } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getAllReviews();
      if (res.success) setReviews(res.reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.admin.updateReviewStatus(id, status);
      showToast(`Sharh holati "${status}" ga o‘zgartirildi.`);
      await loadReviews();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sharhni o‘chirishni tasdiqlaysizmi?')) return;
    try {
      await api.admin.deleteReview(id);
      showToast('Sharh o‘chirildi.');
      await loadReviews();
    } catch (err) {
      showToast(err.message || 'O‘chirib bo‘lmadi.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Mijozlar Sharhlari Nazorati</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mijozlar qoldirgan baholar va fikrlarni moderatsiya qilish</p>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Mahsulot</th>
                <th style={{ padding: '0.85rem 1rem' }}>Mijoz</th>
                <th style={{ padding: '0.85rem 1rem' }}>Baho</th>
                <th style={{ padding: '0.85rem 1rem' }}>Sharh matni</th>
                <th style={{ padding: '0.85rem 1rem' }}>Tasdiqlangan xarid</th>
                <th style={{ padding: '0.85rem 1rem' }}>Holati</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Sharhlar yuklanmoqda...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Sharhlar mavjud emas.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => (
                  <tr key={rev.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>{rev.product_name}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: '600' }}>{rev.user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rev.user_email}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '2px', color: '#f59e0b' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} fill={s <= rev.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', maxWidth: '300px' }}>
                      <div style={{ lineHeight: '1.4' }}>{rev.comment}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {rev.is_verified_purchase === 1 ? (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                          Ha, xarid qilingan
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Oddiy sharh</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${rev.status === 'approved' ? 'badge-success' : rev.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {rev.status === 'approved' ? 'Tasdiqlangan' : rev.status === 'rejected' ? 'Rad etilgan' : 'Kutilmoqda'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        {rev.status !== 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(rev.id, 'approved')}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#059669' }}
                            title="Tasdiqlash"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {rev.status !== 'rejected' && (
                          <button
                            onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#dc2626' }}
                            title="Rad etish"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(rev.id)}
                          className="btn btn-outline btn-sm btn-icon"
                          style={{ color: 'var(--danger)' }}
                          title="O‘chirish"
                        >
                          <Trash2 size={14} />
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
    </div>
  );
}
