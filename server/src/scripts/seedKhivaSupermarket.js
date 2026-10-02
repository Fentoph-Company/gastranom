import bcrypt from 'bcryptjs';
import db from '../db/connection.js';
import { initializeSchema } from '../db/schema.js';

console.log('>>> [START] Seeding complete Gastronom Khiva 24/7 Supermarket Database...');

initializeSchema();

const seedTx = db.transaction(() => {
  // Clear old test data cleanly
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM notifications;
    DELETE FROM cart_items;
    DELETE FROM wishlist;
    DELETE FROM reviews;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM coupon_usages;
    DELETE FROM coupons;
    DELETE FROM discounts;
    DELETE FROM product_variants;
    DELETE FROM product_images;
    DELETE FROM products;
    DELETE FROM brands;
    DELETE FROM categories;
    DELETE FROM delivery_zones;
    DELETE FROM addresses;
    DELETE FROM users;
    DELETE FROM banners;
    DELETE FROM settings;
    DELETE FROM sqlite_sequence;
  `);

  // 1. Settings (24/7, Mustaqillik 17, Khiva, Telegram integration)
  const upsertSetting = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?)`);
  const initialSettings = {
    store_name: 'Gastronom',
    store_tagline: 'Xivadagi sevimli do‘koningiz, endi uyingizgacha.',
    contact_phone: '+998 (71) 200-45-45',
    contact_email: 'support@gastranom.uz',
    currency: 'UZS',
    store_address: 'Mustaqillik ko‘chasi, 17, Xiva, Xorazm viloyati',
    store_city: 'Xiva',
    store_region: 'Xorazm viloyati',
    store_type: 'Oziq-ovqat supermarketi',
    store_rating: 4.1,
    store_review_count: 94,
    working_hours: '24/7 (Kechayu-kunduz)',
    plus_code: '99J4+JF',
    free_delivery_threshold: 150000,
    store_coordinates: {
      lat: 41.381527,
      lng: 60.355998,
      plus_code: '99J4+JF',
      address: 'Mustaqillik ko‘chasi, 17, Xiva'
    },
    maps_url: 'https://yandex.uz/maps/?pt=60.355998,41.381527&z=17&l=map',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=41.381527,60.355998',
    telegram_bot_token: '8857592268:AAGiB4PXMWli-Ag6s-LfBhK_hHeC4YQHWQE',
    telegram_chat_id: '',
    telegram_notifications_enabled: true,
    sms_notifications_enabled: false,
    email_notifications_enabled: true,
    social_links: {
      telegram: 'https://t.me/gastranom_uz',
      instagram: 'https://instagram.com/gastranom_uz',
      facebook: 'https://facebook.com/gastranom_uz'
    },
    faq: [
      { q: 'Gastronom qaysi vaqtlarda ishlaydi?', a: 'Do‘konimiz va onlayn yetkazib berish xizmati 24/7 — kun-u tun, dam olish kunlarisiz doimiy ishlaydi.' },
      { q: 'Qanday to‘lov turlari mavjud?', a: 'Buyurtmani qabul qilganda naqd pul, terminal orqali karta (Humo, Uzcard, Visa, Mastercard) yoki onlayn to‘lov (Payme, Click) orqali to‘lashingiz mumkin.' },
      { q: 'Yetkazib berish qancha vaqt oladi?', a: 'Xiva shahrida o‘rtacha 20-45 daqiqa ichida issiq va yangi holatda yetkaziladi. Do‘kondan o‘zingiz olib ketish (Pickup) ham bepul mavjud.' },
      { q: 'Bepul yetkazib berish chegarasi qancha?', a: '150 000 so‘m va undan yuqori buyurtmalar Xiva shahri bo‘ylab mutlaqo bepul yetkazib beriladi.' }
    ]
  };

  for (const [key, val] of Object.entries(initialSettings)) {
    upsertSetting.run(key, JSON.stringify(val));
  }

  // 2. Roles & Users (Super Admin, Manager, Operator, Warehouse, Courier, Customer)
  const superHash = bcrypt.hashSync('adminpassword123', 10);
  const userStmt = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `);

  const superAdmin = userStmt.run('Bosh Administrator', 'admin@gastranom.uz', superHash, '+998901234567', 'admin').lastInsertRowid;
  const manager = userStmt.run('Mahsulot Menejeri', 'manager@gastranom.uz', superHash, '+998901234568', 'manager').lastInsertRowid;
  const operator = userStmt.run('Buyurtmalar Operatori', 'operator@gastranom.uz', superHash, '+998901234569', 'operator').lastInsertRowid;
  const warehouse = userStmt.run('Ombor Mudiri', 'sklad@gastranom.uz', superHash, '+998901234570', 'warehouse').lastInsertRowid;
  const courier = userStmt.run('Kuryer Ahmad', 'kuryer@gastranom.uz', superHash, '+998901234571', 'courier').lastInsertRowid;
  const customer = userStmt.run('Jasur Alimov', 'jasur@example.uz', superHash, '+998971112233', 'customer').lastInsertRowid;

  // Customer default address
  db.prepare(`
    INSERT INTO addresses (user_id, title, recipient_name, phone, region, city, street, house, is_default)
    VALUES (?, 'Uy (Bosh manzil)', 'Jasur Alimov', '+998971112233', 'Xorazm viloyati', 'Xiva shahri', 'Mustaqillik ko‘chasi', '17-uy', 1)
  `).run(customer);

  // 3. Delivery Zones for Khiva
  const zoneStmt = db.prepare(`
    INSERT INTO delivery_zones (name, region, price, free_threshold, estimated_time, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const z1 = zoneStmt.run('Xiva markazi (0–2 km, Ichan Qalʼa)', 'Xorazm viloyati', 10000, 100000, '20-30 daqiqa').lastInsertRowid;
  const z2 = zoneStmt.run('Xiva shahri to‘liq (2–5 km)', 'Xorazm viloyati', 15000, 150000, '30-45 daqiqa').lastInsertRowid;
  const z3 = zoneStmt.run('Xiva atrofi (5–10 km, Sayot, Qiyot)', 'Xorazm viloyati', 20000, 200000, '45-60 daqiqa').lastInsertRowid;
  const z4 = zoneStmt.run('Urganch shahri va yaqin hududlar (10–25 km)', 'Xorazm viloyati', 25000, 250000, '1-2 soat').lastInsertRowid;

  // 4. All 15 Categories specified in Requirements
  const catStmt = db.prepare(`
    INSERT INTO categories (name, slug, description, image_url, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const categories = [
    { name: 'Non va non mahsulotlari', slug: 'non-va-non-mahsulotlari', desc: 'Issiq tandir nonlar, Xiva patiri, baton va pishiriqlar', img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop', sort: 1 },
    { name: 'Sut mahsulotlari', slug: 'sut-mahsulotlari', desc: 'Sut, qaymoq, suzma, sariyog‘ va sifatli pishloqlar', img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop', sort: 2 },
    { name: 'Go‘sht mahsulotlari', slug: 'gosht-mahsulotlari', desc: 'Halol mol go‘shti, qo‘y go‘shti va tovuq filesi', img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop', sort: 3 },
    { name: 'Kolbasa va yarim tayyor mahsulotlar', slug: 'kolbasa-va-yarim-tayyor-mahsulotlar', desc: 'Halol sosiska, pishirilgan va dudlangan kolbasalar, chuchvara', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop', sort: 4 },
    { name: 'Ichimliklar', slug: 'ichimliklar', desc: 'Sharbatlar, gazli ichimliklar, toza mineral suvlar', img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop', sort: 5 },
    { name: 'Shirinliklar', slug: 'shirinliklar', desc: 'Shokoladlar, pechenye, konfetlar va sharq shirinliklari', img: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop', sort: 6 },
    { name: 'Meva va sabzavotlar', slug: 'meva-va-sabzavotlar', desc: 'Yangi uzilgan mevalar, saralangan sabzavot va ko‘katlar', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop', sort: 7 },
    { name: 'Oziq-ovqat', slug: 'oziq-ovqat', desc: 'Guruch, yog‘, un, makaron, shakar va ziravorlar', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop', sort: 8 },
    { name: 'Gigiyena', slug: 'gigiyena', desc: 'Sovun, shampun, tish pastasi va shaxsiy parvarish vositalari', img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop', sort: 9 },
    { name: 'Maishiy kimyo', slug: 'maishiy-kimyo', desc: 'Kukunlar, tozalash va yuvish vositalari, tozalik anjomlari', img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop', sort: 10 },
    { name: 'Bolalar mahsulotlari', slug: 'bolalar-mahsulotlari', desc: 'Tagliklar (Pampers), bolalar bo‘tqalari va pyurelari', img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop', sort: 11 },
    { name: 'Konservalar', slug: 'konservalar', desc: 'Konservalangan no‘xat, makkajo‘xori, baliq va zaytunlar', img: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=600&auto=format&fit=crop', sort: 12 },
    { name: 'Choy va qahva', slug: 'choy-va-qahva', desc: 'Ko‘k va qora choylar, donador va eruvchan qahvalar', img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop', sort: 13 },
    { name: 'Muzlatilgan mahsulotlar', slug: 'muzlatilgan-mahsulotlar', desc: 'Muzlatilgan sabzavotlar, muzqaymoq, xamir mahsulotlari', img: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop', sort: 14 },
    { name: 'Boshqa', slug: 'boshqa', desc: 'Foydali xaridlar, batareyalar, salfetkalar va bir martalik buyumlar', img: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=600&auto=format&fit=crop', sort: 15 }
  ];

  const catMap = {};
  for (const c of categories) {
    const res = catStmt.run(c.name, c.slug, c.desc, c.img, c.sort);
    catMap[c.slug] = res.lastInsertRowid;
  }

  // 5. Brands
  const brandStmt = db.prepare('INSERT INTO brands (name, slug, logo_url) VALUES (?, ?, ?)');
  const bCocaCola = brandStmt.run('Coca-Cola', 'coca-cola', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100').lastInsertRowid;
  const bPepsi = brandStmt.run('Pepsi', 'pepsi', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=100').lastInsertRowid;
  const bNestle = brandStmt.run('Nestlé', 'nestle', 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=100').lastInsertRowid;
  const bBarilla = brandStmt.run('Barilla', 'barilla', 'https://images.unsplash.com/photo-1621996346565-e3d5d62816f1?w=100').lastInsertRowid;
  const bLavazza = brandStmt.run('Lavazza', 'lavazza', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=100').lastInsertRowid;
  const bMusaffo = brandStmt.run('Musaffo', 'musaffo', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100').lastInsertRowid;
  const bMakfa = brandStmt.run('Makfa', 'makfa', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100').lastInsertRowid;
  const bRozmetov = brandStmt.run('Rozmetov', 'rozmetov', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=100').lastInsertRowid;
  const bAhmadTea = brandStmt.run('Ahmad Tea', 'ahmad-tea', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=100').lastInsertRowid;

  // 6. Products with units, barcodes, stock & low-stock alerts
  const prodStmt = db.prepare(`
    INSERT INTO products (
      name, slug, description, short_description, category_id, brand_id, sku, barcode,
      price, previous_price, stock_quantity, low_stock_threshold, status, unit, weight, dimensions,
      tags, specifications, is_featured, is_popular, is_new, is_bestseller, min_order_quantity, max_order_quantity
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const imgStmt = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)');

  const productData = [
    // Non
    {
      name: 'Xiva Tandir Patiri (Issiq va Xushbo‘y)',
      slug: 'xiva-tandir-patiri-issiq',
      desc: 'Xivaning qadimiy an’anaviy usulida, loy tandirda pishirilgan serqaymoq va kunjutli issiq non.',
      short: 'Tandirda yangi pishirilgan an’anaviy Xiva patiri',
      cat: catMap['non-va-non-mahsulotlari'],
      brand: null,
      sku: 'NON-XIV-001',
      barcode: '4780001001011',
      price: 6000,
      prev: 7500,
      stock: 45,
      low: 5,
      unit: 'dona',
      weight: '400 g',
      tags: 'non, xiva patir, tandir, xleb, bread',
      spec: [{ key: 'Pishirish usuli', value: 'Loy tandir' }, { key: 'Tarkibi', value: 'Oliy nav un, sut, sedana, kunjut' }],
      feat: 1, pop: 1, isNew: 0, best: 1, min: 1, max: 20,
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop'
    },
    // Ichimliklar (Search 'cola')
    {
      name: 'Coca-Cola Classic 1.5 L (Salqin Ichimlik)',
      slug: 'coca-cola-classic-1-5l',
      desc: 'Dunyoda mashhur klassik ta’mga ega, tetiklantiruvchi gazlangan alkogolsiz salqin ichimlik.',
      short: 'Original Coca-Cola 1.5 litr',
      cat: catMap['ichimliklar'],
      brand: bCocaCola,
      sku: 'DRK-COCA-15L',
      barcode: '5449000000996',
      price: 14500,
      prev: 16500,
      stock: 80,
      low: 10,
      unit: 'dona',
      weight: '1.5 litr',
      tags: 'cola, coca-cola, gazli, ichimlik, drink, soda',
      spec: [{ key: 'Hajmi', value: '1.5 L' }, { key: 'Turi', value: 'Gazlangan ichimlik' }],
      feat: 1, pop: 1, isNew: 0, best: 1, min: 1, max: 30,
      img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop'
    },
    {
      name: 'Pepsi Cola 1.5 L Tetiklantiruvchi Gazli Ichimlik',
      slug: 'pepsi-cola-1-5l',
      desc: 'Yoqimli va mashhur ta’mli original Pepsi ichimligi. Muzdek holda iste’mol qilish tavsiya etiladi.',
      short: 'Original Pepsi Cola 1.5L',
      cat: catMap['ichimliklar'],
      brand: bPepsi,
      sku: 'DRK-PEPSI-15L',
      barcode: '4780010001022',
      price: 13500,
      prev: 15500,
      stock: 55,
      low: 10,
      unit: 'dona',
      weight: '1.5 litr',
      tags: 'pepsi, cola, gazli, ichimlik, soda',
      spec: [{ key: 'Hajmi', value: '1.5 L' }],
      feat: 0, pop: 1, isNew: 0, best: 1, min: 1, max: 30,
      img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop'
    },
    // Sut mahsulotlari
    {
      name: 'Musaffo 3.2% Pasterizatsiyalangan Tabiiy Sut 1 L',
      slug: 'musaffo-sut-3-2-litr',
      desc: 'Tabiiy sog‘lom sigir suti. Qaynatish shart emas, barcha oziq moddalari saqlangan.',
      short: 'Tabiiy pasterizatsiyalangan sut 3.2%',
      cat: catMap['sut-mahsulotlari'],
      brand: bMusaffo,
      sku: 'SUT-MUS-1L',
      barcode: '4780003003033',
      price: 13000,
      prev: 15000,
      stock: 35,
      low: 5,
      unit: 'dona',
      weight: '1 litr',
      tags: 'sut, musaffo, milk, moloko, dairy',
      spec: [{ key: 'Yog‘lilik', value: '3.2%' }, { key: 'Qadoq', value: 'TetraPak 1L' }],
      feat: 1, pop: 1, isNew: 0, best: 1, min: 1, max: 20,
      img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop'
    },
    {
      name: 'Xorazm Yangi Qaymog‘i (Tabiiy Qo‘l Qaymoq)',
      slug: 'xorazm-yangi-qaymogi-tabiiy',
      desc: 'Mahalliy dehqonlardan yangi olingan quyuq va xushbo‘y tabiiy qaymoq. Nonushta uchun eng a’lo tanlov.',
      short: 'Haqiqiy quyuq qishloq qaymog‘i',
      cat: catMap['sut-mahsulotlari'],
      brand: null,
      sku: 'SUT-QYM-500',
      barcode: '4780004004044',
      price: 28000,
      prev: 35000,
      stock: 12,
      low: 4,
      unit: 'qadoq',
      weight: '500 g',
      tags: 'qaymoq, sut, slivki, krem, nonushta',
      spec: [{ key: 'Og‘irligi', value: '500 g' }, { key: 'Saqlash muddati', value: '5 kun (+2...+6°C)' }],
      feat: 1, pop: 1, isNew: 1, best: 1, min: 1, max: 10,
      img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800&auto=format&fit=crop'
    },
    // Go‘sht mahsulotlari (Low stock test product with 4 left)
    {
      name: 'Yangi So‘yilgan Yosh Mol Go‘shti (Loshka / Halol)',
      slug: 'yangi-soyorgan-mol-goshti-loshka',
      desc: 'Kundalik yangi kuryer orqali keladigan suyaksiz toza lahm go‘sht. 100% Halol so‘yilgan.',
      short: 'Suyaksiz saralangan toza mol go‘shti (Lahm)',
      cat: catMap['gosht-mahsulotlari'],
      brand: null,
      sku: 'GST-MOL-1KG',
      barcode: '4780005005055',
      price: 98000,
      prev: 115000,
      stock: 4, // Trigger low stock "Kam qoldi"
      low: 5,
      unit: 'kg',
      weight: '1 kg',
      tags: 'gosht, mol goshti, lahm, halol, myaso, beef',
      spec: [{ key: 'Holati', value: 'Muzlatilmagan (Yangi so‘yilgan)' }, { key: 'Kesimi', value: 'Lahm (Suyaksiz)' }],
      feat: 1, pop: 1, isNew: 1, best: 1, min: 1, max: 10,
      img: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&auto=format&fit=crop'
    },
    // Meva va Sabzavotlar
    {
      name: 'Yangi Qizil Pomidor (Issiqxona Oliy Nav)',
      slug: 'yangi-qizil-pomidor-issiqxona',
      desc: 'Sersuv, qizil va xushbo‘y mahalliy saralangan pomidorlar. Salat va taomlar uchun ideal.',
      short: 'Saralangan sersuv pomidor',
      cat: catMap['meva-va-sabzavotlar'],
      brand: null,
      sku: 'VEG-TOM-1KG',
      barcode: '4780006006066',
      price: 18000,
      prev: 22000,
      stock: 60,
      low: 10,
      unit: 'kg',
      weight: '1 kg',
      tags: 'pomidor, sabzavot, meva, tomato, pomidori',
      spec: [{ key: 'Navi', value: 'Pushti / Qizil Oliy nav' }],
      feat: 0, pop: 1, isNew: 0, best: 1, min: 1, max: 20,
      img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop'
    },
    {
      name: 'Ekvador Shirin Sariq Banani',
      slug: 'ekvador-shirin-sariq-banani',
      desc: 'Pishgan, vitaminlarga boy shirin saralangan sifatli bananlar.',
      short: 'Sifatli pishgan sariq banan',
      cat: catMap['meva-va-sabzavotlar'],
      brand: null,
      sku: 'FRT-BAN-1KG',
      barcode: '4780007007077',
      price: 24000,
      prev: 28000,
      stock: 40,
      low: 8,
      unit: 'kg',
      weight: '1 kg',
      tags: 'banan, meva, banana, shirin',
      spec: [{ key: 'Kelib chiqishi', value: 'Ekvador' }],
      feat: 1, pop: 1, isNew: 0, best: 0, min: 1, max: 15,
      img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop'
    },
    // Oziq-ovqat
    {
      name: 'Makfa Oliy Nav Bug‘doy Uni 2 kg',
      slug: 'makfa-oliy-nav-bugdoy-uni-2kg',
      desc: 'Oliy sifatli qor va oppoq non, somsa va pishiriqlar uchun eng yaxshi bug‘doy uni.',
      short: 'Makfa oliy navli bug‘doy uni 2 kg',
      cat: catMap['oziq-ovqat'],
      brand: bMakfa,
      sku: 'OZIQ-MKF-2KG',
      barcode: '4601234567890',
      price: 21000,
      prev: 25000,
      stock: 45,
      low: 5,
      unit: 'qadoq',
      weight: '2 kg',
      tags: 'un, makfa, bugdoy, muka, flour, oziq-ovqat',
      spec: [{ key: 'Navi', value: 'Oliy nav (Vysshiy sort)' }, { key: 'Vazni', value: '2 kg' }],
      feat: 0, pop: 1, isNew: 0, best: 1, min: 1, max: 10,
      img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop'
    },
    {
      name: 'Barilla Spaghetti No. 5 Qattiq Bug‘doy Makaroni 500 g',
      slug: 'barilla-spaghetti-no5-500g',
      desc: 'Haqiqiy italiyan spagettisi, qattiq bug‘doy navlaridan tayyorlangan, ezilib ketmaydi.',
      short: 'Original Barilla italyan spagetti',
      cat: catMap['oziq-ovqat'],
      brand: bBarilla,
      sku: 'OZIQ-BAR-500G',
      barcode: '8076809513753',
      price: 22000,
      prev: 27000,
      stock: 3, // Low stock test
      low: 5,
      unit: 'qadoq',
      weight: '500 g',
      tags: 'makaron, pasta, spaghetti, barilla, italy',
      spec: [{ key: 'Pishish vaqti', value: '8-9 daqiqa' }, { key: 'Mamlakat', value: 'Italiya' }],
      feat: 1, pop: 0, isNew: 0, best: 0, min: 1, max: 15,
      img: 'https://images.unsplash.com/photo-1621996346565-e3d5d62816f1?w=800&auto=format&fit=crop'
    },
    // Choy va Qahva
    {
      name: 'Ahmad Tea Ceylon Tea Klassik Qora Choy 100 g',
      slug: 'ahmad-tea-ceylon-100g',
      desc: 'Saralangan Seylon bargli qora choyi, to‘yingan rangi va xushbo‘y ta’mi bilan ajralib turadi.',
      short: 'Ahmad Tea sifatli qora bargli choy',
      cat: catMap['choy-va-qahva'],
      brand: bAhmadTea,
      sku: 'TEA-AHM-100G',
      barcode: '054881001015',
      price: 26000,
      prev: 31000,
      stock: 50,
      low: 5,
      unit: 'qadoq',
      weight: '100 g',
      tags: 'choy, qora choy, ahmad tea, tea, chay',
      spec: [{ key: 'Turi', value: 'Bargli qora choy (FBOP)' }],
      feat: 0, pop: 1, isNew: 0, best: 1, min: 1, max: 20,
      img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop'
    },
    {
      name: 'Lavazza Qualità Oro Donador Qahvasi 1 kg',
      slug: 'lavazza-qualita-oro-donador-1kg',
      desc: '100% Arabica, Italiyada o‘rta qovurilgan premium donador qahva.',
      short: 'Italiya 100% Arabica donador qahvasi',
      cat: catMap['choy-va-qahva'],
      brand: bLavazza,
      sku: 'COF-LAV-1KG',
      barcode: '8000070014022',
      price: 215000,
      prev: 265000,
      stock: 18,
      low: 4,
      unit: 'dona',
      weight: '1 kg',
      tags: 'qahva, kofe, lavazza, arabica, coffee',
      spec: [{ key: 'Qovurilish', value: 'O‘rta (Medium)' }, { key: 'Don', value: '100% Arabica' }],
      feat: 1, pop: 1, isNew: 0, best: 1, min: 1, max: 5,
      img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop'
    },
    // Shirinliklar
    {
      name: 'Nestlé KitKat 4 Fingers Shokoladli Vafli 41.5 g',
      slug: 'nestle-kitkat-4-fingers',
      desc: 'Qarsildoq vafli va nozik sutli shokolad kombinatsiyasi. Tanaffus qiling — KitKat yeng!',
      short: 'Sutli shokolad bilan qoplangan KitKat',
      cat: catMap['shirinliklar'],
      brand: bNestle,
      sku: 'SHIR-KIT-41G',
      barcode: '7613035341258',
      price: 7500,
      prev: 9000,
      stock: 90,
      low: 15,
      unit: 'dona',
      weight: '41.5 g',
      tags: 'shokolad, kitkat, vafli, nestle, chocolate, shirinlik',
      spec: [{ key: 'Turi', value: 'Sutli shokolad va vafli' }],
      feat: 0, pop: 1, isNew: 0, best: 1, min: 1, max: 50,
      img: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=800&auto=format&fit=crop'
    },
    // Maishiy kimyo
    {
      name: 'Fairy Quyuq Idish Yuvish Geli Limon 450 ml',
      slug: 'fairy-limon-450ml',
      desc: 'Muzdek suvda ham yog‘larni soniyalarda erituvchi qudratli idish yuvish vositasi.',
      short: 'Fairy idish yuvish vositasi limonli 450 ml',
      cat: catMap['maishiy-kimyo'],
      brand: null,
      sku: 'KIM-FRY-450ML',
      barcode: '5413149952011',
      price: 19500,
      prev: 23000,
      stock: 45,
      low: 5,
      unit: 'dona',
      weight: '450 ml',
      tags: 'fairy, tozalash, idish, maishiy kimyo, tozalik',
      spec: [{ key: 'Hajmi', value: '450 ml' }],
      feat: 0, pop: 1, isNew: 0, best: 1, min: 1, max: 20,
      img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop'
    }
  ];

  for (const p of productData) {
    const res = prodStmt.run(
      p.name,
      p.slug,
      p.desc,
      p.short,
      p.cat,
      p.brand,
      p.sku,
      p.barcode,
      p.price,
      p.prev,
      p.stock,
      p.low,
      p.unit,
      p.weight,
      '10x10x10 sm',
      p.tags,
      JSON.stringify(p.spec),
      p.feat,
      p.pop,
      p.isNew,
      p.best,
      p.min,
      p.max
    );
    const pid = res.lastInsertRowid;
    imgStmt.run(pid, p.img, 0, 1);
  }

  // 7. Active Coupons
  const couponStmt = db.prepare(`
    INSERT INTO coupons (
      code, discount_type, discount_value, min_order_amount, max_discount_amount,
      max_uses, current_uses, per_user_limit, expires_at, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  couponStmt.run('WELCOME10', 'percentage', 10, 50000, 30000, 500, 0, 1, '2026-12-31 23:59:59');
  couponStmt.run('KHIVA20', 'fixed', 20000, 100000, 20000, 200, 0, 1, '2026-12-31 23:59:59');
  couponStmt.run('GASTRONOM', 'percentage', 15, 80000, 40000, 1000, 0, 2, '2026-12-31 23:59:59');

  // 8. Banners
  const bannerStmt = db.prepare(`
    INSERT INTO banners (title, subtitle, image_url, link_url, badge_text, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  bannerStmt.run(
    'Gastronom — Xivadagi sevimli do‘koningiz, endi uyingizgacha.',
    '24/7 kechayu-kunduz eng sifatli mahsulotlar 30 daqiqada uyingizda!',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop',
    '/products',
    'Xiva 24/7 Express',
    1
  );

  bannerStmt.run(
    'Yangi Go‘sht va Tandir Patirlariga -20% Gacha Chegirmalar',
    'Halol sertifikatlangan yangi mol go‘shti va issiq tandir nonlari',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&auto=format&fit=crop',
    '/discounts',
    'Qaynoq Chegirmalar',
    2
  );

  console.log('>>> [SUCCESS] Complete Gastronom Khiva 24/7 database seeded successfully!');
});

seedTx();
