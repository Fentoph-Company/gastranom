import db from '../db/connection.js';

console.log('Updating Gastranom location to Xiva, Mustaqillik ko‘chasi, 17...');

const locationTx = db.transaction(() => {
  // Update settings
  const upsertSetting = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  upsertSetting.run('store_address', JSON.stringify('Xiva, Mustaqillik ko‘chasi, 17'));
  upsertSetting.run('store_city', JSON.stringify('Xiva'));
  upsertSetting.run('store_region', JSON.stringify('Xorazm'));
  upsertSetting.run('store_type', JSON.stringify('Oziq-ovqat do‘koni'));
  upsertSetting.run('store_rating', JSON.stringify(4.1));
  upsertSetting.run('store_review_count', JSON.stringify(94));
  upsertSetting.run('working_hours', JSON.stringify('Har kuni 10:00–23:00'));
  upsertSetting.run('plus_code', JSON.stringify('99J4+JF'));
  upsertSetting.run('store_coordinates', JSON.stringify({
    lat: 41.381527,
    lng: 60.355998,
    plus_code: '99J4+JF',
    address: 'Xiva, Mustaqillik ko‘chasi, 17'
  }));
  upsertSetting.run('maps_url', JSON.stringify('https://yandex.uz/maps/?pt=60.355998,41.381527&z=17&l=map'));
  upsertSetting.run('google_maps_url', JSON.stringify('https://www.google.com/maps/search/?api=1&query=41.381527,60.355998'));

  // Update existing Delivery Zones in-place
  const updateZone = db.prepare(`
    UPDATE delivery_zones
    SET name = ?, region = ?, price = ?, free_threshold = ?, estimated_time = ?, is_active = 1
    WHERE id = ?
  `);

  updateZone.run('Xiva shahri (Markaziy Express 0-5 km)', 'Xorazm viloyati', 10000, 150000, '30-45 daqiqa', 1);
  updateZone.run('Xiva shahar atrofi (5-15 km)', 'Xorazm viloyati', 18000, 200000, '45-60 daqiqa', 2);
  updateZone.run('Urganch shahri', 'Xorazm viloyati', 25000, 250000, '1-2 soat', 3);
  updateZone.run('Xorazm viloyati tumanlari (Xonqa, Shovot, Yangibozor, Gurlan, Hazorasp)', 'Xorazm viloyati', 35000, 350000, 'Bugunning o‘zida', 4);

  upsertSetting.run('free_delivery_threshold', JSON.stringify(150000));
  upsertSetting.run('faq', JSON.stringify([
    { q: 'Qanday to‘lov turlari mavjud?', a: 'Naqd pul, Payme, Click va bank kartalari (Uzcard, Humo, Visa, Mastercard) orqali to‘lashingiz mumkin.' },
    { q: 'Yetkazib berish qancha vaqt oladi?', a: 'Xiva shahri markazi bo‘yicha 30-45 daqiqa, shahar atrofi va Urganchga 1-2 soat ichida yetkaziladi.' },
    { q: 'Do‘kon qachongacha ishlaydi?', a: 'Do‘konimiz har kuni 10:00 dan 23:00 gacha dam olish kunlarisiz xizmatingizda.' },
    { q: 'Bepul yetkazib berish sharti nima?', a: 'Xiva shahri bo‘ylab 150 000 so‘mdan yuqori bo‘lgan buyurtmalar bepul yetkaziladi!' }
  ]));

  // Update customer default address
  db.prepare(`
    UPDATE addresses
    SET region = 'Xorazm viloyati',
        city = 'Xiva shahri',
        street = 'Mustaqillik ko‘chasi',
        house = '17-uy'
    WHERE is_default = 1 OR id = 1
  `).run();

  console.log('Location and delivery zones successfully updated to Xiva, Mustaqillik ko‘chasi, 17!');
});

locationTx();
