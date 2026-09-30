import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  AlertTriangle,
  Percent,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminDashboard({ onNavigateTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getDashboard();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Dashboard yuklanmoqda...</div>;
  }

  const { metrics, charts, recentOrders } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Top KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Total Sales */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jami Tushum</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            {Number(metrics.totalRevenue).toLocaleString()} so‘m
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem', fontWeight: '600' }}>
            Bugun: {Number(metrics.todayRevenue).toLocaleString()} so‘m
          </div>
        </div>

        {/* Total Orders */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Buyurtmalar</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {metrics.totalOrders} ta
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.35rem', fontWeight: '600' }}>
            Kutilmoqda: {metrics.pendingOrders} ta
          </div>
        </div>

        {/* Customers */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mijozlar</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {metrics.totalCustomers} nafar
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            Faol xaridorlar bazasi
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          className="card"
          onClick={() => onNavigateTab('inventory')}
          style={{ padding: '1.25rem', cursor: 'pointer', borderColor: metrics.lowStockProducts > 0 ? '#fecaca' : 'var(--border-color)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: metrics.lowStockProducts > 0 ? '#dc2626' : 'var(--text-muted)', textTransform: 'uppercase' }}>
              Kam qolgan tovarlar
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: metrics.lowStockProducts > 0 ? '#dc2626' : 'var(--text-main)' }}>
            {metrics.lowStockProducts} ta
          </div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.35rem', fontWeight: '600' }}>
            Omborni to‘ldirish tavsiya etiladi
          </div>
        </div>
      </div>

      {/* 2. Charts & Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Sales Chart SVG */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            Oxirgi 7 kunlik tushum dinamikasi
          </h3>
          {charts.salesOverTime?.length > 0 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              {charts.salesOverTime.map((d, i) => {
                const maxRev = Math.max(...charts.salesOverTime.map((x) => x.revenue || 1));
                const heightPercent = Math.max(12, Math.round(((d.revenue || 0) / maxRev) * 100));

                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {(d.revenue / 1000).toFixed(0)}k
                    </div>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '36px',
                        height: `${heightPercent}%`,
                        backgroundColor: '#10b981',
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.4s'
                      }}
                      title={`${d.revenue.toLocaleString()} so‘m (${d.order_count} ta buyurtma)`}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Oxirgi 7 kunda tushum ma’lumotlari mavjud emas
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1.25rem' }}>
            Top sotilgan mahsulotlar
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {charts.topProducts?.map((p, idx) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontWeight: '800', color: idx === 0 ? '#f59e0b' : 'var(--text-muted)', fontSize: '0.9rem', width: '16px' }}>
                    {idx + 1}
                  </span>
                  <img src={p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=80'} alt="" style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Omborda: {p.stock_quantity} dona</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>
                    {p.sold_quantity} ta sotildi
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.price.toLocaleString()} so‘m</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Recent Orders Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Oxirgi buyurtmalar</h3>
          <button
            onClick={() => onNavigateTab('orders')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Barcha buyurtmalar</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Raqami</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Mijoz</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Summa</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Holat</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>To‘lov</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>Vaqti</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((ord) => (
                <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700' }}>#{ord.order_number}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <div>{ord.customer_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ord.customer_phone}</div>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: '700' }}>
                    {ord.total_amount.toLocaleString()} so‘m
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                      {ord.order_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span className={`badge ${ord.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {ord.payment_status === 'paid' ? 'To‘langan' : 'Kutilmoqda'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(ord.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
