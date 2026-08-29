/**
 * Kiểm thử điều hướng trong trang: KHÔNG được lộ đường dẫn.
 *
 * Chạy: npm test (hoặc npm run test:links)
 *
 * Yêu cầu: bấm menu thì thanh địa chỉ không đổi thành tenmien.com/#san-pham,
 * và rê chuột lên menu cũng không hiện đường dẫn ở góc dưới trái.
 *
 * Cách làm: mục nhảy trong trang dựng bằng <button data-scroll-to="...">,
 * không có thuộc tính href — trình duyệt chỉ hiện dòng xem trước khi có href.
 *
 * Ranh giới quan trọng: chỉ áp dụng cho NEO TRONG TRANG. Liên kết thật ra ngoài
 * (Facebook, Zalo, Google Maps, tel:, mailto:) phải giữ nguyên <a href>, giấu đi
 * chỉ làm khó người dùng mà không được gì.
 */

import { importBrowserModule } from './browser-module.mjs';

let passed = 0;
let failed = 0;

const check = (name, ok, hint = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !hint ? '' : `  (${hint})`}`);
  ok ? (passed += 1) : (failed += 1);
};

const el = () => ({
  innerHTML: '',
  hidden: false,
  className: '',
  dataset: {},
  style: { setProperty() {} },
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
  PointerEvent: function PointerEvent() {},
};
globalThis.document = {
  createElement: el,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  body: el(),
  documentElement: el(),
  getElementById: () => null,
};
globalThis.requestAnimationFrame = (fn) => fn();

/** Mọi href trỏ vào neo trong trang — cái mà chúng ta KHÔNG muốn thấy nữa. */
const inPageHrefs = (html) => html.match(/href="#[^"]*"/g) ?? [];

try {
  const { navAction, isInPageTarget } = await importBrowserModule('public/assets/js/core/links.js');
  const buildDefaultDb = (await import('../server/data/defaults.js')).default;

  /* ---------- 1. Hàm dựng ---------- */
  console.log('\n1. Dựng đúng loại thẻ');

  check('#san-pham là neo trong trang', isInPageTarget('#san-pham'));
  check('https://... không phải neo trong trang', !isInPageTarget('https://facebook.com/abc'));
  check('/uploads/x.pdf không phải neo trong trang', !isInPageTarget('/uploads/x.pdf'));

  const inPage = navAction({ target: '#san-pham', label: 'Sản phẩm', className: 'nav' });
  check('neo trong trang -> <button>', inPage.startsWith('<button'), inPage);
  check('...không có href', !inPage.includes('href'), 'còn href là còn hiện đường dẫn khi rê chuột');
  check('...có type="button"', inPage.includes('type="button"'), 'thiếu thì nút gửi form khi nằm trong <form>');
  check('...bỏ dấu # trong data', inPage.includes('data-scroll-to="san-pham"'), inPage);
  check('...không để lộ chuỗi giống đường dẫn', !inPage.includes('"#san-pham"'), inPage);

  const external = navAction({ target: 'https://zalo.me/123', label: 'Zalo' });
  check('liên kết ngoài -> vẫn là <a href>', external.includes('href="https://zalo.me/123"'), external);
  check('...mở tab mới', external.includes('target="_blank"'));
  check('...có rel chống chiếm tab', external.includes('rel="noopener noreferrer"'));

  const relative = navAction({ target: '/uploads/bao-gia.pdf', label: 'Tải báo giá' });
  check('tệp trong site -> vẫn là <a href>', relative.includes('href="/uploads/bao-gia.pdf"'));
  check('...KHÔNG mở tab mới', !relative.includes('target="_blank"'), 'cùng site thì mở ngay tại chỗ');

  check(
    'đường dẫn nguy hiểm -> không dựng liên kết',
    navAction({ target: 'javascript:alert(1)', label: 'X' }).startsWith('<span'),
    navAction({ target: 'javascript:alert(1)', label: 'X' }),
  );
  check('bỏ trống đích -> không dựng liên kết', navAction({ target: '', label: 'X' }).startsWith('<span'));
  check(
    'nhãn được thoát HTML',
    navAction({ target: '#a', label: '<script>x</script>' }).includes('&lt;script&gt;'),
  );

  /* ---------- 2. Header ---------- */
  console.log('\n2. Menu trên website');

  const data = buildDefaultDb();
  const { renderHeader } = await importBrowserModule('public/assets/js/components/header.js');
  const headerRoot = el();
  renderHeader(headerRoot, data);
  const header = headerRoot.innerHTML;

  check('không còn href trỏ vào neo', inPageHrefs(header).length === 0, inPageHrefs(header).join(', '));
  check('mục menu là <button>', header.includes('<button type="button" class="site-nav__link"'));
  check('logo cũng là <button>', header.includes('<button type="button" class="site-header__brand"'));
  check('nút "Nhận báo giá" cũng vậy', /class="btn btn--primary btn--sm" data-scroll-to=/.test(header));
  check(
    'giữ data-nav-target cho phần tự sáng menu',
    header.includes('data-nav-target="#san-pham"'),
    'mất cái này thì menu không tự sáng theo khu vực đang xem',
  );

  /* ---------- 3. Hero và các khối khác ---------- */
  console.log('\n3. Đầu trang, dải CTA, chân trang');

  const { renderHero } = await importBrowserModule('public/assets/js/components/hero.js');
  const heroRoot = el();
  renderHero(heroRoot, data);
  check('nút trong hero không lộ đường dẫn', inPageHrefs(heroRoot.innerHTML).length === 0);

  const sections = await importBrowserModule('public/assets/js/components/sections.js');

  const ctaRoot = el();
  sections.renderCta(ctaRoot, data);
  check('nút dải CTA không lộ đường dẫn', inPageHrefs(ctaRoot.innerHTML).length === 0);

  // Chân trang: cột liên kết do CMS đặt, trộn cả neo trong trang lẫn link ngoài
  const withLinks = JSON.parse(JSON.stringify(data));
  withLinks.settings.footer.columns = [
    {
      id: 'c1',
      title: 'Liên kết',
      links: [
        { id: 'l1', label: 'Sản phẩm', url: '#san-pham' },
        { id: 'l2', label: 'Fanpage', url: 'https://facebook.com/vidu' },
      ],
    },
  ];
  withLinks.settings.footer.bottomLinks = [{ id: 'b1', label: 'Liên hệ', url: '#lien-he' }];

  const footerRoot = el();
  sections.renderFooter(footerRoot, withLinks);
  const footer = footerRoot.innerHTML;

  check('chân trang: neo trong trang không lộ', inPageHrefs(footer).length === 0, inPageHrefs(footer).join(', '));
  check('chân trang: neo trong trang thành <button>', footer.includes('data-scroll-to="san-pham"'));
  check(
    'chân trang: liên kết NGOÀI vẫn giữ href',
    footer.includes('href="https://facebook.com/vidu"'),
    'giấu link ngoài chỉ làm khó người dùng',
  );

  /* ---------- 4. Không đụng vào liên kết thật ---------- */
  console.log('\n4. Liên kết thật phải giữ nguyên');

  const { renderContact } = await importBrowserModule('public/assets/js/components/contact.js');
  const contactRoot = el();
  renderContact(contactRoot, data);
  const contact = contactRoot.innerHTML;

  check('số điện thoại vẫn bấm gọi được', /href="tel:/.test(contact));
  check('email vẫn bấm gửi thư được', /href="mailto:/.test(contact));
  check('khối liên hệ không lộ neo trong trang', inPageHrefs(contact).length === 0);

  const { renderFloatingContact } = await importBrowserModule(
    'public/assets/js/components/floating-contact.js',
  );
  const fabRoot = el();
  renderFloatingContact(fabRoot, data);
  check('nút liên hệ nổi vẫn mở được Zalo/Facebook', /href="https:\/\//.test(fabRoot.innerHTML));

  /* ---------- 5. Xử lý cú bấm ---------- */
  console.log('\n5. Bấm vào vẫn cuộn tới đúng chỗ');

  const headerSrc = (await import('node:fs')).readFileSync(
    new URL('../public/assets/js/components/header.js', import.meta.url),
    'utf8',
  );
  check(
    'bắt sự kiện qua data-scroll-to',
    headerSrc.includes("'[data-scroll-to]'"),
    'vẫn đang đọc href thì bấm không cuộn được nữa',
  );
  // Bỏ chú thích trước khi soi — trong đó có nhắc tên hàm để giải thích vì sao KHÔNG dùng
  const headerCode = headerSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  check(
    'KHÔNG ghi hash vào thanh địa chỉ',
    !/history\.(replaceState|pushState)/.test(headerCode),
    'gọi replaceState là địa chỉ hiện lại #san-pham, đúng thứ vừa tránh',
  );
  check(
    'CSS gỡ kiểu mặc định của <button>',
    (await import('node:fs'))
      .readFileSync(new URL('../public/assets/css/base.css', import.meta.url), 'utf8')
      .includes('button[data-scroll-to]'),
    'không gỡ thì menu hiện ra với nền xám và viền của trình duyệt',
  );
} catch (error) {
  console.error('\nLỖI:', error.stack);
  failed += 1;
}

console.log(`\n${failed === 0 ? '✓ ĐIỀU HƯỚNG ĐẠT' : '✗ ĐIỀU HƯỚNG CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
