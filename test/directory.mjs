/**
 * Kiểm thử danh bạ liên hệ — mỗi dòng ghi rõ ai phụ trách số nào.
 *
 * Chạy: npm test (hoặc npm run test:directory)
 *
 * Hai điều test này canh:
 *
 *  1. Đường dẫn dựng đúng theo loại (tel: / mailto: / zalo.me). Sai chỗ này thì
 *     khách bấm vào số điện thoại mà máy không gọi — mất khách mà không ai hay.
 *  2. Khối liên hệ trên trang và trang bảo trì **dùng chung** một bộ quy tắc.
 *     Hai bản sao là kiểu gì cũng có ngày lệch nhau.
 */

import { importBrowserModule } from './browser-module.mjs';

let passed = 0;
let failed = 0;

const check = (name, ok, hint = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !hint ? '' : `  (${hint})`}`);
  ok ? (passed += 1) : (failed += 1);
};

/* DOM giả tối giản, đủ để gọi renderContact */
const el = () => ({
  innerHTML: '',
  hidden: false,
  className: '',
  dataset: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  addEventListener() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  setAttribute() {},
  appendChild() {},
  closest: () => null,
  focus() {},
});

globalThis.window = {
  setTimeout,
  clearTimeout,
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  addEventListener() {},
  requestAnimationFrame: (fn) => fn(),
};
globalThis.document = {
  createElement: el,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  body: el(),
};
globalThis.requestAnimationFrame = (fn) => fn();

try {
  const { buildDirectory } = await importBrowserModule('public/assets/js/core/directory.js');
  const { renderContact } = await importBrowserModule('public/assets/js/components/contact.js');
  const { renderMaintenancePage } = await import('../server/lib/maintenance-page.js');
  const buildDefaultDb = (await import('../server/data/defaults.js')).default;

  const SAMPLE = [
    { id: 'a', label: 'Bộ phận kinh doanh', person: 'Anh Tuấn', type: 'phone', value: '0939 292 845', enabled: true },
    { id: 'b', label: 'Hỗ trợ kỹ thuật', type: 'zalo', value: '0909123456', enabled: true },
    { id: 'c', label: 'Kế toán', person: 'Chị Lan', type: 'email', value: 'ketoan@vidu.vn', enabled: true },
    { id: 'd', label: 'Fax', type: 'text', value: '028 1234 5678', enabled: true },
    { id: 'e', label: 'Đã nghỉ', type: 'phone', value: '0000000000', enabled: false },
    { id: 'f', label: 'Chưa điền', type: 'phone', value: '', enabled: true },
  ];

  /* ---------- 1. Dựng đường dẫn ---------- */
  console.log('\n1. Đường dẫn theo từng loại');

  const built = buildDirectory(SAMPLE);
  const by = (label) => built.find((x) => x.label === label);

  check('bỏ dòng đã tắt', !by('Đã nghỉ'));
  check('bỏ dòng chưa điền giá trị', !by('Chưa điền'), 'dòng trống sẽ thành nút bấm rỗng');
  check('còn lại đúng 4 dòng', built.length === 4, `${built.length} dòng`);

  check('điện thoại -> tel: và bỏ khoảng trắng', by('Bộ phận kinh doanh')?.href === 'tel:0939292845', by('Bộ phận kinh doanh')?.href);
  check('email -> mailto:', by('Kế toán')?.href === 'mailto:ketoan@vidu.vn');
  check('zalo -> zalo.me + chỉ giữ chữ số', by('Hỗ trợ kỹ thuật')?.href === 'https://zalo.me/0909123456');
  check('loại "chỉ hiện chữ" không có đường dẫn', by('Fax')?.href === '', 'không được tạo thẻ <a> rỗng');

  check('zalo mở tab mới', by('Hỗ trợ kỹ thuật')?.external === true);
  check('điện thoại KHÔNG mở tab mới', by('Bộ phận kinh doanh')?.external === false, 'tel: mà mở tab mới là để lại tab trắng');

  check(
    'zalo dán sẵn link đầy đủ thì giữ nguyên',
    buildDirectory([{ type: 'zalo', value: 'https://zalo.me/g/abcxyz', label: 'Nhóm', enabled: true }])[0].href ===
      'https://zalo.me/g/abcxyz',
  );
  check(
    'điện thoại có +84 vẫn giữ dấu +',
    buildDirectory([{ type: 'phone', value: '+84 939 292 845', label: 'X', enabled: true }])[0].href === 'tel:+84939292845',
  );

  /* ---------- 2. Giá trị dự phòng ---------- */
  console.log('\n2. Giá trị dự phòng');

  check('không có danh bạ thì trả mảng rỗng', buildDirectory().length === 0);
  check('dữ liệu hỏng cũng không nổ', buildDirectory('không phải mảng').length === 0);
  check(
    'bỏ trống nhãn thì dùng tên loại',
    buildDirectory([{ type: 'email', value: 'a@b.vn', enabled: true }])[0].label === 'Email',
  );
  check(
    'loại lạ thì coi như chỉ hiện chữ, không tạo link',
    buildDirectory([{ type: 'loai-la', value: 'abc', label: 'X', enabled: true }])[0].href === '',
  );
  check(
    'bỏ trống biểu tượng thì lấy theo loại',
    buildDirectory([{ type: 'phone', value: '090', label: 'X', enabled: true }])[0].icon === 'phone',
  );

  /* ---------- 3. Hiển thị trên khối liên hệ ---------- */
  console.log('\n3. Khối liên hệ trên trang');

  const data = buildDefaultDb();
  data.contact.directory = [
    ...SAMPLE,
    { id: 'x', label: 'Chèn mã', person: '<script>alert(1)</script>', type: 'phone', value: '0<b>1</b>', enabled: true },
  ];

  const root = el();
  renderContact(root, data);
  const html = root.innerHTML;

  check('hiện bộ phận kèm người phụ trách', html.includes('Bộ phận kinh doanh') && html.includes('Anh Tuấn'));
  check('có liên kết gọi điện', html.includes('tel:0939292845'));
  check('dòng đã tắt không được vẽ', !html.includes('Đã nghỉ'));
  check('vẫn giữ các dòng cơ bản', html.includes('Giờ làm việc'));
  check(
    'thoát HTML trong tên người phụ trách',
    !html.includes('<script>') && html.includes('&lt;script&gt;'),
    'người gõ thẻ vào ô tên là chạy được',
  );

  data.contact.showBasicRows = false;
  const root2 = el();
  renderContact(root2, data);
  const html2 = root2.innerHTML;

  check('tắt dòng cơ bản -> ẩn email mặc định', !html2.includes('kinhdoanh@vietphatscale.vn'));
  check('...nhưng danh bạ vẫn còn', html2.includes('Bộ phận kinh doanh'));
  check('...và địa chỉ vẫn hiện', html2.includes('KCN Vsip 1'), 'địa chỉ không thuộc nhóm dòng cơ bản');

  /* ---------- 4. Trang bảo trì dùng CHUNG danh bạ ---------- */
  console.log('\n4. Trang bảo trì lấy đúng danh bạ');

  const maint = buildDefaultDb();
  maint.settings.maintenance.enabled = true;
  maint.contact.directory = SAMPLE;
  const page = renderMaintenancePage(maint);

  check('hiện bộ phận + người phụ trách', page.includes('Bộ phận kinh doanh · Anh Tuấn'));
  check('liên kết gọi điện giống hệt khối liên hệ', page.includes('tel:0939292845'));
  check('liên kết zalo đúng', page.includes('https://zalo.me/0909123456'));
  check('liên kết ngoài mở tab mới', /zalo\.me[^>]*target="_blank"/.test(page));
  check(
    'không hiện lẫn số cũ ở ô cố định',
    !page.includes('1900 6789'),
    'có danh bạ thì dùng danh bạ, không trộn hai nguồn',
  );

  // Chưa khai danh bạ -> lùi về các ô cố định, bản cài cũ vẫn chạy
  const legacy = buildDefaultDb();
  legacy.settings.maintenance.enabled = true;
  legacy.contact.directory = [];
  const legacyPage = renderMaintenancePage(legacy);
  check('chưa khai danh bạ -> dùng số ở ô cố định', legacyPage.includes('1900 6789'));

  // Loại "chỉ hiện chữ" không được thành thẻ <a> rỗng
  check('loại "chỉ hiện chữ" vẽ bằng <span>', page.includes('<span class="contact__item">'));
  check('không có thẻ <a> rỗng href', !/<a class="contact__item" href=""/.test(page));
} catch (error) {
  console.error('\nLỖI:', error.stack);
  failed += 1;
}

console.log(`\n${failed === 0 ? '✓ DANH BẠ ĐẠT' : '✗ DANH BẠ CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
