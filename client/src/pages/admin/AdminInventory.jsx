import React, { useState, useEffect } from 'react';
import { Boxes, AlertTriangle, Search, Check, Edit3, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState('');
  const [newThreshold, setNewThreshold] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadInventory();
  }, [lowStockOnly]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getInventory(lowStockOnly);
      if (res.success) {
        setInventory(res.inventory || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdjust = (prod) => {
    setSelectedProduct(prod);
    setNewStock(String(prod.stock_quantity));
    setNewThreshold(String(prod.low_stock_threshold || 5));
    setAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      await api.admin.adjustInventory({
        productId: selectedProduct.id,
        newStock: Number(newStock),
        lowStockThreshold: Number(newThreshold)
      });

      showToast(`"${selectedProduct.name}" zaxirasi muvaffaqiyatli yangilandi!`);
      setAdjustModalOpen(false);
      await loadInventory();
    } catch (err) {
      showToast(err.message || 'Xatolik yuz berdi.', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Ombor va Mahsulot Qoldiqlari</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Real vaqtdagi zaxira, sotilgan miqdor va kam qolgan tovarlar nazorati</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setLowStockOnly(false)}
            className={`btn btn-sm ${!lowStockOnly ? 'btn-primary' : 'btn-secondary'}`}
          >
            Barcha tovarlar ({inventory.length})
          </button>
          <button
            onClick={() => setLowStockOnly(true)}
            className={`btn btn-sm ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <AlertTriangle size={15} /> Kam qolganlar
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Tovar</th>
                <th style={{ padding: '0.85rem 1rem' }}>SKU</th>
                <th style={{ padding: '0.85rem 1rem' }}>Kategoriya</th>
                <th style={{ padding: '0.85rem 1rem' }}>Mavjud zaxira</th>
                <th style={{ padding: '0.85rem 1rem' }}>Sotilgan</th>
                <th style={{ padding: '0.85rem 1rem' }}>Signal chegarasi</th>
                <th style={{ padding: '0.85rem 1rem' }}>Holati</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Zaxiralar yuklanmoqda...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Kam qolgan tovarlar yo‘q. Hamma mahsulotlar yetarli miqdorda!
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const isLow = item.stock_quantity <= item.low_stock_threshold;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: isLow ? '#fff1f2' : 'transparent' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'}
                            alt=""
                            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <span style={{ fontWeight: '700' }}>{item.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.sku}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{item.category_name}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: '800', fontSize: '1rem', color: isLow ? '#dc2626' : '#10b981' }}>
                          {item.stock_quantity} ta
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: '600' }}>
                        {item.sold_quantity || 0} ta
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                        ≤ {item.low_stock_threshold} ta
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {isLow ? (
                          <span className="badge badge-danger">Kam qolgan!</span>
                        ) : (
                          <span className="badge badge-success">Yetarli</span>
                        )}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenAdjust(item)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={14} /> To‘ldirish
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="modal-overlay" onClick={() => setAdjustModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                Zaxirani to‘ldirish
              </h3>
              <button onClick={() => setAdjustModalOpen(false)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              <b>{selectedProduct.name}</b> uchun yangi qoldiq miqdorini belgilang.
            </p>

            <form onSubmit={handleSaveAdjustment}>
              <div className="form-group">
                <label className="form-label">Yangi ombor qoldig‘i (dona) *</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ogohlantirish chegarasi (dona)</label>
                <input
                  type="number"
                  min={1}
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="form-control"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setAdjustModalOpen(false)} className="btn btn-secondary">
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
