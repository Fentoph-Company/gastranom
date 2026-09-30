import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  Percent,
  Truck,
  MessageSquare,
  Users,
  Image,
  History,
  Settings,
  Store,
  LogOut,
  Bell,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout({ activePage, setActivePage, onNavigateToStore, children }) {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Buyurtmalar', icon: Package },
    { id: 'products', label: 'Mahsulotlar', icon: Boxes },
    { id: 'categories', label: 'Kategoriyalar', icon: FolderTree },
    { id: 'inventory', label: 'Ombor & Qoldiq', icon: Boxes },
    { id: 'discounts', label: 'Chegirma & Kuponlar', icon: Percent },
    { id: 'delivery', label: 'Yetkazib berish', icon: Truck },
    { id: 'reviews', label: 'Sharhlar nazorati', icon: MessageSquare },
    { id: 'customers', label: 'Mijozlar bazasi', icon: Users },
    { id: 'banners', label: 'Bannerlar & CMS', icon: Image },
    { id: 'audit-logs', label: 'Audit Jurnali', icon: History },
    { id: 'settings', label: 'Do‘kon Sozlamalari', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarCollapsed ? '72px' : '260px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease',
          zIndex: 100,
          position: 'sticky',
          top: 0,
          height: '100vh'
        }}
      >
        {/* Brand */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
              G
            </div>
            {!sidebarCollapsed && (
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>GASTRANOM</div>
                <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>Admin Panel</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '10px',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  backgroundColor: isActive ? '#10b981' : 'transparent',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                title={item.label}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <button
            onClick={onNavigateToStore}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              color: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <Store size={18} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span>Do‘konga o‘tish</span>}
          </button>

          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && <span>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 90
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="btn btn-secondary btn-icon"
              style={{ width: '36px', height: '36px' }}
            >
              <Menu size={18} />
            </button>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', textTransform: 'capitalize' }}>
              {menuItems.find((m) => m.id === activePage)?.label || 'Boshqaruv'}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.875rem' }}>
                AD
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{user?.name || 'Administrator'}</div>
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '600' }}>Onlayn • Boshqaruvchi</div>
              </div>
            </div>
          </div>
        </header>

        {/* View Content */}
        <main style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
