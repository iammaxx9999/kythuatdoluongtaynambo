/**
 * Kiểm thử bộ sưu tập ảnh.
 *
 * Chạy: npm test (hoặc npm run test:media)
 *
 * Hai phần:
 *  1. Dò tệp đang được dùng ở đâu — chạy trước khi xóa, để không xóa nhầm
 *     ảnh đang nằm trên trang.
 *  2. Xóa tệp thì phải mất hẳn khỏi ổ đĩa, không chỉ mất khỏi danh sách.
 */

import fs from 'node:fs';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const dataDir = mkdtempSync(path.join(tmpdir(), 'website-media-'));
process.env.DATA_DIR = dataDir;
process.env.NODE_ENV = 'development';

let passed = 0;
let failed = 0;

const check = (name, ok, hint = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !hint ? '' : `  (${hint})`}`);
  ok ? (passed += 1) : (failed += 1);
};

try {
  /* ---------- 1. Dò tệp đang được dùng ---------- */
  console.log('\n1. Dò tệp đang được dùng ở đâu');

  const { findUsage } = await import('../cms/js/core/usage.js');
  const buildDefaultDb = (await import('../server/data/defaults.js')).default;
  const data = buildDefaultDb();

  const logo = data.settings.logo;
  const logoUsage = findUsage(data, logo);
  check('tìm ra logo đang được dùng', logoUsage.length > 0, `${logoUsage.length} nơi`);
  check(
    'chỉ đúng nhánh Cấu hình chung',
    logoUsage.some((u) => u.startsWith('Cấu hình chung')),
    logoUsage.join(' | '),
  );

  const heroImage = data.hero.slides[0].image;
  const heroUsage = findUsage(data, heroImage);
  check('tìm ra ảnh hero đang được dùng', heroUsage.length > 0, heroUsage.join(' | '));
  check(
    'nhãn có kèm tên slide cho dễ nhận ra',
    heroUsage.some((u) => u.includes('›')),
    heroUsage.join(' | '),
  );

  const productImage = data.products[0].image;
  const productUsage = findUsage(data, productImage);
  check(
    'tìm ra ảnh sản phẩm và kèm tên sản phẩm',
    productUsage.some((u) => u.includes(data.products[0].name)),
    productUsage.join(' | '),
  );

  check('tệp chưa dùng thì báo rỗng', findUsage(data, '/uploads/khong-ai-dung.png').length === 0);
  check('không có dữ liệu thì không nổ', findUsage(null, '/x.png').length === 0);
  check('không có đường dẫn thì không nổ', findUsage(data, '').length === 0);

  // Một ảnh dùng ở nhiều nơi thì gom lại, không đếm trùng
  const shared = { ...data };
  shared.about = { ...data.about, image: logo };
  const sharedUsage = findUsage(shared, logo);
  check('ảnh dùng ở nhiều nhánh -> liệt kê đủ', sharedUsage.length >= 2, sharedUsage.join(' | '));

  /* ---------- 2. Xóa tệp khỏi ổ đĩa ---------- */
  console.log('\n2. Xóa tệp phải mất hẳn khỏi ổ đĩa');

  const { UPLOAD_DIR } = await import('../server/config.js');
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const media = await import('../server/services/media.service.js');
  const fakeName = `kiem-thu-${Date.now()}.png`;
  const fakePath = path.join(UPLOAD_DIR, fakeName);
  fs.writeFileSync(fakePath, Buffer.from('89504e470d0a1a0a', 'hex')); // vài byte giả

  const [record] = await media.saveUploads(
    [{ filename: fakeName, originalname: 'anh-goc.png', mimetype: 'image/png', size: 8 }],
    'admin',
  );
  check('tệp vừa tải lên có trong danh sách', (await media.listMedia()).some((m) => m.id === record.id));
  check('tệp có thật trên ổ đĩa', fs.existsSync(fakePath));

  await media.deleteMedia(record.id);
  check('xóa xong thì mất khỏi danh sách', !(await media.listMedia()).some((m) => m.id === record.id));
  check('xóa xong thì mất khỏi ổ đĩa', !fs.existsSync(fakePath), 'tệp vẫn còn trong public/uploads');

  // Xóa lần nữa phải báo lỗi rõ ràng, không làm sập
  let notFound = false;
  try {
    await media.deleteMedia(record.id);
  } catch (error) {
    notFound = error.status === 404;
  }
  check('xóa tệp không tồn tại -> báo 404', notFound);

  // Bản ghi trỏ tới tệp đã biến mất: vẫn xóa được bản ghi, không nổ
  const [ghost] = await media.saveUploads(
    [{ filename: 'khong-ton-tai.png', originalname: 'ma.png', mimetype: 'image/png', size: 1 }],
    'admin',
  );
  let ok = true;
  try {
    await media.deleteMedia(ghost.id);
  } catch {
    ok = false;
  }
  check('bản ghi mồ côi vẫn xóa được', ok, 'tệp trên ổ đĩa đã mất từ trước');
  /* ---------- 3. Quét lại thư mục uploads ---------- */
  console.log('\n3. Quét lại thư mục uploads để khôi phục tệp mồ côi');

  const orphan = `mo-coi-${Date.now()}.png`;
  fs.writeFileSync(path.join(UPLOAD_DIR, orphan), Buffer.from('89504e470d0a1a0a', 'hex'));

  const recovered = await media.syncFromDisk();
  check('tìm ra tệp có trên ổ đĩa mà chưa có trong danh sách', recovered.some((r) => r.filename === orphan));
  check(
    'đoán đúng kiểu tệp',
    recovered.find((r) => r.filename === orphan)?.mimetype === 'image/png',
  );
  check('tệp khôi phục có mặt trong bộ sưu tập', (await media.listMedia()).some((m) => m.filename === orphan));

  const again = await media.syncFromDisk();
  check('quét lần hai không thêm trùng', !again.some((r) => r.filename === orphan));

  // Dọn dẹp
  const added = (await media.listMedia()).find((m) => m.filename === orphan);
  if (added) await media.deleteMedia(added.id);
  check('dọn sạch sau kiểm thử', !fs.existsSync(path.join(UPLOAD_DIR, orphan)));
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

console.log(`\n${failed === 0 ? '✓ BỘ SƯU TẬP ĐẠT' : '✗ BỘ SƯU TẬP CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
