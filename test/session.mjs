/**
 * Kiểm thử phiên đăng nhập: tự gia hạn, thu hồi, hết hạn.
 *
 * Chạy: npm test (chạy cùng ui-guard và e2e)
 *
 * Test này gọi thẳng vào middleware nên kiểm soát được thời điểm — không phải
 * chờ 15 ngày để xem phiên có tự gia hạn hay không.
 *
 * Dùng thư mục dữ liệu TẠM nên không đụng tới tài khoản thật.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const dataDir = mkdtempSync(path.join(tmpdir(), 'website-session-'));
process.env.DATA_DIR = dataDir;
process.env.NODE_ENV = 'development';

const PASSWORD = 'MatKhauKiemThu@2026';

let passed = 0;
let failed = 0;

const check = (name, ok, hint = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !hint ? '' : `  (${hint})`}`);
  ok ? (passed += 1) : (failed += 1);
};

const cleanup = () => {
  try {
    rmSync(dataDir, { recursive: true, force: true });
  } catch {
    /* bỏ qua */
  }
};

try {
  const { CREDENTIALS_FILE } = await import('../server/config.js');

  // Tạo tài khoản tạm rồi lùi thời điểm đổi mật khẩu về 60 ngày trước.
  // Nếu không lùi, mọi token "cũ" sẽ bị coi là đã thu hồi (đúng theo thiết kế).
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ username: 'admin', password: PASSWORD }));
  const credentials = await import('../server/lib/credentials.js');
  await credentials.initCredentials({});

  const record = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  record.updatedAt = new Date(Date.now() - 60 * 86400e3).toISOString();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(record));
  await credentials.initCredentials({});

  const auth = await import('../server/middleware/auth.js');
  const { resolveJwtSecret } = await import('../server/lib/secret.js');
  const secret = resolveJwtSecret();

  /** Ký JWT HS256 bằng crypto có sẵn của Node — không cần thư viện ngoài. */
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const forgeToken = (payload) => {
    const data = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}`;
    return `${data}.${crypto.createHmac('sha256', secret).update(data).digest('base64url')}`;
  };

  const fakeRes = () => {
    const cookies = [];
    return { cookies, setHeader() {}, cookie: (n, v, o) => cookies.push({ n, v, o }) };
  };

  const callAuth = (token, res) =>
    new Promise((resolve) =>
      auth.requireAuth({ headers: { authorization: `Bearer ${token}` }, cookies: {} }, res, resolve),
    );

  const now = () => Math.floor(Date.now() / 1000);
  const identity = { sub: 'cms-admin', username: 'admin', role: 'admin', name: 'Quản trị viên' };

  console.log('\nPhiên đăng nhập CMS');

  {
    const res = fakeRes();
    const error = await callAuth(auth.signToken({ id: 'cms-admin', username: 'admin', role: 'admin' }, true), res);
    check('token vừa cấp được chấp nhận', !error, error?.message);
    check('token còn mới thì KHÔNG cấp lại cookie', res.cookies.length === 0, `${res.cookies.length} cookie`);
  }

  {
    // Đi được 20/30 ngày -> quá nửa đời -> phải tự gia hạn
    const res = fakeRes();
    const token = forgeToken({ ...identity, rmb: true, iat: now() - 20 * 86400, exp: now() + 10 * 86400 });
    const error = await callAuth(token, res);
    check('phiên ghi nhớ quá nửa đời -> tự gia hạn', !error && res.cookies.length === 1, error?.message);
    check(
      'cookie gia hạn lại sống dài ngày',
      (res.cookies[0]?.o?.maxAge ?? 0) > 25 * 86400e3,
      `maxAge=${res.cookies[0]?.o?.maxAge}`,
    );
    check('cookie gia hạn vẫn HttpOnly + SameSite=Strict', res.cookies[0]?.o?.httpOnly === true && res.cookies[0]?.o?.sameSite === 'strict');
  }

  {
    // Phiên không ghi nhớ thì không được kéo dài vô hạn
    const res = fakeRes();
    const token = forgeToken({ ...identity, rmb: false, iat: now() - 11 * 3600, exp: now() + 3600 });
    await callAuth(token, res);
    check('phiên KHÔNG ghi nhớ thì không tự gia hạn', res.cookies.length === 0, `${res.cookies.length} cookie`);
  }

  {
    const res = fakeRes();
    const token = forgeToken({ ...identity, rmb: true, iat: now() - 100, exp: now() - 10 });
    const error = await callAuth(token, res);
    check('token hết hạn bị từ chối', error?.status === 401, `status=${error?.status}`);
  }

  {
    // Đổi mật khẩu xong thì mọi token cũ mất hiệu lực ngay
    const token = auth.signToken({ id: 'cms-admin', username: 'admin', role: 'admin' }, true);
    check('trước khi đổi mật khẩu: token dùng được', !(await callAuth(token, fakeRes())));
    await credentials.updatePassword('MatKhauKhac@2026');
    const error = await callAuth(token, fakeRes());
    check('đổi mật khẩu -> token cũ bị thu hồi', error?.status === 401, `status=${error?.status}`);
  }
} catch (error) {
  console.error('\nLỖI:', error.message);
  failed += 1;
} finally {
  cleanup();
}

console.log(`\n${failed === 0 ? '✓ PHIÊN ĐĂNG NHẬP ĐẠT' : '✗ PHIÊN ĐĂNG NHẬP CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
