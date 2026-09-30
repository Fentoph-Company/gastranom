import React from 'react';
import { Truck, ShieldCheck, HelpCircle, FileText, Lock } from 'lucide-react';

export function FAQPage() {
  const faqs = [
    {
      q: 'Buyurtmani qanday berishim mumkin?',
      a: 'O‘zingizga yoqqan mahsulotlarni tanlab, savatga qo‘shing. So‘ng "Rasmiylashtirish" tugmasini bosing, yetkazib berish manzili va to‘lov usulini tanlang.'
    },
    {
      q: 'Yetkazib berish narxi qancha va qancha vaqt oladi?',
      a: 'Xiva shahrida (0-5 km) 30-45 daqiqada 10 000 so‘m. Shahar atrofi (5-15 km) 18 000 so‘m, Urganch shahriga 25 000 so‘m, boshqa tumanlarga 35 000 so‘m. 150 000 so‘mdan yuqori buyurtmalar bepul yetkaziladi!'
    },
    {
      q: 'Qanday to‘lov turlari mavjud?',
      a: 'Payme, Click, Bank kartalari (Uzcard, Humo, Visa, Mastercard) orqali onlayn yoki buyurtmani qabul qilganda kuryerga naqd pul / karta orqali to‘lashingiz mumkin.'
    },
    {
      q: 'Mahsulot sifati ma’qul kelmasa nima qilish kerak?',
      a: 'Buyurtmani kuryer huzurida ochib tekshirishingiz mumkin. Agar mahsulot sifati yoki holati sizni qanoatlantirmasa, kuryer uni darhol almashtirib beradi yoki pulingiz qaytariladi.'
    }
  ];

  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>Ko‘p beriladigan savollar (FAQ)</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gastranom oziq-ovqat do‘koni (Xiva, Mustaqillik ko‘chasi, 17 • Ish vaqti: 10:00–23:00) bo‘yicha savollarga javoblar</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {faqs.map((faq, i) => (
          <div key={i} className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '0.6rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HelpCircle size={18} color="var(--primary)" /> {faq.q}
            </h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.925rem' }}>{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeliveryInfoPage() {
  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Yetkazib berish shartlari</h1>
      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.7' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
            1. Xiva va Xorazm viloyati bo‘ylab tezkor yetkazish
          </h3>
          <p>
            Gastranom (Xiva, Mustaqillik ko‘chasi, 17 • Plus-kod: 99J4+JF) o‘z professional kuryerlik tarmog‘iga ega. Markaziy zonalarga (0-5 km) o‘rtacha 30-45 daqiqa ichida buyurtmani eshikkacha yetkazib beradi. Shahar atrofiga 45-60 daqiqa, Urganch shahriga esa 1-2 soat oralig‘ida yetkaziladi.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
            2. Bepul yetkazib berish chegarasi
          </h3>
          <p>
            Mijozlarimiz 150 000 so‘m va undan ortiq xarid qilganlarida Xiva shahri bo‘ylab yetkazib berish butunlay <b>BEPUL</b> amalga oshiriladi.
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>
            3. Harorat rejimiga rioya qilish
          </h3>
          <p>
            Barcha go‘sht, sut va pishloq mahsulotlari maxsus sovutgichli termobokslarda tashiladi. Bu esa harorat o‘zgarishsiz, mahsulotning tabiiy yangiligini kafolatlaydi.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Foydalanish shartlari</h1>
      <div className="card" style={{ padding: '2rem', lineHeight: '1.7' }}>
        <p style={{ marginBottom: '1rem' }}>
          Ushbu hujjat Gastranom onlayn do‘koni (keyingi o‘rinlarda "Do‘kon") xizmatlaridan foydalanish qoidalarini belgilaydi.
        </p>
        <h4 style={{ fontWeight: '700', margin: '1rem 0 0.5rem' }}>1. Buyurtmani rasmiylashtirish</h4>
        <p>Buyurtma berish orqali xaridor taqdim etgan ma’lumotlarining to‘g‘riligini tasdiqlaydi.</p>
        <h4 style={{ fontWeight: '700', margin: '1rem 0 0.5rem' }}>2. Narxlar va to‘lov</h4>
        <p>Barcha narxlar O‘zbekiston so‘mida ko‘rsatilgan va qo‘shilgan qiymat solig‘ini o‘z ichiga oladi.</p>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="container" style={{ padding: '2.5rem 1.25rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1.5rem' }}>Maxfiylik siyosati</h1>
      <div className="card" style={{ padding: '2rem', lineHeight: '1.7' }}>
        <p style={{ marginBottom: '1rem' }}>
          Gastranom mijozlarning shaxsiy ma’lumotlarini qat’iy himoya qiladi va uchinchi shaxslarga bermaydi.
        </p>
        <h4 style={{ fontWeight: '700', margin: '1rem 0 0.5rem' }}>Ma’lumotlar xavfsizligi</h4>
        <p>Parollar va to‘lov ma’lumotlari xavfsiz shifrlangan holda saqlanadi.</p>
      </div>
    </div>
  );
}
