/**
 * Kiểm thử tầng nghiệp vụ: nội dung, sản phẩm, tin nhắn liên hệ.
 *
 * Chạy: npm test (hoặc npm run test:services)
 *
 * Dùng thư mục dữ liệu TẠM nên không đụng tới nội dung thật trong server/data/.
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const dataDir = mkdtempSync(path.join(tmpdir(), 'website-services-'));
process.env.DATA_DIR = dataDir;
process.env.NODE_ENV = 'development';

let passed = 0;
let failed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`  ✗ ${name}  (${error.message})`);
    failed += 1;
  }
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

try {
  const { DB_FILE } = await import('../server/config.js');
  const buildDefaultDb = (await import('../server/data/defaults.js')).default;
  writeFileSync(DB_FILE, JSON.stringify(buildDefaultDb(), null, 2));

  const content = await import('../server/services/content.service.js');
  const products = await import('../server/services/product.service.js');
  const messages = await import('../server/services/message.service.js');
  const { slugify, sanitize, deepMerge } = await import('../server/lib/helpers.js');

  console.log('\n1. Nội dung');

  await test('dữ liệu công khai đủ mọi nhánh', async () => {
    const site = await content.getPublicSite();
    for (const key of ['settings', 'hero', 'home', 'about', 'productsSection', 'products', 'contact', 'floatingContact']) {
      assert(site[key], `thiếu ${key}`);
    }
    assert(Object.keys(site.settings.labels).length > 25, 'thiếu nhãn giao diện');
    assert(site.floatingContact.bubble?.message, 'thiếu lời nhắn bong bóng');
  });

  await test('biểu tượng liên hệ nằm trong dữ liệu, sửa được', async () => {
    const contact = await content.getSection('contact');
    for (const key of ['address', 'phone', 'email', 'hours']) {
      assert(contact.icons?.[key], `thiếu icons.${key}`);
      assert(`${key}Image` in contact.icons, `thiếu icons.${key}Image (ô ảnh riêng)`);
    }

    // Đổi biểu tượng + gắn ảnh riêng -> phải ra tới dữ liệu công khai
    await content.patchSection('contact', { icons: { phone: 'chat', phoneImage: '/uploads/hotline.png' } });
    const after = (await content.getPublicSite()).contact.icons;
    assert(after.phone === 'chat', `chưa đổi: ${after.phone}`);
    assert(after.phoneImage === '/uploads/hotline.png', 'chưa lưu ảnh riêng');
    assert(after.address === 'pin', 'gộp sâu làm mất biểu tượng của dòng khác');
  });

  await test('mỗi kênh liên hệ nổi có ô biểu tượng riêng', async () => {
    const floating = await content.getSection('floatingContact');
    const channel = floating.channels[0];
    assert('icon' in channel && 'iconImage' in channel, `khóa hiện có: ${Object.keys(channel)}`);
    assert(channel.icon === '', 'mặc định phải để trống = theo loại kênh');
  });

  await test('PATCH gộp sâu, không mất trường cũ', async () => {
    await content.patchSection('contact', { map: { zoom: 18 } });
    const contact = await content.getSection('contact');
    assert(contact.map.zoom === 18, 'chưa đổi zoom');
    assert(contact.map.query, 'mất query khi gộp');
  });

  await test('PUT thay toàn bộ nhánh', async () => {
    const before = await content.getSection('settings');
    await content.replaceSection('settings', { ...before, siteName: 'Tên mới' });
    assert((await content.getSection('settings')).siteName === 'Tên mới', 'chưa thay');
  });

  await test('nhánh lạ bị từ chối', async () => {
    let status = 0;
    try {
      await content.patchSection('users', { x: 1 });
    } catch (error) {
      status = error.status;
    }
    assert(status === 400, `mã lỗi ${status}`);
  });

  console.log('\n2. Sản phẩm');

  await test('thêm / sửa / ẩn / xóa', async () => {
    const created = await products.createProduct({
      name: 'Cân bàn Điện Tử 60kg',
      category: 'can-san',
      specs: [{ key: 'Tải trọng', value: '60kg' }],
    });
    assert(created.slug === 'can-ban-dien-tu-60kg', `slug sai: ${created.slug}`);

    const updated = await products.updateProduct(created.id, { name: created.name, enabled: false });
    assert(updated.enabled === false, 'chưa ẩn');

    const site = await content.getPublicSite();
    assert(!site.products.find((p) => p.id === created.id), 'sản phẩm ẩn vẫn hiện ra ngoài');

    await products.deleteProduct(created.id);
    assert((await products.listProducts()).length === 8, 'xóa thất bại');
  });

  await test('chặn prototype pollution khi thêm sản phẩm', async () => {
    const created = await products.createProduct(JSON.parse('{"name":"Test","__proto__":{"hacked":1}}'));
    assert({}.hacked === undefined, 'prototype bị nhiễm');
    await products.deleteProduct(created.id);
  });

  await test('sắp xếp lại thứ tự', async () => {
    const list = await products.listProducts();
    const ids = [...list].reverse().map((p) => p.id);
    await products.reorderProducts(ids);
    assert((await products.listProducts())[0].id === ids[0], 'thứ tự chưa đổi');
  });

  console.log('\n3. Form liên hệ');

  await test('dữ liệu sai bị chặn kèm chi tiết từng ô', async () => {
    let details = null;
    try {
      await messages.createMessage({ name: '', phone: 'abc' });
    } catch (error) {
      details = error.details;
    }
    assert(details?.name, 'thiếu chi tiết lỗi');
  });

  await test('gửi, đánh dấu đã đọc, xóa', async () => {
    const message = await messages.createMessage({
      name: 'Nguyễn Văn A',
      phone: '0909 123 456',
      content: 'Cần báo giá cân 60 tấn',
    });
    assert(message.read === false, 'mặc định phải là chưa đọc');

    await messages.markRead(message.id, true);
    assert((await messages.listMessages())[0].read === true, 'đánh dấu đã đọc lỗi');

    await messages.deleteMessage(message.id);
    assert((await messages.listMessages()).length === 0, 'xóa lỗi');
  });

  console.log('\n4. Nâng cấp dữ liệu cũ');

  const { fillMissing } = await import('../server/data/seed.js');

  await test('bổ sung khối mới vào bản cài cũ', () => {
    const old = { home: { stats: { enabled: true } }, settings: { siteName: 'Tên của tôi' } };
    const added = fillMissing(old, { home: { stats: { enabled: false }, gallery: { items: [] } }, settings: { siteName: 'Mặc định', logo: '/a.png' } });
    assert(old.home.gallery, 'chưa thêm khối mới');
    assert(added.includes('home.gallery'), `danh sách thêm: ${added}`);
  });

  await test('KHÔNG ghi đè giá trị người dùng đã sửa', () => {
    const old = { settings: { siteName: 'Tên của tôi' } };
    fillMissing(old, { settings: { siteName: 'Mặc định', logo: '/a.png' } });
    assert(old.settings.siteName === 'Tên của tôi', old.settings.siteName);
    assert(old.settings.logo === '/a.png', 'chưa thêm khóa còn thiếu');
  });

  await test('KHÔNG đụng vào mảng người dùng tự quản lý', () => {
    const old = { hero: { slides: [{ id: 'a' }] } };
    fillMissing(old, { hero: { slides: [{ id: 'x' }, { id: 'y' }, { id: 'z' }] } });
    assert(old.hero.slides.length === 1 && old.hero.slides[0].id === 'a', JSON.stringify(old.hero.slides));
  });

  await test('dữ liệu mặc định không còn chứa tài khoản', async () => {
    const buildDefaultDb = (await import('../server/data/defaults.js')).default;
    assert(!('users' in buildDefaultDb()), 'db.json không được chứa tài khoản');
  });

  console.log('\n5. Tiện ích');

  await test('slugify bỏ dấu tiếng Việt', () => {
    const result = slugify('Cân Ô Tô 120 Tấn – Đặc Biệt');
    assert(result === 'can-o-to-120-tan-dac-biet', result);
  });

  await test('sanitize loại bỏ khóa nguy hiểm', () => {
    const clean = sanitize(JSON.parse('{"a":1,"__proto__":{"pwned":1},"b":{"constructor":{"x":1}}}'));
    assert(clean.a === 1, 'mất dữ liệu thật');
    assert({}.pwned === undefined, 'prototype bị nhiễm');
    assert(!JSON.stringify(clean).includes('__proto__'), 'còn __proto__');
  });

  await test('deepMerge không nhận khóa nguy hiểm', () => {
    deepMerge({ a: 1 }, JSON.parse('{"__proto__":{"polluted":1}}'));
    assert({}.polluted === undefined, 'prototype bị nhiễm');
  });

  await test('sanitize cắt JSON lồng quá sâu', () => {
    let deep = {};
    let cursor = deep;
    for (let i = 0; i < 40; i += 1) {
      cursor.n = {};
      cursor = cursor.n;
    }
    let depth = 0;
    let node = sanitize(deep);
    while (node?.n) {
      depth += 1;
      node = node.n;
    }
    assert(depth <= 21, `độ sâu ${depth}`);
  });
} catch (error) {
  console.error('\nLỖI:', error.message);
  failed += 1;
} finally {
  try {
    rmSync(dataDir, { recursive: true, force: true });
  } catch {
    /* bỏ qua */
  }
}

console.log(`\n${failed === 0 ? '✓ NGHIỆP VỤ ĐẠT' : '✗ NGHIỆP VỤ CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
