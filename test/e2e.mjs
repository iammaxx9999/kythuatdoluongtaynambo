/**
 * Kiểm thử end-to-end: khởi động server thật, gọi API như trình duyệt,
 * kiểm tra "sửa trong CMS -> hiện ra trang web" và các lớp bảo mật.
 *
 * Chạy:  npm test
 *
 * Test dùng thư mục dữ liệu TẠM (biến môi trường DATA_DIR) nên hoàn toàn
 * không đụng tới nội dung thật trong server/data/.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.TEST_PORT || 3987);
const BASE = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'MatKhauKiemThu@2026';

const dataDir = mkdtempSync(path.join(tmpdir(), 'website-test-'));

let passed = 0;
let failed = 0;
let cookie = '';

const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok ? '' : `  (nhận ${JSON.stringify(actual)}, cần ${JSON.stringify(expected)})`}`);
  ok ? (passed += 1) : (failed += 1);
};

const call = async (method, url, { body, origin = BASE, auth = true, headers = {} } = {}) => {
  const res = await fetch(BASE + url, {
    method,
    redirect: 'manual',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(origin ? { Origin: origin } : {}),
      ...(auth && cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* khong phai JSON */
  }
  return { status: res.status, headers: res.headers, json, text };
};

async function waitForServer(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {
      /* chua san sang */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Server không khởi động kịp');
}

async function run() {
  /* ---------------- 1. Đăng nhập ---------------- */
  console.log('\n1. Đăng nhập CMS');
  const bad = await call('POST', '/api/auth/login', {
    body: { username: 'admin', password: 'sai-mat-khau' },
    auth: false,
  });
  check('sai mật khẩu bị từ chối', bad.status, 401);

  const login = await call('POST', '/api/auth/login', {
    body: { username: 'admin', password: PASSWORD },
    auth: false,
  });
  check('đăng nhập đúng', login.status, 200);
  cookie = (login.headers.get('set-cookie') || '').split(';')[0];
  check('nhận được cookie phiên', cookie.length > 20, true);
  check('phản hồi không chứa mật khẩu', /password|hash/i.test(login.text), false);

  // Cookie giữ đăng nhập: nhiều lần vào liên tiếp không phải đăng nhập lại
  const repeated = [];
  for (let i = 0; i < 3; i += 1) repeated.push((await call('GET', '/api/auth/me')).status);
  check('cookie giữ phiên qua nhiều lần vào', repeated, [200, 200, 200]);
  check('hồ sơ trả về đúng tài khoản', (await call('GET', '/api/auth/me')).json.user.username, 'admin');

  /* -------- 2. Sửa trong CMS -> hiện ra trang web -------- */
  console.log('\n2. Sửa trong CMS phải hiện ra trang web');
  const admin = await call('GET', '/api/cms/site');
  check('CMS đọc được dữ liệu', admin.status, 200);
  check('dữ liệu CMS không kèm tài khoản', 'users' in (admin.json ?? {}), false);

  const settings = { ...admin.json.settings, siteName: 'TÊN KIỂM THỬ', themeColor: '#c81e1e' };
  settings.labels = { ...settings.labels, productDetail: 'Xem ngay' };
  check('lưu cấu hình chung', (await call('PUT', '/api/content/settings', { body: settings })).status, 200);

  const site = await call('GET', '/api/site', { auth: false });
  check('tên web đã đổi trên trang', site.json.settings.siteName, 'TÊN KIỂM THỬ');
  check('màu thương hiệu đã đổi', site.json.settings.themeColor, '#c81e1e');
  check('nhãn giao diện đã đổi', site.json.settings.labels.productDetail, 'Xem ngay');

  for (const section of ['hero', 'home', 'about', 'contact', 'floatingContact', 'productsSection']) {
    const res = await call('PUT', `/api/content/${section}`, { body: admin.json[section] });
    check(`lưu nhánh ${section}`, res.status, 200);
  }

  const hero = { ...admin.json.hero };
  hero.slides = [...hero.slides, { ...hero.slides[0], id: 'slide_test', title: 'SLIDE MỚI', enabled: true }];
  await call('PUT', '/api/content/hero', { body: hero });
  const afterHero = await call('GET', '/api/site', { auth: false });
  check('thêm slide -> hiện trên trang', afterHero.json.hero.slides.length, hero.slides.length);

  /* ------------- 2b. Cấu hình bong bóng lời nhắn ------------- */
  console.log('\n2b. Bong bóng lời nhắn của nút liên hệ');

  const fc = { ...admin.json.floatingContact };
  fc.bubble = {
    ...fc.bubble,
    message: 'Lời nhắn mới từ CMS',
    display: 'autohide',
    style: 'solid',
    dismissible: true,
  };
  check('lưu cấu hình bong bóng', (await call('PUT', '/api/content/floatingContact', { body: fc })).status, 200);

  const withBubble = await call('GET', '/api/site', { auth: false });
  check('nội dung lời nhắn ra tới trang', withBubble.json.floatingContact.bubble.message, 'Lời nhắn mới từ CMS');
  check('cách hiển thị ra tới trang', withBubble.json.floatingContact.bubble.display, 'autohide');
  check('kiểu nền ra tới trang', withBubble.json.floatingContact.bubble.style, 'solid');
  check('bật nút X ra tới trang', withBubble.json.floatingContact.bubble.dismissible, true);

  /* ------------- 2c. Khối "Hình ảnh thực tế" và tông CTA ------------- */
  console.log('\n2c. Khối Hình ảnh thực tế và tông màu dải CTA');

  const home = { ...admin.json.home };
  check('mặc định dải CTA là nền sáng chữ đen', home.cta.theme, 'light');
  check('khối hình ảnh có sẵn ảnh mẫu', home.gallery.items.length > 0, true);

  home.cta = { ...home.cta, theme: 'dark' };
  home.gallery = {
    ...home.gallery,
    title: 'Công trình tiêu biểu',
    items: [
      ...home.gallery.items,
      { id: 'ga_test', image: '/uploads/anh-thi-cong.jpg', caption: 'Ảnh mới', enabled: true },
    ],
  };
  check('lưu khối trang chủ', (await call('PUT', '/api/content/home', { body: home })).status, 200);

  const withGallery = await call('GET', '/api/site', { auth: false });
  check('tông CTA ra tới trang', withGallery.json.home.cta.theme, 'dark');
  check('tiêu đề khối ảnh ra tới trang', withGallery.json.home.gallery.title, 'Công trình tiêu biểu');
  check('ảnh mới ra tới trang', withGallery.json.home.gallery.items.length, home.gallery.items.length);

  /* ------------- 2d. Chân trang và dòng credit ------------- */
  console.log('\n2d. Chân trang và dòng credit');

  const withFooter = { ...admin.json.settings };
  check('chân trang có đủ khoá cấu hình', Boolean(withFooter.footer.credit && withFooter.footer.bottomLinks), true);

  withFooter.footer = {
    ...withFooter.footer,
    theme: 'light',
    copyright: '© 2026 Bản quyền của tôi',
    showTaxCode: false,
    contact: { ...withFooter.footer.contact, showAddress: false },
    credit: { enabled: true, text: 'Website bởi', name: 'Đơn vị ABC', url: 'https://vi.dụ.vn' },
    bottomLinks: [{ id: 'bl_x', label: 'Sơ đồ trang', url: '#trang-chu' }],
  };
  check('lưu chân trang', (await call('PUT', '/api/content/settings', { body: withFooter })).status, 200);

  const footerOut = (await call('GET', '/api/site', { auth: false })).json.settings.footer;
  check('tông chân trang ra tới trang', footerOut.theme, 'light');
  check('dòng bản quyền ra tới trang', footerOut.copyright, '© 2026 Bản quyền của tôi');
  check('tắt mã số thuế', footerOut.showTaxCode, false);
  check('tắt dòng địa chỉ', footerOut.contact.showAddress, false);
  check('tên đơn vị credit', footerOut.credit.name, 'Đơn vị ABC');
  check('chữ dẫn credit', footerOut.credit.text, 'Website bởi');
  check('liên kết nhỏ ở đáy', footerOut.bottomLinks.length, 1);

  /* ------------- 2e. Nhận diện trang quản trị ------------- */
  console.log('\n2e. Logo và nhận diện của trang CMS');

  const branding = { ...admin.json.settings };
  branding.cms = {
    ...branding.cms,
    logo: '/uploads/logo-cms.png',
    loginLogo: '/uploads/logo-dang-nhap.png',
    title: 'Quản trị',
    loginTitle: 'Xin chào',
  };
  check('lưu nhận diện CMS', (await call('PUT', '/api/content/settings', { body: branding })).status, 200);

  // Màn đăng nhập chạy trước khi xác thực nên phải đọc được qua API công khai
  const publicSettings = (await call('GET', '/api/site', { auth: false })).json.settings;
  check('logo thanh bên đọc được', publicSettings.cms.logo, '/uploads/logo-cms.png');
  check('logo màn đăng nhập đọc được khi CHƯA đăng nhập', publicSettings.cms.loginLogo, '/uploads/logo-dang-nhap.png');
  check('tiêu đề màn đăng nhập đọc được', publicSettings.cms.loginTitle, 'Xin chào');

  /* ---------------- 3. Sản phẩm ---------------- */
  console.log('\n3. Sản phẩm');
  const created = await call('POST', '/api/products', {
    body: { name: 'Sản phẩm kiểm thử', category: 'can-san', enabled: true },
  });
  check('thêm sản phẩm', created.status, 201);
  const id = created.json.id;
  check('slug tự sinh bỏ dấu', created.json.slug, 'san-pham-kiem-thu');

  let pub = await call('GET', '/api/site', { auth: false });
  check('sản phẩm mới hiện trên trang', pub.json.products.some((p) => p.id === id), true);

  await call('PUT', `/api/products/${id}`, { body: { name: 'Sản phẩm kiểm thử', enabled: false } });
  pub = await call('GET', '/api/site', { auth: false });
  check('ẩn sản phẩm -> biến mất khỏi trang', pub.json.products.some((p) => p.id === id), false);
  check('xóa sản phẩm', (await call('DELETE', `/api/products/${id}`)).status, 200);

  /* ---------------- 4. Chống cache ---------------- */
  console.log('\n4. Chống cache (nguyên nhân khiến thay đổi không hiện ra)');
  const apiRes = await fetch(`${BASE}/api/site`);
  check('/api/site có no-store', /no-store/.test(apiRes.headers.get('cache-control') || ''), true);
  check('/api/site có Pragma no-cache', apiRes.headers.get('pragma'), 'no-cache');
  const staticRes = await fetch(`${BASE}/assets/js/main.js`);
  check('tệp tĩnh KHÔNG bị no-store', /no-store/.test(staticRes.headers.get('cache-control') || ''), false);

  /* ---------------- 5. Tài nguyên trang ---------------- */
  console.log('\n5. Tài nguyên trang và CMS');
  for (const file of ['/', '/cms', '/cms/js/app.js', '/cms/css/admin.css', '/assets/js/main.js', '/assets/css/motion.css', '/robots.txt']) {
    const res = await fetch(BASE + file);
    check(`tải được ${file}`, res.status, 200);
  }
  const appJs = await fetch(`${BASE}/cms/js/app.js`);
  check('app.js đúng kiểu MIME (nếu sai, CMS không chạy)', /javascript/.test(appJs.headers.get('content-type') || ''), true);

  /* ---------------- 6. Bảo mật ---------------- */
  console.log('\n6. Bảo mật');
  const saved = cookie;
  cookie = '';
  check('chưa đăng nhập: không đọc được CMS', (await call('GET', '/api/cms/site')).status, 401);
  check('chưa đăng nhập: không ghi được', (await call('PUT', '/api/content/settings', { body: {} })).status, 401);
  cookie = saved;

  check(
    'CSRF: ghi từ tên miền lạ bị chặn',
    (await call('PUT', '/api/content/settings', { body: {}, origin: 'https://ke-tan-cong.com' })).status,
    403,
  );
  check(
    'thiếu Origin nhưng có cookie -> chặn',
    (await call('PUT', '/api/content/settings', { body: {}, origin: null })).status,
    403,
  );
  check('nhánh nội dung lạ bị từ chối', (await call('PUT', '/api/content/users', { body: {} })).status, 400);

  const cmsRes = await fetch(`${BASE}/cms`);
  check('/cms cấm nhúng iframe', cmsRes.headers.get('x-frame-options'), 'DENY');
  check('/cms cấm bot lập chỉ mục', /noindex/.test(cmsRes.headers.get('x-robots-tag') || ''), true);
  const csp = (await fetch(`${BASE}/`)).headers.get('content-security-policy') || '';
  check('CSP chặn script nội tuyến', /script-src 'self'(;|$)/.test(csp), true);

  const publicSite = await call('GET', '/api/site', { auth: false });
  check('API công khai không lộ bí mật', /passwordHash|jwt|secret/i.test(publicSite.text), false);

  /* ---------------- 7. Form liên hệ ---------------- */
  console.log('\n7. Form liên hệ');
  check(
    'gửi yêu cầu hợp lệ',
    (await call('POST', '/api/messages', {
      body: { name: 'Nguyễn Văn A', phone: '0909 123 456', content: 'Cần báo giá cân 60 tấn' },
      auth: false,
    })).status,
    201,
  );
  const invalid = await call('POST', '/api/messages', { body: { name: '', phone: 'abc' }, auth: false });
  check('dữ liệu sai bị từ chối', invalid.status, 400);
  check('có chi tiết lỗi từng ô', Boolean(invalid.json?.details?.name), true);
  check('quản trị đọc được tin nhắn', (await call('GET', '/api/messages')).json.length >= 1, true);

  /* ---------------- 8. Sẵn sàng lên host ---------------- */
  console.log('\n8. Sẵn sàng đẩy lên host');

  const health = await fetch(`${BASE}/healthz`);
  check('/healthz trả 200 cho monitoring', health.status, 200);
  check('/healthz không lộ thông tin bên trong', (await health.text()).trim(), 'ok');

  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  check('robots.txt chặn bot vào CMS', robots.includes('Disallow: /cms/'), true);
  check('robots.txt chặn bot vào /api', robots.includes('Disallow: /api/'), true);
  check('robots.txt khai báo sitemap', /Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(robots), true);

  const sitemapRes = await fetch(`${BASE}/sitemap.xml`);
  const sitemap = await sitemapRes.text();
  check('sitemap.xml là XML', /^application\/xml/.test(sitemapRes.headers.get('content-type') || ''), true);
  check('sitemap.xml hợp lệ', sitemap.startsWith('<?xml') && sitemap.includes('<urlset'), true);
  check('sitemap.xml không chứa đường dẫn tương đối', /<loc>https?:\/\//.test(sitemap), true);
  check('sitemap.xml không lộ đường dẫn CMS', sitemap.includes('/cms'), false);

  // Đặt "Địa chỉ website" trong CMS -> sitemap và robots phải theo ngay, không cần restart
  await call('PATCH', '/api/content/settings', { body: { siteUrl: 'https://vi-du-ten-mien.com/' } });
  const sitemap2 = await (await fetch(`${BASE}/sitemap.xml`)).text();
  check('đặt tên miền trong CMS -> sitemap theo ngay', sitemap2.includes('<loc>https://vi-du-ten-mien.com</loc>'), true);
  const robots2 = await (await fetch(`${BASE}/robots.txt`)).text();
  check('...robots.txt cũng theo', robots2.includes('Sitemap: https://vi-du-ten-mien.com/sitemap.xml'), true);

  // Dữ liệu công khai phải mang siteUrl để CMS dựng nút "Xem website"
  const publicWithUrl = await call('GET', '/api/site', { auth: false });
  check(
    'API công khai có kèm địa chỉ website',
    publicWithUrl.json?.settings?.siteUrl,
    'https://vi-du-ten-mien.com/',
  );

  // Địa chỉ rác thì bỏ qua, không được nhét vào sitemap
  await call('PATCH', '/api/content/settings', { body: { siteUrl: 'javascript:alert(1)' } });
  const sitemap3 = await (await fetch(`${BASE}/sitemap.xml`)).text();
  check('địa chỉ rác bị bỏ qua', sitemap3.includes('javascript:'), false);
  check('...và lùi về host thật', sitemap3.includes(`<loc>${BASE}</loc>`), true);

  await call('PATCH', '/api/content/settings', { body: { siteUrl: '' } });

  /* ---------------- 9. Chế độ bảo trì ---------------- */
  console.log('\n9. Chế độ bảo trì');

  // Trước khi bật: trang chủ bình thường
  check('chưa bật -> trang chủ trả 200', (await fetch(`${BASE}/`)).status, 200);

  await call('PATCH', '/api/content/settings', {
    body: { maintenance: { enabled: true, title: 'Đang nâng cấp hệ thống' } },
  });

  const maint = await fetch(`${BASE}/`);
  const maintHtml = await maint.text();
  check('bật rồi -> trang chủ trả 503', maint.status, 503);
  check('hiện đúng tiêu đề đã đặt trong CMS', maintHtml.includes('Đang nâng cấp hệ thống'), true);
  check('có nút gọi điện cho khách', /href="tel:/.test(maintHtml), true);
  check('không lộ nội dung thật của trang', maintHtml.includes('hero__slide'), false);

  // 503 + Retry-After là cách báo "tạm nghỉ" — giữ nguyên thứ hạng tìm kiếm
  check('có Retry-After cho công cụ tìm kiếm', Boolean(maint.headers.get('retry-after')), true);
  check('bảo bot đừng lập chỉ mục', /noindex/.test(maint.headers.get('x-robots-tag') || ''), true);

  /**
   * Không được cache. Thiếu no-store thì tắt bảo trì xong khách vẫn thấy trang
   * bảo trì cho tới khi tự xoá cache — lỗi cực kỳ khó tra.
   */
  check('trang bảo trì KHÔNG được cache', /no-store/.test(maint.headers.get('cache-control') || ''), true);

  // Khách vãng lai không lấy được nội dung qua API
  const anonApi = await fetch(`${BASE}/api/site`);
  check('khách lạ gọi /api/site -> 503', anonApi.status, 503);

  /* --- Phần quan trọng nhất: KHÔNG được tự khoá mình ra ngoài --- */
  check('trang quản trị vẫn mở', (await fetch(`${BASE}/cms`)).status, 200);
  check('CMS vẫn đọc được dữ liệu', (await call('GET', '/api/cms/site')).status, 200);
  check('CMS vẫn sửa được nội dung', (await call('PATCH', '/api/content/home', { body: {} })).status, 200);

  // Đăng nhập lại từ đầu trong lúc đang bảo trì (tình huống: hết phiên)
  const savedCookie = cookie;
  cookie = '';
  const reLogin = await call('POST', '/api/auth/login', {
    body: { username: 'admin', password: PASSWORD },
    auth: false,
  });
  check('vẫn ĐĂNG NHẬP LẠI được khi đang bảo trì', reLogin.status, 200);
  cookie = reLogin.headers.get('set-cookie')?.split(';')[0] || savedCookie;

  // Tệp tĩnh phải qua được, không thì trang bảo trì mất logo
  check('ảnh/logo vẫn tải được', (await fetch(`${BASE}/assets/img/logo.svg`)).status, 200);
  check('/healthz vẫn 200 (monitoring không báo động giả)', (await fetch(`${BASE}/healthz`)).status, 200);
  check('robots.txt vẫn đọc được', (await fetch(`${BASE}/robots.txt`)).status, 200);

  // Tắt lại
  await call('PATCH', '/api/content/settings', { body: { maintenance: { enabled: false } } });
  check('tắt xong -> trang chủ trả 200 ngay', (await fetch(`${BASE}/`)).status, 200);
  check('...và khách lạ đọc được /api/site', (await fetch(`${BASE}/api/site`)).status, 200);
}

/* ------------------------------------------------------------------ */
const server = spawn(process.execPath, [path.join(ROOT, 'server', 'index.js')], {
  cwd: ROOT,
  env: {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: 'development',
    DATA_DIR: dataDir,
    ADMIN_USERNAME: 'admin',
    ADMIN_PASSWORD: PASSWORD,
    TRUST_PROXY: '',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));

const cleanup = () => {
  server.kill();
  try {
    rmSync(dataDir, { recursive: true, force: true });
  } catch {
    /* bo qua */
  }
};

try {
  await waitForServer();
  console.log(`Kiểm thử end-to-end trên ${BASE} (dữ liệu tạm: ${dataDir})`);
  await run();
} catch (error) {
  console.error('\nLỖI:', error.message);
  console.error(serverLog);
  failed += 1;
} finally {
  cleanup();
}

console.log(`\n${failed === 0 ? '✓ TẤT CẢ ĐẠT' : '✗ CÓ LỖI'} — ${passed} đạt / ${failed} lỗi\n`);
process.exit(failed === 0 ? 0 : 1);
