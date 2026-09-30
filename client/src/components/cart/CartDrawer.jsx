import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer({ onNavigate }) {
  const {
    cart,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalDiscount,
    itemCount
  } = useCart();

  if (!isCartOpen) return null;

  const freeThreshold = 250000;
  const remainingForFree = Math.max(0, freeThreshold - subtotal);
  const progressPercent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  return (
    <>
      <div className="drawer-overlay" onClick={closeCart} />
      <div className="drawer-right">
        {/* Drawer Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Savat ({itemCount})</h3>
          </div>
          <button onClick={closeCart} className="btn-icon" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Free Shipping Progress Meter */}
        <div style={{ padding: '0.85rem 1.5rem', backgroundColor: remainingForFree === 0 ? '#ecfdf5' : '#fffbeb', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.4rem' }}>
            {remainingForFree === 0 ? (
              <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Sparkles size={14} /> Tabriklaymiz! Siz uchun yetkazib berish BEPUL!
              </span>
            ) : (
              <span style={{ color: '#b45309' }}>
                Bepul yetkazishgacha yana <b>{remainingForFree.toLocaleString()} so‘m</b>
              </span>
            )}
            <span style={{ color: 'var(--text-muted)' }}>{progressPercent}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: remainingForFree === 0 ? '#10b981' : '#f59e0b',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {cart.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <ShoppingBag size={32} color="#94a3b8" />
              </div>
              <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Savatingiz hozircha bo‘sh</h4>
              <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>O‘zingizga yoqqan yangi mahsulotlarni tanlang va savatga qo‘shing.</p>
              <button
                onClick={() => {
                  closeCart();
                  onNavigate('catalog');
                }}
                className="btn btn-primary"
              >
                Xaridni boshlash
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: '0.85rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-light)'
                  }}
                >
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120'}
                    alt={item.name}
                    style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-main)', lineHeight: '1.3' }}>
                        {item.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{ color: '#94a3b8', padding: '2px', marginLeft: '6px' }}
                        title="O‘chirish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {item.variantTitle && (
                      <span className="badge badge-neutral" style={{ marginTop: '3px', fontSize: '0.7rem' }}>
                        {item.variantTitle}
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem' }}>
                      {/* Price */}
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          {item.unitPrice.toLocaleString()} so‘m
                        </div>
                        {item.hasDiscount && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                            {item.originalPrice.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1.5px solid var(--border-color)',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--bg-subtle)'
                          }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ width: '32px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stockAvailable}
                          style={{
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: item.quantity >= item.stockAvailable ? 'var(--border-light)' : 'var(--bg-subtle)',
                            opacity: item.quantity >= item.stockAvailable ? 0.4 : 1
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Summary */}
        {cart.items.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              <span>Oraliq jami:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{subtotal.toLocaleString()} so‘m</span>
            </div>

            {totalDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.4rem', color: '#10b981' }}>
                <span>Tejov (Chegirma):</span>
                <span style={{ fontWeight: '700' }}>-{totalDiscount.toLocaleString()} so‘m</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: '800', marginTop: '0.65rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>
              <span>Jami:</span>
              <span style={{ color: 'var(--primary)' }}>{subtotal.toLocaleString()} so‘m</span>
            </div>

            <button
              onClick={() => {
                closeCart();
                onNavigate('checkout');
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', borderRadius: '12px' }}
            >
              <span>Rasmiylashtirish</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
