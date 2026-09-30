import React from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Truck, RefreshCw, Award, Star, Store } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', marginTop: '4rem', borderTop: '1px solid #1e293b' }}>
      {/* Benefits section */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '2.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <Truck size={24} />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Tezkor Yetkazib Berish</h4>
                <p style={{ fontSize: '0.85rem' }}>Xiva va Xorazm viloyati bo‘ylab 30 daqiqadan 1 soatgacha yetkazish.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <Award size={24} />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1.05rem', marginBottom: '0.25rem' }}>100% Saralangan Sifat</h4>
                <p style={{ fontSize: '0.85rem' }}>Faqat yangi, tekshirilgan va halol sertifikatlangan premium mahsulotlar.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <RefreshCw size={24} />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Oson Qaytarish</h4>
                <p style={{ fontSize: '0.85rem' }}>Agar mahsulot sizga ma’qul kelmasa, kuryer huzurida almashtirib beramiz.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 style={{ color: '#ffffff', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Xavfsiz To‘lovlar</h4>
                <p style={{ fontSize: '0.85rem' }}>Payme, Click, Uzum yoki qabul qilganda naqd pul orqali qulay to‘lov.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div style={{ padding: '3.5rem 0 2.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem' }}>
            {/* Col 1: About */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800' }}>
                  G
                </div>
                <span style={{ fontFamily: 'Outfit', fontSize: '1.3rem', fontWeight: '800', color: '#ffffff' }}>GASTRANOM</span>
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                Gastranom — har kuni sifatli va yangi noz-ne’matlarni uyingizga yetkazib beruvchi zamonaviy onlayn supermarket.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                <a
                  href="https://yandex.uz/maps/?pt=60.355998,41.381527&z=17&l=map"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}
                  title="Yandex Xaritada ochish (41.381527, 60.355998)"
                >
                  <MapPin size={16} color="#10b981" /> Xiva, Mustaqillik ko‘chasi, 17
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.78rem', marginLeft: '1.5rem', flexWrap: 'wrap' }}>
                  <span>Plus-kod: <b style={{ color: '#e2e8f0' }}>99J4+JF</b></span>
                  <span>•</span>
                  <span>Koordinatalar: 41.381527, 60.355998</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
                  <Store size={16} color="#10b981" /> Oziq-ovqat do‘koni
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
                  <Clock size={16} color="#10b981" /> Har kuni 10:00–23:00
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
                  <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  <span style={{ fontWeight: '700', color: '#f8fafc' }}>4.1 / 5</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>(94 ta xaridor bahosi)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                  <Phone size={16} color="#10b981" /> +998 (71) 200-45-45
                </div>
              </div>
            </div>

            {/* Col 2: Catalog Links */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Katalog</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                <li><button onClick={() => onNavigate('catalog', { category: 'mevalar-va-sabzavotlar' })} style={{ color: '#94a3b8' }}>Mevalar va Sabzavotlar</button></li>
                <li><button onClick={() => onNavigate('catalog', { category: 'gosht-va-baliq' })} style={{ color: '#94a3b8' }}>Halol Go‘sht va Baliq</button></li>
                <li><button onClick={() => onNavigate('catalog', { category: 'sut-va-pishloq' })} style={{ color: '#94a3b8' }}>Sut va Pishloqlar</button></li>
                <li><button onClick={() => onNavigate('catalog', { category: 'non-va-pishiriqlar' })} style={{ color: '#94a3b8' }}>Non va Issiq Pishiriqlar</button></li>
                <li><button onClick={() => onNavigate('catalog', { category: 'qahva-va-shirinliklar' })} style={{ color: '#94a3b8' }}>Qahva va Shirinliklar</button></li>
                <li><button onClick={() => onNavigate('discounts')} style={{ color: '#fbbf24', fontWeight: '600' }}>Aksiyalar & Chegirmalar</button></li>
              </ul>
            </div>

            {/* Col 3: Customer Service */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Xaridorlarga</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.875rem' }}>
                <li><button onClick={() => onNavigate('delivery-info')} style={{ color: '#94a3b8' }}>Yetkazib berish shartlari</button></li>
                <li><button onClick={() => onNavigate('faq')} style={{ color: '#94a3b8' }}>Ko‘p beriladigan savollar (FAQ)</button></li>
                <li><button onClick={() => onNavigate('profile')} style={{ color: '#94a3b8' }}>Shaxsiy kabinet</button></li>
                <li><button onClick={() => onNavigate('my-orders')} style={{ color: '#94a3b8' }}>Buyurtmani kuzatish</button></li>
                <li><button onClick={() => onNavigate('terms')} style={{ color: '#94a3b8' }}>Foydalanish shartlari</button></li>
                <li><button onClick={() => onNavigate('privacy')} style={{ color: '#94a3b8' }}>Maxfiylik siyosati</button></li>
              </ul>
            </div>

            {/* Col 4: Payments & Guarantee */}
            <div>
              <h4 style={{ color: '#ffffff', fontSize: '1rem', fontWeight: '700', marginBottom: '1.25rem' }}>To‘lov usullari</h4>
              <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
                Buyurtmangizni o‘zingizga qulay bo‘lgan usulda to‘lang:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {['Payme', 'Click', 'Uzum', 'Humo', 'Uzcard', 'Naqd pul'].map((provider) => (
                  <span
                    key={provider}
                    style={{
                      backgroundColor: '#1e293b',
                      color: '#cbd5e1',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '600'
                    }}
                  >
                    {provider}
                  </span>
                ))}
              </div>

              <h4 style={{ color: '#ffffff', fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.5rem' }}>Ijtimoiy tarmoqlarimiz</h4>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a href="https://t.me" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: '0.85rem' }}>Telegram</a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: '#f43f5e', fontSize: '0.85rem' }}>Instagram</a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', fontSize: '0.85rem' }}>Facebook</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bottom */}
      <div style={{ borderTop: '1px solid #1e293b', padding: '1.25rem 0', fontSize: '0.8rem', textAlign: 'center' }}>
        <div className="container">
          © {new Date().getFullYear()} Gastranom Supermarket MCHJ. Barcha huquqlar himoyalangan. Ishlab chiqarilgan O‘zbekiston.
        </div>
      </div>
    </footer>
  );
}
