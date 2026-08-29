/**
 * Kiểm thử ký tự đại diện trong nội dung: {brand}, {company}, {year}.
 *
 * Chạy: npm test (hoặc npm run test:tokens)
 *
 * Vì sao cần khoá lại bằng test: tên thương hiệu nằm rải rác hàng chục ô nội
 * dung. Nếu việc thay thế bị hỏng ở một nhánh nào đó thì khách sẽ đọc thấy
 * đúng chữ "{brand}" trên trang web — lỗi nhìn rất tệ mà rất dễ lọt.
 */

import { importBrowserModule } from './browser-module.mjs';

let passed = 0;
let failed = 0;

const check = (name, ok, hint = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !hint ? '' : `  (${hint})`}`);
  ok ? (passed += 1) : (failed += 1);
};

try {
  const { resolveSite, resolveTokens, fillTokens, buildTokens } = await importBrowserModule(
    'public/assets/js/core/tokens.js',
  );
  const buildDefaultDb = (await import('../server/data/defaults.js')).default;

  const year = String(new Date().getFullYear());
  const tokens = buildTokens({ brandName: 'Tây Nam Bộ', siteName: 'CÔNG TY TNHH ĐO LƯỜNG TÂY NAM BỘ' });

  /* ---------- 1. Thay thế cơ bản ---------- */
  console.log('\n1. Thay thế trong một chuỗi');

  check('{brand} -> tên ngắn', fillTokens('Vì sao chọn {brand}', tokens) === 'Vì sao chọn Tây Nam Bộ');
  check('{company} -> tên đầy đủ', fillTokens('{company}', tokens).startsWith('CÔNG TY'));
  check('{year} -> năm hiện tại', fillTokens('© {year}', tokens) === `© ${year}`);
  check('nhiều ký tự trong một câu', fillTokens('© {year} {company}', tokens) === `© ${year} CÔNG TY TNHH ĐO LƯỜNG TÂY NAM BỘ`);
  check('viết HOA vẫn nhận', fillTokens('{BRAND}', tokens) === 'Tây Nam Bộ');
  check('có khoảng trắng vẫn nhận', fillTokens('{ brand }', tokens) === 'Tây Nam Bộ');

  /* ---------- 2. Không được phá nội dung khác ---------- */
  console.log('\n2. Không phá nội dung không liên quan');

  check('ký tự lạ để nguyên', fillTokens('giá {tu} 5', tokens) === 'giá {tu} 5', 'không được xoá chữ người dùng gõ');
  check('dấu ngoặc nhọn thường để nguyên', fillTokens('a { color: red }', tokens) === 'a { color: red }');
  check('chuỗi không có ngoặc trả về y nguyên', fillTokens('Xin chào', tokens) === 'Xin chào');
  check('không phải chuỗi thì bỏ qua', fillTokens(42, tokens) === 42);
  check('null / undefined không làm sập', fillTokens(null, tokens) === null && fillTokens(undefined, tokens) === undefined);

  /* ---------- 3. Giá trị dự phòng ---------- */
  console.log('\n3. Giá trị dự phòng');

  check(
    'bỏ trống tên ngắn -> lùi về tên đầy đủ',
    fillTokens('{brand}', buildTokens({ siteName: 'Tên đầy đủ' })) === 'Tên đầy đủ',
  );
  check('không có settings cũng không nổ', fillTokens('{brand}', buildTokens()) === '');
  check(
    'tên thương hiệu tự chứa {brand} -> không lặp vô tận',
    fillTokens('{brand}', buildTokens({ brandName: '{brand}' })) === '{brand}',
  );

  /* ---------- 4. Duyệt sâu toàn bộ dữ liệu ---------- */
  console.log('\n4. Duyệt sâu toàn bộ dữ liệu site');

  const raw = buildDefaultDb();
  raw.settings.brandName = 'Tây Nam Bộ';
  const site = resolveSite(raw);

  check('thay được trong nhánh lồng sâu', site.home.features.eyebrow === 'Vì sao chọn Tây Nam Bộ', site.home.features.eyebrow);
  check('thay được dòng bản quyền', site.settings.footer.copyright.startsWith(`© ${year}`), site.settings.footer.copyright);
  check(
    'không còn ký tự đại diện nào lọt ra trang',
    !/\{\s*(brand|company|year)\s*\}/i.test(JSON.stringify(site)),
    'còn sót -> khách đọc thấy đúng chữ {brand} trên web',
  );

  // Quan trọng: CMS phải sửa được nội dung GỐC, nên không được đụng vào dữ liệu vào
  check(
    'KHÔNG sửa dữ liệu gốc (CMS còn phải chỉnh được)',
    raw.home.features.eyebrow === 'Vì sao chọn {brand}',
    `đã bị đổi thành: ${raw.home.features.eyebrow}`,
  );

  check('giữ nguyên mảng là mảng', Array.isArray(site.products) && site.products.length === raw.products.length);
  check('giữ nguyên số và boolean', site.contact.map.zoom === raw.contact.map.zoom && site.settings.footer.enabled === true);

  check('dữ liệu rỗng / null không làm sập', resolveSite(null) === null && resolveSite(undefined) === undefined);

  // Lồng quá sâu thì dừng, không đệ quy vô tận làm treo trang
  let deep = { n: null };
  let cursor = deep;
  for (let i = 0; i < 30; i += 1) {
    cursor.n = { text: '{brand}' };
    cursor = cursor.n;
  }
  let ok = true;
  try {
    resolveTokens(deep, tokens);
  } catch {
    ok = false;
  }
  check('lồng 30 tầng vẫn không treo', ok);
} catch (error) {
  console.error('\nLỖI:', error.message);
  failed += 1;
}

console.log(`\n${failed === 0 ? '✓ KÝ TỰ ĐẠI DIỆN ĐẠT' : '✗ KÝ TỰ ĐẠI DIỆN CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
