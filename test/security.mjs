/**
 * Kiểm thử bảo mật ở tầng thư viện & middleware.
 *
 * Chạy: npm test (hoặc npm run test:security)
 *
 * Phần kiểm tra qua HTTP nằm ở test/e2e.mjs. Tệp này soi những thứ khó dựng
 * bằng HTTP: mã hoá mật khẩu, giả mạo token, giới hạn tần suất, header, và
 * quét xem có bí mật nào lọt vào mã nguồn hay không.
 *
 * Dùng thư mục dữ liệu TẠM nên không đụng tới tài khoản thật.
 */

import fs from 'node:fs';
import path from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = mkdtempSync(path.join(tmpdir(), 'website-security-'));
process.env.DATA_DIR = dataDir;
process.env.NODE_ENV = 'development';

const PASSWORD = 'MatKhauKiemThu@2026';

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

/** Chạy một middleware, trả về lỗi mà nó gọi next(err) — hoặc undefined nếu cho qua. */
const runMiddleware = (middleware, req) =>
  new Promise((resolve) => middleware(req, { setHeader() {} }, resolve));

try {
  const config = (await import('../server/config.js')).default;
  const { CREDENTIALS_FILE, DB_FILE, SECRET_FILE } = await import('../server/config.js');

  const buildDefaultDb = (await import('../server/data/defaults.js')).default;
  fs.writeFileSync(DB_FILE, JSON.stringify(buildDefaultDb(), null, 2));
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ username: 'admin', password: PASSWORD }));

  const credentials = await import('../server/lib/credentials.js');

  console.log('\n1. Tệp tài khoản');

  await test('mật khẩu dạng thường bị băm và xóa khỏi ổ đĩa', async () => {
    const result = await credentials.initCredentials({});
    const onDisk = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
    assert(result.rehashed === true, 'chưa băm lại');
    assert(!onDisk.password, 'còn lưu mật khẩu dạng thường');
    assert(onDisk.passwordHash?.length > 20, 'thiếu passwordHash');
    assert(!JSON.stringify(onDisk).includes(PASSWORD), 'LỘ MẬT KHẨU trong tệp');
  });

  await test('đăng nhập đúng / sai đều xử lý chuẩn', () => {
    assert(credentials.verifyPassword('admin', PASSWORD)?.username === 'admin', 'không vào được');
    assert(credentials.verifyPassword('admin', 'sai') === null, 'nhận sai mật khẩu');
    assert(credentials.verifyPassword('khong-co', PASSWORD) === null, 'nhận sai tài khoản');
    assert(credentials.verifyPassword('ADMIN', PASSWORD) !== null, 'không chấp nhận hoa/thường');
    assert(credentials.verifyPassword('admin', PASSWORD).passwordHash === undefined, 'trả về cả hash');
  });

  const users = await import('../server/services/user.service.js');

  await test('từ chối mật khẩu mới quá yếu', async () => {
    for (const weak of ['123', 'abcdefgh', '1234567']) {
      let rejected = false;
      try {
        await users.changePassword(PASSWORD, weak);
      } catch (error) {
        rejected = error.status === 400;
      }
      assert(rejected, `nhận mật khẩu yếu: ${weak}`);
    }
  });

  await test('thông báo đăng nhập không tiết lộ nguyên nhân', async () => {
    const seen = new Set();
    for (const [username, password] of [
      ['admin', 'sai'],
      ['ai-do', 'sai'],
    ]) {
      try {
        await users.verifyCredentials(username, password);
      } catch (error) {
        seen.add(error.message);
      }
    }
    assert(seen.size === 1, 'thông báo khác nhau -> dò được tên đăng nhập');
  });

  console.log('\n2. Token phiên');

  const auth = await import('../server/middleware/auth.js');
  const callAuth = (token) =>
    runMiddleware(auth.requireAuth, { headers: { authorization: `Bearer ${token}` }, cookies: {} });

  await test('khóa ký đủ dài và không nằm trong mã nguồn', async () => {
    const { resolveJwtSecret } = await import('../server/lib/secret.js');
    const secret = resolveJwtSecret();
    assert(secret.length >= 32, 'khóa quá ngắn');
    assert(!fs.readFileSync(path.join(ROOT, 'server/lib/secret.js'), 'utf8').includes(secret), 'khóa bị hardcode');
    assert(fs.existsSync(SECRET_FILE), 'chưa lưu khóa ra tệp');
  });

  await test('token thật được chấp nhận', async () => {
    const token = auth.signToken({ id: 'cms-admin', username: 'admin', role: 'admin' }, true);
    assert((await callAuth(token)) === undefined, 'token thật bị từ chối');
  });

  await test('token giả mạo và alg=none bị từ chối', async () => {
    const token = auth.signToken({ id: 'cms-admin', username: 'admin', role: 'admin' });
    const parts = token.split('.');

    const forged = `${parts[0]}.${Buffer.from(JSON.stringify({ sub: 'hacker', role: 'admin' })).toString('base64url')}.${parts[2]}`;
    assert((await callAuth(forged))?.status === 401, 'nhận token giả mạo');

    const none = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${parts[1]}.`;
    assert((await callAuth(none))?.status === 401, 'nhận alg=none');
  });

  console.log('\n3. Chống CSRF');

  const security = await import('../server/middleware/security.js');
  const makeRequest = (options = {}) => ({
    method: 'POST',
    protocol: 'http',
    path: '/api/products',
    cookies: {},
    body: {},
    ip: '1.2.3.4',
    socket: {},
    get(header) {
      return options.headers?.[header.toLowerCase()];
    },
    ...options,
  });

  await test('chặn ghi dữ liệu từ tên miền lạ', async () => {
    const error = await runMiddleware(
      security.originGuard,
      makeRequest({ headers: { origin: 'https://ke-tan-cong.com', host: 'localhost:3000' } }),
    );
    assert(error?.status === 403, 'không chặn');
  });

  await test('cho phép ghi từ chính trang', async () => {
    const error = await runMiddleware(
      security.originGuard,
      makeRequest({ headers: { origin: 'http://localhost:3000', host: 'localhost:3000' } }),
    );
    assert(error === undefined, `chặn nhầm: ${error?.message}`);
  });

  await test('có cookie phiên nhưng thiếu Origin -> chặn', async () => {
    const request = makeRequest({ headers: { host: 'localhost:3000' } });
    request.cookies[config.auth.cookieName] = 'abc';
    assert((await runMiddleware(security.originGuard, request))?.status === 403, 'không chặn');
  });

  await test('Referer dị dạng không làm sập server', async () => {
    const error = await runMiddleware(
      security.originGuard,
      makeRequest({ headers: { referer: 'khong-phai-url:::', host: 'localhost:3000' } }),
    );
    assert(error?.status === 403, 'phải trả 403 chứ không được ném lỗi 500');
  });

  await test('Origin "null" (iframe sandbox) bị coi là thiếu', async () => {
    const request = makeRequest({ headers: { origin: 'null', host: 'localhost:3000' } });
    request.cookies[config.auth.cookieName] = 'abc';
    assert((await runMiddleware(security.originGuard, request))?.status === 403, 'nhận origin null');
  });

  await test('GET không bị ảnh hưởng', async () => {
    const error = await runMiddleware(
      security.originGuard,
      makeRequest({ method: 'GET', headers: { origin: 'https://khac.com', host: 'localhost:3000' } }),
    );
    assert(error === undefined, 'chặn nhầm GET');
  });

  console.log('\n4. Giới hạn tần suất');

  await test('khóa sau nhiều lần đăng nhập sai', async () => {
    const request = () => ({ ip: '9.9.9.9', body: { username: 'admin' }, socket: {} });
    let blocked = false;
    for (let i = 0; i < config.auth.maxLoginAttempts + 2; i += 1) {
      const error = await runMiddleware(security.loginRateLimit, request());
      if (error) {
        blocked = error.status === 429;
        break;
      }
      security.recordLoginFailure(request());
    }
    assert(blocked, `không khóa sau ${config.auth.maxLoginAttempts} lần sai`);
  });

  await test('đăng nhập thành công xóa bộ đếm', async () => {
    const request = () => ({ ip: '8.8.8.8', body: { username: 'admin' }, socket: {} });
    security.recordLoginFailure(request());
    security.clearLoginFailures(request());
    assert((await runMiddleware(security.loginRateLimit, request())) === undefined, 'vẫn bị khóa');
  });

  await test('giới hạn tần suất chung cho /api', async () => {
    const request = () => ({ ip: '7.7.7.7', socket: {} });
    let blocked = false;
    for (let i = 0; i < 300; i += 1) {
      const error = await runMiddleware(security.apiRateLimit, request());
      if (error) {
        blocked = error.status === 429;
        break;
      }
    }
    assert(blocked, 'gọi 300 lần/phút không bị chặn');
    assert(
      (await runMiddleware(security.apiRateLimit, { ip: '7.7.7.8', socket: {} })) === undefined,
      'chặn nhầm IP khác',
    );
  });

  await test('giới hạn gửi form công khai', async () => {
    const request = () => ({ ip: '6.6.6.6', socket: {} });
    let blocked = false;
    for (let i = 0; i < 10; i += 1) {
      const error = await runMiddleware(security.publicFormRateLimit, request());
      if (error) {
        blocked = error.status === 429;
        break;
      }
    }
    assert(blocked, 'spam form không bị chặn');
  });

  console.log('\n5. Header bảo mật');

  const collectHeaders = async (reqPath) => {
    const headers = {};
    await new Promise((resolve) =>
      security.securityHeaders({ path: reqPath }, { setHeader: (k, v) => (headers[k] = v) }, resolve),
    );
    return headers;
  };

  await test('CSP chặt chẽ, đủ header phòng vệ', async () => {
    const headers = await collectHeaders('/');
    const csp = headers['Content-Security-Policy'];
    for (const needle of [
      "default-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "script-src 'self'",
      "form-action 'self'",
      "base-uri 'self'",
    ]) {
      assert(csp.includes(needle), `CSP thiếu: ${needle}`);
    }
    assert(!/script-src[^;]*unsafe/.test(csp), 'script cho phép unsafe');
    assert(csp.includes('https://www.google.com'), 'CSP chặn mất Google Maps');
    assert(csp.includes('https://fonts.googleapis.com'), 'CSP chặn mất Google Fonts');
    for (const key of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy']) {
      assert(headers[key], `thiếu ${key}`);
    }
  });

  await test('API không được cache', async () => {
    const headers = await collectHeaders('/api/site');
    assert(/no-store/.test(headers['Cache-Control'] ?? ''), 'thiếu no-store');
    assert(headers.Pragma === 'no-cache', 'thiếu Pragma');
  });

  await test('CMS: cấm iframe, cấm bot, cấm cache', async () => {
    const headers = await collectHeaders(`${config.cmsPath}/`);
    assert(headers['X-Frame-Options'] === 'DENY', 'cho phép nhúng iframe');
    assert(/noindex/.test(headers['X-Robots-Tag'] ?? ''), 'thiếu noindex');
    assert(headers['Cache-Control'] === 'no-store', 'CMS bị cache');
  });

  await test('tệp tải lên bị sandbox (chặn SVG độc hại)', async () => {
    const headers = {};
    await new Promise((resolve) =>
      security.uploadHeaders({}, { setHeader: (k, v) => (headers[k] = v) }, resolve),
    );
    const csp = headers['Content-Security-Policy'];
    assert(csp.includes('sandbox'), 'thiếu sandbox');
    assert(csp.includes("default-src 'none'"), 'CSP quá rộng');
    assert(headers['X-Content-Type-Options'] === 'nosniff', 'thiếu nosniff');
  });

  console.log('\n6. Cấu hình và rò rỉ');

  await test('mặc định không tin X-Forwarded-For', () => {
    assert(config.trustProxy === false, 'trust proxy đang bật -> giả mạo được IP');
  });

  await test('chặn URL javascript: từ nội dung CMS', async () => {
    const { safeUrl, httpsUrl } = await import('../public/assets/js/core/dom.js');
    for (const evil of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      '  javascript:x',
      'java\tscript:alert(1)',
      'vbscript:x',
      'data:text/html,<script>',
    ]) {
      assert(safeUrl(evil) === '', `lọt: ${JSON.stringify(evil)}`);
    }
    assert(safeUrl('/uploads/a.png') === '/uploads/a.png', 'chặn nhầm đường dẫn hợp lệ');
    assert(safeUrl('#lien-he') === '#lien-he', 'chặn nhầm neo trong trang');
    assert(httpsUrl('http://x.com') === '', 'httpsUrl nhận http');
    assert(httpsUrl('https://x.com') === 'https://x.com', 'httpsUrl chặn nhầm https');
  });

  await test('API công khai không lộ thông tin nhạy cảm', async () => {
    const content = await import('../server/services/content.service.js');
    const site = JSON.stringify(await content.getPublicSite());
    for (const keyword of ['passwordHash', 'password', 'users', 'secret', 'apiKey', 'api_key', '"token"']) {
      assert(!new RegExp(keyword, 'i').test(site), `lộ từ khóa: ${keyword}`);
    }
  });

  await test('dữ liệu cho CMS không kèm tài khoản', async () => {
    const content = await import('../server/services/content.service.js');
    assert(!/passwordHash|"users"/i.test(JSON.stringify(await content.getAdminSite())), 'lộ tài khoản');
  });

  await test('.gitignore che hết tệp bí mật', () => {
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    for (const entry of ['.env', 'credentials.json', '.jwt-secret', 'node_modules']) {
      assert(gitignore.includes(entry), `thiếu: ${entry}`);
    }
  });

  await test('không có bí mật nào trong mã nguồn', () => {
    const found = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.git'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!/\.(js|mjs|html|css|json|md)$/.test(entry.name)) continue;
        if (full.includes('credentials.json') || full.includes('db.json')) continue;

        const source = fs.readFileSync(full, 'utf8');
        if (/(AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20}|AIza[0-9A-Za-z_-]{30})/.test(source)) {
          found.push(`${full} (api key)`);
        }
        if (/passwordHash\s*[:=]\s*['"]\$/.test(source)) found.push(`${full} (hash)`);
      }
    };
    walk(ROOT);
    assert(found.length === 0, found.join(', '));
  });

  await test('không lưu bí mật nào vào bộ nhớ trình duyệt', () => {
    const risky = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!entry.name.endsWith('.js')) continue;
        const source = fs.readFileSync(full, 'utf8');
        for (const match of source.matchAll(/(localStorage|sessionStorage)\.setItem\([^)]*\)/g)) {
          if (/password|pwd|token|secret|credential/i.test(match[0])) risky.push(`${entry.name}: ${match[0]}`);
        }
      }
    };
    walk(path.join(ROOT, 'cms'));
    walk(path.join(ROOT, 'public'));
    assert(risky.length === 0, risky.join(', '));
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

console.log(`\n${failed === 0 ? '✓ BẢO MẬT ĐẠT' : '✗ BẢO MẬT CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
