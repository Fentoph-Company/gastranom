import bcrypt from 'bcryptjs';
import db from './connection.js';
import { initializeSchema } from './schema.js';

console.log('Seeding database with realistic commercial Gastronom Khiva data...');

initializeSchema();

const seedTx = db.transaction(() => {
  // Clear existing data to ensure clean seed
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
    DELETE FROM otps;
    DELETE FROM sqlite_sequence;
  `);

  // 1. Settings (Khiva, Mustaqillik Street 17, 24/7)
  const settingsStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const defaultSettings = {
    store_name: 'Gastronom',
    store_tagline: 'Gastronom — Xivadagi sevimli do‘koningiz, endi uyingizgacha.',
    contact_phone: '+998 (91) 420-17-17',
    contact_email: 'info@gastronom.uz',
    currency: 'UZS',
    store_address: 'Mustaqillik ko‘chasi, 17, Xiva, Xorazm viloyati',
    store_city: 'Xiva',
    store_region: 'Xorazm viloyati',
    store_coordinates: {
      lat: 41.3783,
      lng: 60.3639,
      address: 'Mustaqillik ko‘chasi, 17, Xiva'
    },
    maps_url: 'https://yandex.uz/maps/?pt=60.3639,41.3783&z=17&l=map',
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=41.3783,60.3639',
    working_hours: '24/7 (Kechayu-kunduz)',
    free_delivery_threshold: 200000,
    low_stock_global_threshold: 5,
    social_links: {
      telegram: 'https://t.me/gastronom_khiva',
      instagram: 'https://instagram.com/gastronom_khiva',
      facebook: 'https://facebook.com/gastronom_khiva'
    },
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_enabled: 1,
    online_payment_configured: 0,
    faq: [
      { q: 'Qanday to‘lov turlari mavjud?', a: 'Yetkazib berilganda naqd pul va so‘m kartalari orqali to‘lashingiz mumkin. Onlayn to‘lov tizimlari tez kunda ishga tushiriladi.' },
      { q: 'Yetkazib berish qancha vaqt oladi?', a: 'Xiva shahri bo‘ylab 20-30 daqiqa ichida tez va ishonchli yetkazib beramiz.' },
      { q: 'Do‘kondan o‘zim olib ketsam bo‘ladimi?', a: 'Albatta! Mustaqillik ko‘chasi 17-uy manzilimizdan 24/7 istalgan vaqtda bepul olib ketishingiz mumkin.' }
    ]
  };

  for (const [key, val] of Object.entries(defaultSettings)) {
    settingsStmt.run(key, JSON.stringify(val));
  }

  // 2. Users (Super Admin, Manager, Operator, Warehouse, Delivery, Customer)
  const passwordHash = bcrypt.hashSync('adminpassword123', 10);
  const custPasswordHash = bcrypt.hashSync('customerpassword123', 10);
  const staffPasswordHash = bcrypt.hashSync('staffpassword123', 10);

  const adminResult = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, 'superadmin', 'active')
  `).run('Bosh Administrator', 'admin@gastranom.uz', passwordHash, '+998901234567');
  const adminId = adminResult.lastInsertRowid;

  db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, 'manager', 'active')
  `).run('Sherzod Menejer', 'manager@gastranom.uz', staffPasswordHash, '+998901112233');

  db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, 'operator', 'active')
  `).run('Dilnoza Operator', 'operator@gastranom.uz', staffPasswordHash, '+998902223344');

  db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, 'warehouse', 'active')
  `).run('Mansur Omborchi', 'warehouse@gastranom.uz', staffPasswordHash, '+998903334455');

  const courierResult = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, 'delivery', 'active')
  `).run('Bekzod Kuryer', 'kuryer@gastranom.uz', staffPasswordHash, '+998904445566');
  const courierId = courierResult.lastInsertRowid;

  const customerResult = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, role, status)
    VALUES (?, ?, ?, ?, 'customer', 'active')
  `).run('Jasur Alimov', 'jasur@example.uz', custPasswordHash, '+998971112233');
  const customerId = customerResult.lastInsertRowid;

  // Saved Customer Addresses
  db.prepare(`
    INSERT INTO addresses (user_id, title, recipient_name, phone, region, city, street, house, is_default)
    VALUES (?, 'Uy (Bosh manzil)', 'Jasur Alimov', '+998971112233', 'Xorazm viloyati', 'Xiva shahri', 'Mustaqillik ko‘chasi', '24-uy', 1)
  `).run(customerId);

  db.prepare(`
    INSERT INTO addresses (user_id, title, recipient_name, phone, region, city, street, house, is_default)
    VALUES (?, 'Ishxona', 'Jasur Alimov', '+998971112233', 'Xorazm viloyati', 'Xiva shahri', 'Amir Temur ko‘chasi', '8-bino', 0)
  `).run(customerId);

  // 3. Delivery Zones for Khiva
  const zonesStmt = db.prepare(`
    INSERT INTO delivery_zones (name, region, price, free_threshold, estimated_time, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const z1 = zonesStmt.run('Xiva markazi (0–2 km)', 'Xorazm viloyati', 10000, 150000, '20-30 daqiqa', 1).lastInsertRowid;
  const z2 = zonesStmt.run('Xiva shahri hududi (2–5 km)', 'Xorazm viloyati', 15000, 200000, '30-45 daqiqa', 1).lastInsertRowid;
  const z3 = zonesStmt.run('Xiva shahar atrofi (5–10 km)', 'Xorazm viloyati', 20000, 250000, '45-60 daqiqa', 1).lastInsertRowid;

  // 4. Exactly 15 Categories as requested
  const catStmt = db.prepare(`
    INSERT INTO categories (name, slug, description, image_url, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const cBakery = catStmt.run('Non va non mahsulotlari', 'non-va-non-mahsulotlari', 'Issiq tandir nonlari, patir, bulyochkalar va lavashlar', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop', 1).lastInsertRowid;
  const cDairy = catStmt.run('Sut mahsulotlari', 'sut-mahsulotlari', 'Tabiiy sut, qatiq, qaymoq, sariyog‘, pishloq va tvorog', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop', 2).lastInsertRowid;
  const cMeat = catStmt.run('Go‘sht mahsulotlari', 'gosht-mahsulotlari', 'Yangi halol mol go‘shti, qo‘y go‘shti, tovuq go‘shti va qiyma', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop', 3).lastInsertRowid;
  const cSausage = catStmt.run('Kolbasa va yarim tayyor mahsulotlar', 'kolbasa-va-yarim-tayyor', 'Halol dudlangan kolbasalar, sosiskalar, chuchvara va kotletlar', 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600&auto=format&fit=crop', 4).lastInsertRowid;
  const cDrinks = catStmt.run('Ichimliklar', 'ichimliklar', 'Coca-Cola, Pepsi, sharbatlar, mineral suvlar va yaxna choylar', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop', 5).lastInsertRowid;
  const cSweets = catStmt.run('Shirinliklar', 'shirinliklar', 'Shokoladlar, pechenyelar, konfetlar, tortlar va vafli', 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=600&auto=format&fit=crop', 6).lastInsertRowid;
  const cProduce = catStmt.run('Meva va sabzavotlar', 'mevalar-va-sabzavotlar', 'Toza mahalliy va chet el saralangan mevalari va yangi sabzavotlar', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&auto=format&fit=crop', 7).lastInsertRowid;
  const cGrocery = catStmt.run('Oziq-ovqat', 'oziq-ovqat', 'Guruch, un, shakar, makaronlar, o‘simlik moyi va ziravorlar', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop', 8).lastInsertRowid;
  const cHygiene = catStmt.run('Gigiyena', 'gigiyena', 'Shampunlar, sovunlar, tish pastalari va shaxsiy gigiyena vositalari', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop', 9).lastInsertRowid;
  const cHousehold = catStmt.run('Maishiy kimyo', 'maishiy-kimyo', 'Kir yuvish kukunlari, tozalash va idish yuvish vositalari', 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop', 10).lastInsertRowid;
  const cBaby = catStmt.run('Bolalar mahsulotlari', 'bolalar-mahsulotlari', 'Tagliklar, bolalar pyuresi, bo‘tqalari va bolalar sovunlari', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop', 11).lastInsertRowid;
  const cCanned = catStmt.run('Konservalar', 'konservalar', 'Konservalangan no‘xat, makkajo‘xori, zaytun va tushonka', 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=600&auto=format&fit=crop', 12).lastInsertRowid;
  const cTeaCoffee = catStmt.run('Choy va qahva', 'choy-va-qahva', 'Qora va ko‘k choylar, donador va eruvchan sifatli qahvalar', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop', 13).lastInsertRowid;
  const cFrozen = catStmt.run('Muzlatilgan mahsulotlar', 'muzlatilgan-mahsulotlar', 'Muzlatilgan mevalar, sabzavotlar, qisqichbaqa va yarim fabrikatlar', 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&auto=format&fit=crop', 14).lastInsertRowid;
  const cOther = catStmt.run('Boshqa', 'boshqa', 'Uy-ro‘zg‘or buyumlari, batareykalar va mayda xo‘jalik anjomlari', 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop', 15).lastInsertRowid;

  // 5. Brands
  const brandStmt = db.prepare('INSERT INTO brands (name, slug, logo_url) VALUES (?, ?, ?)');
  const bCocaCola = brandStmt.run('Coca-Cola', 'coca-cola', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100').lastInsertRowid;
  const bPepsi = brandStmt.run('Pepsi', 'pepsi', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=100').lastInsertRowid;
  const bMusaffo = brandStmt.run('Musaffo', 'musaffo', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100').lastInsertRowid;
  const bRozmetov = brandStmt.run('Rozmetov', 'rozmetov', 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=100').lastInsertRowid;
  const bNestle = brandStmt.run('Nestlé', 'nestle', 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=100').lastInsertRowid;
  const bPresident = brandStmt.run('Président', 'president', 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=100').lastInsertRowid;
  const bBarilla = brandStmt.run('Barilla', 'barilla', 'https://images.unsplash.com/photo-1621996346565-e3d5d62816f1?w=100').lastInsertRowid;
  const bDilmah = brandStmt.run('Dilmah', 'dilmah', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=100').lastInsertRowid;
  const bLavazza = brandStmt.run('Lavazza', 'lavazza', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=100').lastInsertRowid;
  const bChortoq = brandStmt.run('Chortoq', 'chortoq', 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=100').lastInsertRowid;
  const bAriel = brandStmt.run('Ariel', 'ariel', 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=100').lastInsertRowid;
  const bPampers = brandStmt.run('Pampers', 'pampers', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=100').lastInsertRowid;
  const bBonduelle = brandStmt.run('Bonduelle', 'bonduelle', 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=100').lastInsertRowid;

  // 6. Products across all 15 categories with units & clear discounts
  const prodStmt = db.prepare(`
    INSERT INTO products (
      name, slug, description, short_description, category_id, brand_id, sku, barcode,
      price, previous_price, stock_quantity, unit, low_stock_threshold, min_order_quantity, max_order_quantity,
      status, weight, dimensions, tags, specifications, is_featured, is_popular, is_new, is_bestseller
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const imgStmt = db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)');
  const varStmt = db.prepare('INSERT INTO product_variants (product_id, title, sku, price, stock_quantity, attributes) VALUES (?, ?, ?, ?, ?, ?)');

  // Product 1: Coca-Cola Classic 1.5L (Beverages)
  const p1 = prodStmt.run(
    'Coca-Cola Classic Gazlangan Ichimlik 1.5 L',
    'coca-cola-classic-1-5l',
    'Klassik tetiklantiruvchi Coca-Cola gazlangan salqin ichimligi. Xivada eng xaridorgir ichimlik.',
    'Klassik Coca-Cola gazlangan ichimlik 1.5 litr',
    cDrinks, bCocaCola, 'COLA-CLS-15L', '5449000000996',
    14500, 16000, 85, 'litr', 10, 1, 30,
    '1.5 L', '9x9x32 sm', 'cola, coca cola, ichimlik, gazli, kola, кока кола, напиток',
    JSON.stringify([{ key: 'Hajmi', value: '1.5 litr' }, { key: 'Turi', value: 'Gazlangan' }]),
    1, 1, 0, 1
  ).lastInsertRowid;
  imgStmt.run(p1, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop', 0, 1);
  imgStmt.run(p1, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&auto=format&fit=crop', 1, 0);

  // Product 2: Coca-Cola Classic 1L (Beverages) - specifically mentioned in prompt example!
  const p2 = prodStmt.run(
    'Coca-Cola Classic Gazlangan Ichimlik 1 L',
    'coca-cola-1l',
    'Muzdek va mazali original Coca-Cola 1 litr qadoqda.',
    'Original Coca-Cola 1 L',
    cDrinks, bCocaCola, 'COLA-CLS-10L', '5449000000453',
    11500, 13000, 60, 'litr', 10, 1, 24,
    '1 L', '8x8x28 sm', 'cola, coca cola, cola 1l, ichimlik, kola, кока кола',
    JSON.stringify([{ key: 'Hajmi', value: '1 litr' }]),
    1, 1, 0, 1
  ).lastInsertRowid;
  imgStmt.run(p2, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800&auto=format&fit=crop', 0, 1);

  // Product 3: Pepsi Cola 1.5L (Beverages) - specifically mentioned in prompt search example!
  const p3 = prodStmt.run(
    'Pepsi Cola Gazlangan Ichimlik 1.5 L',
    'pepsi-cola-1-5l',
    'O‘ziga xos ta’mga ega original Pepsi Cola ichimligi.',
    'Original Pepsi Cola 1.5 L',
    cDrinks, bPepsi, 'PEPSI-15L', '4607065000123',
    13900, 15500, 50, 'litr', 8, 1, 30,
    '1.5 L', '9x9x32 sm', 'cola, pepsi, pepsi cola, ichimlik, пепси кола',
    JSON.stringify([{ key: 'Hajmi', value: '1.5 litr' }]),
    0, 1, 0, 1
  ).lastInsertRowid;
  imgStmt.run(p3, 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop', 0, 1);

  // Product 4: Coca-Cola 2L (Beverages) - specifically mentioned in prompt search example!
  const p4 = prodStmt.run(
    'Coca-Cola Gazlangan Ichimlik 2 L',
    'cola-2l',
    'Katta oilaviy dasturxonlar uchun Coca-Cola 2 litr.',
    'Coca-Cola 2 litr oilaviy qadoq',
    cDrinks, bCocaCola, 'COLA-CLS-20L', '5449000000880',
    17500, 19500, 40, 'litr', 5, 1, 20,
    '2 L', '10x10x35 sm', 'cola, cola 2l, coca cola, ichimlik, kola 2 litr',
    JSON.stringify([{ key: 'Hajmi', value: '2 litr' }]),
    0, 1, 0, 0
  ).lastInsertRowid;
  imgStmt.run(p4, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop', 0, 1);

  // Product 5: Non va non mahsulotlari (Issiq Tandir Noni)
  const p5 = prodStmt.run(
    'Xiva Tandir Noni (Issiq va Qarsildoq)',
    'xiva-tandir-noni',
    'Har tong Xiva an’anaviy tandirida yangi yopilgan xushbo‘y, shirin sedana sepilgan non.',
    'Har kuni yangi issiq tandir noni',
    cBakery, null, 'NON-TND-01', '4780001000012',
    5000, 6000, 120, 'dona', 15, 1, 50,
    '450 g', '25x25x4 sm', 'non, tandir non, issiq non, xleb, bread, хлеб, лепешка',
    JSON.stringify([{ key: 'Tayyorlanishi', value: 'An’anaviy tandirda' }, { key: 'Xususiyati', value: 'Sedana va kunjutli' }]),
    1, 1, 1, 1
  ).lastInsertRowid;
  imgStmt.run(p5, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop', 0, 1);

  // Product 6: Sut mahsulotlari (Musaffo Sut 3.2%)
  const p6 = prodStmt.run(
    'Musaffo 3.2% Tabiiy Pasterizatsiyalangan Sut 1 L',
    'musaffo-sut-3-2',
    'Toza va tabiiy, 3.2% yog‘lilikdagi pasterizatsiyalangan mahalliy fermer suti.',
    'Tabiiy pasterizatsiyalangan sut 1 L',
    cDairy, bMusaffo, 'MSF-MILK-1L', '4780012345019',
    11900, 14000, 45, 'litr', 8, 1, 24,
    '1 L', '7x7x22 sm', 'sut, sut mahsulotlari, musaffo, sut 3.2, moloko, milk, молоко',
    JSON.stringify([{ key: 'Yog‘lilik', value: '3.2%' }, { key: 'Hajmi', value: '1 litr' }]),
    1, 1, 0, 1
  ).lastInsertRowid;
  imgStmt.run(p6, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop', 0, 1);

  // Product 7: Go‘sht mahsulotlari (Yosh Mol Go‘shti Lahm)
  const p7 = prodStmt.run(
    'Yangi Halol Mol Go‘shti Lahm (Suyaksiz)',
    'mol-goshti-lahm',
    'Har kuni yangi so‘yilgan mahalliy sifatli buzoq go‘shtining yumshoq suyaksiz qismi.',
    'Halol yangi buzoq go‘shti lahm 1 kg',
    cMeat, null, 'MEAT-BEEF-1KG', '4780005550011',
    95000, 110000, 25, 'kg', 5, 1, 10,
    '1 kg', '25x20x6 sm', 'gosht, mol goshti, lahm, halol, myaso, beef, мясо',
    JSON.stringify([{ key: 'Go‘sht turi', value: 'Buzoq go‘shti (Lahm)' }, { key: 'Halol', value: 'Ha (100% Halol)' }]),
    1, 1, 0, 1
  ).lastInsertRowid;
  imgStmt.run(p7, 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&auto=format&fit=crop', 0, 1);

  // Product 8: Kolbasa va yarim tayyor (Rozmetov Dudlangan Kolbasa)
  const p8 = prodStmt.run(
    'Rozmetov Halol Dudlangan Servelat Kolbasi 500 g',
    'rozmetov-servelat-kolbasa',
    'Klassik retsept bo‘yicha dudlangan yuqori sifatli halol go‘shtdan tayyorlangan kolbasa.',
    'Rozmetov Halol Servelat 500 g',
    cSausage, bRozmetov, 'RZM-SRV-500', '4780023456789',
    42000, 48000, 30, 'dona', 5, 1, 20,
    '500 g', '6x6x22 sm', 'kolbasa, rozmetov, servelat, halol, kolbasa va yarim tayyor, колбаса',
    JSON.stringify([{ key: 'Sertifikat', value: 'Halol' }, { key: 'Vazni', value: '500 g' }]),
    1, 1, 0, 0
  ).lastInsertRowid;
  imgStmt.run(p8, 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop', 0, 1);

  // Product 9: Shirinliklar (Nestle Shokolad Plitkasi)
  const p9 = prodStmt.run(
    'Nestlé Classic Sutli Shokolad Plitkasi 90 g',
    'nestle-classic-sutli-shokolad',
    'Yumshoq alp suti bilan boyitilgan klassik shirinlik.',
    'Nestlé sutli nozik shokolad 90 g',
    cSweets, bNestle, 'NST-CHOC-90', '7613035987123',
    12500, 15000, 55, 'dona', 10, 1, 40,
    '90 g', '15x7x1 sm', 'shirinlik, shokolad, nestle, konfet, sladosti, chocolate, шоколад',
    JSON.stringify([{ key: 'Turi', value: 'Sutli shokolad' }]),
    0, 1, 1, 0
  ).lastInsertRowid;
  imgStmt.run(p9, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop', 0, 1);

  // Product 10: Meva va sabzavotlar (Xorazm Yangi Qovuni / Banan)
  const p10 = prodStmt.run(
    'Ekvador Saralangan Yangi Banan (1 kg)',
    'saralangan-yangi-banan',
    'Shirin, yetilgan va vitaminlarga boy sariq bananlar.',
    'Shirin va yangi saralangan banan 1 kg',
    cProduce, null, 'FRT-BAN-1KG', '2000000000101',
    19900, 25000, 60, 'kg', 10, 1, 20,
    '1 kg', '20x15x15 sm', 'meva, banan, banan 1kg, meva va sabzavotlar, frukti, banana, фрукты, бананы',
    JSON.stringify([{ key: 'Kelib chiqishi', value: 'Ekvador' }]),
    1, 1, 1, 1
  ).lastInsertRowid;
  imgStmt.run(p10, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop', 0, 1);

  // Product 11: Oziq-ovqat (Barilla Makaroni)
  const p11 = prodStmt.run(
    'Barilla Spaghetti No. 5 Qattiq Bug‘doy Makaroni 500 g',
    'barilla-spaghetti-n5',
    'Italiyaning original qattiq bug‘doy navidan tayyorlangan mashhur spagettisi.',
    'Original Barilla Spagetti 500 g',
    cGrocery, bBarilla, 'BAR-SPAG-500', '8076809513753',
    24000, 29000, 48, 'qadoq', 8, 1, 25,
    '500 g', '5x5x30 sm', 'makaron, barilla, spagetti, oziq-ovqat, pasta, макароны',
    JSON.stringify([{ key: 'Ishlab chiqaruvchi', value: 'Italiya' }, { key: 'Vazni', value: '500 g' }]),
    1, 0, 0, 1
  ).lastInsertRowid;
  imgStmt.run(p11, 'https://images.unsplash.com/photo-1621996346565-e3d5d62816f1?w=800&auto=format&fit=crop', 0, 1);

  // Product 12: Choy va qahva (Lavazza Qualità Oro Donador Qahva)
  const p12 = prodStmt.run(
    'Lavazza Qualità Oro Donador Qahvasi 100% Arabica 1 kg',
    'lavazza-qualita-oro-coffee',
    'Haqiqiy Italiya donador qahvasi. Gulli va mevali nozik notalarga boy 100% Arabica.',
    'Italiya 100% Arabica donador qahva 1 kg',
    cTeaCoffee, bLavazza, 'LAV-ORO-100', '8000070014527',
    210000, 260000, 22, 'kg', 4, 1, 10,
    '1 kg', '12x8x25 sm', 'qahva, kofe, lavazza, arabica, choy va qahva, coffee, кофе',
    JSON.stringify([{ key: 'Tarkibi', value: '100% Arabica' }, { key: 'Qovurilish', value: 'O‘rta' }]),
    1, 1, 0, 1
  ).lastInsertRowid;
  imgStmt.run(p12, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop', 0, 1);
  varStmt.run(p12, '250 g', 'LAV-ORO-250', 75000, 15, JSON.stringify({ "Og'irligi": '250 g' }));
  varStmt.run(p12, '1 kg', 'LAV-ORO-1000', 210000, 7, JSON.stringify({ "Og'irligi": '1 kg' }));

  // Product 13: Choy va qahva (Dilmah Qora Choy)
  const p13 = prodStmt.run(
    'Dilmah Premium Ceylon Qora Choyi 100 ta paketcha',
    'dilmah-premium-ceylon-tea',
    'Seylon tog‘laridan terilgan toza va xushbo‘y tabiiy qora choy.',
    'Dilmah Seylon qora choy 100 paket',
    cTeaCoffee, bDilmah, 'DLM-TEA-100', '9312631123456',
    34000, 39000, 35, 'qadoq', 6, 1, 20,
    '200 g', '18x12x8 sm', 'choy, qora choy, dilmah, seylon, tea, chay, чай',
    JSON.stringify([{ key: 'Soni', value: '100 paketcha' }]),
    0, 1, 0, 0
  ).lastInsertRowid;
  imgStmt.run(p13, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop', 0, 1);

  // Product 14: Konservalar (Bonduelle Yashil No‘xat)
  const p14 = prodStmt.run(
    'Bonduelle Nozik Yashil No‘xat Konservasi 400 g',
    'bonduelle-yashil-noxat',
    'Salatlar va taomlar uchun yumshoq, shirin saralangan konservalangan yashil no‘xat.',
    'Bonduelle yashil no‘xat 400 g',
    cCanned, bBonduelle, 'BND-PEA-400', '3083680012345',
    16500, 19000, 40, 'dona', 8, 1, 30,
    '400 g', '8x8x11 sm', 'konserva, noxat, bonduelle, konservalar, goroshek, консервы, горошек',
    JSON.stringify([{ key: 'Hajmi', value: '400 g' }]),
    0, 0, 0, 0
  ).lastInsertRowid;
  imgStmt.run(p14, 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=800&auto=format&fit=crop', 0, 1);

  // Product 15: Gigiyena (Shampun)
  const p15 = prodStmt.run(
    'Head & Shoulders Qazg‘oqqa Qarshi Shampun 400 ml',
    'head-shoulders-shampun-400ml',
    'Soch va bosh terisini chuqur tozalovchi qazg‘oqqa qarshi samarali shampun.',
    'Head & Shoulders shampun 400 ml',
    cHygiene, null, 'HNS-SHMP-400', '5000174001234',
    44000, 52000, 28, 'dona', 5, 1, 15,
    '400 ml', '8x5x22 sm', 'gigiyena, shampun, soch, gigiena, shampoo, шампунь',
    JSON.stringify([{ key: 'Hajmi', value: '400 ml' }]),
    0, 0, 1, 0
  ).lastInsertRowid;
  imgStmt.run(p15, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop', 0, 1);

  // Product 16: Maishiy kimyo (Ariel Kir Yuvish Kukuni)
  const p16 = prodStmt.run(
    'Ariel Oq va Rangli Kiyimlar Uchun Kir Yuvish Kukuni 3 kg',
    'ariel-kir-yuvish-kukuni-3kg',
    'Dog‘larni birinchi yuvishdayoq ketkazuvchi kuchli formula.',
    'Ariel kir yuvish kukuni 3 kg',
    cHousehold, bAriel, 'ARL-PWD-3KG', '5410076001234',
    79000, 92000, 20, 'qadoq', 4, 1, 10,
    '3 kg', '22x12x30 sm', 'maishiy kimyo, ariel, poroshok, kir yuvish, порошок',
    JSON.stringify([{ key: 'Vazni', value: '3 kg' }]),
    1, 0, 0, 1
  ).lastInsertRowid;
  imgStmt.run(p16, 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop', 0, 1);

  // Product 17: Bolalar mahsulotlari (Pampers Tagliklari)
  const p17 = prodStmt.run(
    'Pampers Active Baby-Dry Tagliklari 4-o‘lcham (54 dona)',
    'pampers-active-baby-4',
    'Chaqaloq terisini 12 soat davomida quruq saqlovchi yumshoq nafas oluvchi tagliklar.',
    'Pampers tagliklari 4-o‘lcham (54 dona)',
    cBaby, bPampers, 'PMP-ACT-4-54', '8001480012345',
    185000, 215000, 18, 'qadoq', 3, 1, 10,
    '1.8 kg', '30x25x20 sm', 'bolalar mahsulotlari, pampers, taglik, bolalar, podguzniki, подгузники',
    JSON.stringify([{ key: 'O‘lchami', value: '4 (9-14 kg)' }, { key: 'Soni', value: '54 dona' }]),
    1, 0, 1, 0
  ).lastInsertRowid;
  imgStmt.run(p17, 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&auto=format&fit=crop', 0, 1);

  // Product 18: Muzlatilgan mahsulotlar (Halol Muzlatilgan Chuchvara)
  const p18 = prodStmt.run(
    'Halol Yangi Muzlatilgan Qo‘lda Tugilgan Chuchvara 800 g',
    'halol-muzlatilgan-chuchvara',
    'Nozik xamir va tabiiy mol go‘shti qiymasidan tayyorlangan mazali chuchvara.',
    'Qo‘lda tugilgan mol go‘shtli chuchvara 800 g',
    cFrozen, null, 'FRZ-CHCH-800', '4780099887766',
    38000, 45000, 25, 'qadoq', 5, 1, 15,
    '800 g', '20x15x5 sm', 'muzlatilgan, chuchvara, pelmeni, yarim tayyor, пельмени',
    JSON.stringify([{ key: 'Go‘sht', value: 'Halol mol go‘shti' }]),
    0, 1, 0, 0
  ).lastInsertRowid;
  imgStmt.run(p18, 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&auto=format&fit=crop', 0, 1);

  // Product 19: Boshqa (Duracell Batareyka Blok)
  const p19 = prodStmt.run(
    'Duracell Ultra AA Ishqoriy Batareykalar (Blokda 4 dona)',
    'duracell-ultra-aa-4',
    'Uzoq muddat xizmat qiluvchi ishonchli ishqoriy quvvatlagich batareykalar.',
    'Duracell AA batareykalari 4 dona blok',
    cOther, null, 'DUR-AA-4PC', '5000394001234',
    28000, 32000, 40, 'blok', 8, 1, 20,
    '120 g', '10x8x2 sm', 'boshqa, batareyka, duracell, xo‘jalik, батарейки',
    JSON.stringify([{ key: 'Turi', value: 'AA (Barmoq)' }, { key: 'Soni', value: '4 dona' }]),
    0, 0, 0, 0
  ).lastInsertRowid;
  imgStmt.run(p19, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800&auto=format&fit=crop', 0, 1);

  // Product 20: Chortoq Mineral Suv (Beverages)
  const p20 = prodStmt.run(
    'Chortoq Tabiiy Shifobaxsh Mineral Suvi 0.5 L Gazlangan',
    'chortoq-mineral-suvi-05l',
    'Shifobaxsh mineral moddalar va tuzlarga boy milliy mineral suv.',
    'Chortoq shifobaxsh mineral suv 0.5 L',
    cDrinks, bChortoq, 'CRT-MIN-05L', '4780004443322',
    6500, 7500, 70, 'dona', 12, 1, 48,
    '0.5 L', '6x6x20 sm', 'suv, chortoq, mineral suv, ichimlik, gazli suv, mineral water, вода',
    JSON.stringify([{ key: 'Turi', value: 'Davolovchi-oshxona mineral suvi' }]),
    1, 1, 0, 1
  ).lastInsertRowid;
  imgStmt.run(p20, 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=800&auto=format&fit=crop', 0, 1);

  // 7. Active Scheduled Promotions & Discounts
  const discStmt = db.prepare(`
    INSERT INTO discounts (
      title, type, value, start_date, end_date, category_id, brand_id, product_id,
      min_order_amount, banner_url, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  discStmt.run(
    'Salqin Ichimliklar va Cola Chegirmalari',
    'percentage',
    10,
    new Date(Date.now() - 3600000).toISOString(),
    new Date(Date.now() + 86400000 * 14).toISOString(),
    cDrinks,
    null,
    null,
    0,
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=1600&auto=format&fit=crop'
  );

  discStmt.run(
    'Sut Mahsulotlari Haftaligi',
    'percentage',
    15,
    new Date(Date.now() - 3600000).toISOString(),
    new Date(Date.now() + 86400000 * 7).toISOString(),
    cDairy,
    null,
    null,
    0,
    'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=1600&auto=format&fit=crop'
  );

  // 8. Coupons
  const coupStmt = db.prepare(`
    INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, max_uses, per_user_limit, expires_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  coupStmt.run('WELCOME10', 'percentage', 10, 100000, 30000, 1000, 2, new Date(Date.now() + 86400000 * 30).toISOString());
  coupStmt.run('XIVA20', 'fixed', 20000, 150000, 20000, 500, 1, new Date(Date.now() + 86400000 * 14).toISOString());
  coupStmt.run('GASTRONOM50', 'fixed', 50000, 300000, 50000, 200, 1, new Date(Date.now() + 86400000 * 7).toISOString());

  // 9. Promotional Banners for Homepage
  const bannerStmt = db.prepare(`
    INSERT INTO banners (title, subtitle, image_url, link_url, badge_text, sort_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  bannerStmt.run(
    'Gastronom — Xivadagi sevimli do‘koningiz, endi uyingizgacha.',
    '24/7 kechayu-kunduz eng sara oziq-ovqat va supermarket mahsulotlari 20-30 daqiqada eshigingiz oldida!',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop',
    '/catalog',
    'Xiva • 24/7 Supermarket',
    1
  );

  bannerStmt.run(
    'Issiq Tandir Nonlari va Yangi Sut Mahsulotlari',
    'Xiva tandirida yopilgan nonlar va tabiiy qaymoq, pishloqlar har tong do‘konimizda.',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&auto=format&fit=crop',
    '/catalog?category=non-va-non-mahsulotlari',
    'Har Tong Yangi',
    2
  );

  bannerStmt.run(
    'Salqin Ichimliklar — Coca-Cola va Sharbatlar Aksiyasi',
    'Barcha mashhur gazlangan ichimliklar va tabiiy meva sharbatlariga -15% gacha chegirmalar!',
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=1600&auto=format&fit=crop',
    '/discounts',
    'Qaynoq Chegirma',
    3
  );

  // 10. Sample Reviews
  const revStmt = db.prepare(`
    INSERT INTO reviews (product_id, user_id, rating, comment, is_verified_purchase, status)
    VALUES (?, ?, ?, ?, 1, 'approved')
  `);

  revStmt.run(p1, customerId, 5, 'Coca-Cola juda tez muzdek holatda yetkazib berildi! Rahmat Gastronom jamoasiga.');
  revStmt.run(p5, customerId, 5, 'Tandir noni hali issiq ekan, qarsildoq va xushbo‘y.');
  revStmt.run(p6, customerId, 5, 'Musaffo suti har doim yangi va toza keladi.');

  // 11. Initial Sample Order (#GS-10482 matching prompt example!)
  const ordInsert = db.prepare(`
    INSERT INTO orders (
      order_number, user_id, customer_name, customer_phone, customer_email,
      delivery_zone_id, delivery_address, delivery_fee, delivery_instructions,
      subtotal, discount_amount, coupon_code, coupon_discount, total_amount,
      payment_method, payment_status, order_status, delivery_type, delivery_worker_id, created_at
    ) VALUES (
      'GS-10482', ?, 'Ali Valiyev', '+998901234567', 'ali@example.uz',
      ?, '{"region":"Xorazm viloyati","city":"Xiva shahri","street":"Mustaqillik ko‘chasi","house":"17-uy","zoneName":"Xiva markazi (0–2 km)"}',
      15000, 'Iltimos eshik oldida qo‘ng‘iroq qiling.',
      87000, 0, null, 0, 102000,
      'cod', 'pending', 'preparing', 'delivery', ?, datetime('now', '-30 minutes')
    )
  `).run(customerId, z1, courierId);

  const sampleOrderId = ordInsert.lastInsertRowid;
  const itemStmt = db.prepare(`
    INSERT INTO order_items (
      order_id, product_id, variant_id, product_name, variant_name, sku,
      unit_price, original_price, discount_applied, quantity, total_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  itemStmt.run(sampleOrderId, p2, null, 'Coca-Cola Classic Gazlangan Ichimlik 1 L', null, 'COLA-CLS-10L', 11500, 13000, 1500, 2, 23000);
  itemStmt.run(sampleOrderId, p5, null, 'Xiva Tandir Noni (Issiq va Qarsildoq)', null, 'NON-TND-01', 5000, 6000, 1000, 3, 15000);
  itemStmt.run(sampleOrderId, p6, null, 'Musaffo 3.2% Tabiiy Pasterizatsiyalangan Sut 1 L', null, 'MSF-MILK-1L', 11900, 14000, 2100, 2, 23800);
  itemStmt.run(sampleOrderId, p11, null, 'Barilla Spaghetti No. 5 Qattiq Bug‘doy Makaroni 500 g', null, 'BAR-SPAG-500', 24000, 29000, 5000, 1, 24000);

  // 12. Sample In-App Notification
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, link, is_read)
    VALUES (?, 'order_status', 'Buyurtma tayyorlanmoqda', 'Sizning #GS-10482 raqamli buyurtmangiz tayyorlanmoqda va tez orada kuryerga topshiriladi.', '/orders/GS-10482', 0)
  `).run(customerId);

  // 13. Audit Log
  db.prepare(`
    INSERT INTO audit_logs (admin_id, admin_name, action, entity, entity_id, old_value, new_value, ip_address)
    VALUES (?, 'Bosh Administrator', 'SEED_SYSTEM_INITIALIZATION', 'system', '0', NULL, 'Database initialized with Khiva 24/7 store catalog', '127.0.0.1')
  `).run(adminId);
});

seedTx();
console.log('Successfully seeded database with Gastronom Khiva commercial data!');
