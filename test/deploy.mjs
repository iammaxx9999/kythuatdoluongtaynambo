/**
 * Kiểm thử cấu hình triển khai.
 *
 * Chạy: npm test (hoặc npm run test:deploy)
 *
 * Đây là loại lỗi không bộ test nào khác bắt được: từng tệp đọc lên đều đúng,
 * nhưng ghép lại thì lệch nhau — Nginx trỏ cổng 3001 trong khi app mở 3000,
 * Nginx chặn tệp 8MB trong khi app cho phép 15MB, tệp mẫu .env lại bị
 * .gitignore ăn mất nên đẩy lên host thì không có. Toàn bộ đều chỉ lộ ra lúc
 * đang triển khai thật, giữa đêm.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { importBrowserModule } from './browser-module.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const dataDir = mkdtempSync(path.join(tmpdir(), 'website-deploy-'));
process.env.DATA_DIR = dataDir;

let passed = 0;
let failed = 0;

const check = (name, ok, hint = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !hint ? '' : `\n      → ${hint}`}`);
  ok ? (passed += 1) : (failed += 1);
};

try {
  /* ============ 1. Hai bản sao của quy tắc địa chỉ phải khớp ============ */
  console.log('\n1. Server và trình duyệt hiểu địa chỉ website giống nhau');

  const { normalizeSiteUrl } = await import('../server/lib/helpers.js');
  const { originUrl } = await importBrowserModule('public/assets/js/core/dom.js');

  // Cùng một bảng dữ liệu, chạy qua cả hai bên. Sửa một bên mà quên bên kia
  // thì nút "Xem website" và sitemap sẽ trỏ hai nơi khác nhau.
  const CASES = [
    ['https://vidu.com', 'https://vidu.com'],
    ['https://vidu.com/', 'https://vidu.com'],
    ['https://vidu.com///', 'https://vidu.com'],
    ['http://vidu.com', 'http://vidu.com'],
    ['https://vidu.com:8443', 'https://vidu.com:8443'],
    ['  https://vidu.com  ', 'https://vidu.com'],
    ['vidu.com', ''], // thiếu giao thức -> không dùng được làm địa chỉ tuyệt đối
    ['//vidu.com', ''],
    ['/', ''],
    ['ftp://vidu.com', ''],
    ['javascript:alert(1)', ''],
    ['', ''],
    [null, ''],
    [undefined, ''],
  ];

  let mismatch = [];
  for (const [input, expected] of CASES) {
    const fromServer = normalizeSiteUrl(input);
    const fromBrowser = originUrl(input);
    if (fromServer !== expected || fromBrowser !== expected) {
      mismatch.push(`${JSON.stringify(input)}: server=${JSON.stringify(fromServer)} trình duyệt=${JSON.stringify(fromBrowser)} cần=${JSON.stringify(expected)}`);
    }
  }
  check(`${CASES.length} trường hợp địa chỉ cho kết quả giống nhau`, mismatch.length === 0, mismatch.join('\n      → '));

  // Ký tự điều khiển nhét giữa giao thức là mẹo cũ để lách bộ lọc
  check(
    'chặn ký tự điều khiển giấu trong địa chỉ',
    normalizeSiteUrl('http:\n//vidu.com/') === 'http://vidu.com' || normalizeSiteUrl('http:\n//vidu.com/') === '',
    `nhận: ${JSON.stringify(normalizeSiteUrl('http:\n//vidu.com/'))}`,
  );

  /* ============ 2. Biến môi trường vào tới config ============ */
  console.log('\n2. Biến môi trường được đọc đúng');

  process.env.SITE_URL = 'https://tenmien-thu.com/';
  const { config } = await import('../server/config.js');
  check('SITE_URL vào config và bỏ dấu / cuối', config.siteUrl === 'https://tenmien-thu.com', config.siteUrl);
  check('cổng mặc định là 3000', config.port === 3000 || Boolean(process.env.PORT), String(config.port));

  /* ============ 3. Tệp triển khai có mặt ============ */
  console.log('\n3. Tệp triển khai đầy đủ');

  const DEPLOY_FILES = [
    'deploy/nginx.conf',
    'deploy/ecosystem.config.cjs',
    'deploy/deploy.sh',
    'deploy/backup.sh',
    'deploy/.env.production.example',
    '.env.example',
  ];
  for (const file of DEPLOY_FILES) check(`có ${file}`, exists(file));

  /* ============ 4. Các tệp khớp nhau ============ */
  console.log('\n4. Nginx và app khớp cấu hình');

  const nginx = read('deploy/nginx.conf');
  const envProd = read('deploy/.env.production.example');

  const nginxPort = Number(/proxy_pass\s+http:\/\/127\.0\.0\.1:(\d+)/.exec(nginx)?.[1]);
  const envPort = Number(/^PORT=(\d+)/m.exec(envProd)?.[1]);
  check(`Nginx trỏ đúng cổng app đang mở (${nginxPort} vs ${envPort})`, nginxPort === envPort);

  // Nginx chặn theo dung lượng TRƯỚC khi request tới app. Nginx nhỏ hơn app
  // thì khách chỉ thấy lỗi 413 khô khan, không thấy thông báo tiếng Việt.
  const nginxMaxMb = Number(/client_max_body_size\s+(\d+)m/i.exec(nginx)?.[1]);
  const appMaxMb = Number(/^UPLOAD_MAX_MB=(\d+)/m.exec(envProd)?.[1]);
  check(
    `Nginx cho tệp to hơn app (${nginxMaxMb}MB > ${appMaxMb}MB)`,
    nginxMaxMb > appMaxMb,
    'Nginx phải rộng hơn, nếu không nó chặn trước và app không kịp báo lỗi tử tế.',
  );

  check(
    'Nginx chuyển tiếp X-Forwarded-Proto',
    /proxy_set_header\s+X-Forwarded-Proto/i.test(nginx),
    'thiếu thì app tưởng đang chạy HTTP và sinh sai địa chỉ trong sitemap.',
  );
  check('Nginx chuyển tiếp X-Forwarded-For', /proxy_set_header\s+X-Forwarded-For/i.test(nginx));
  check('Nginx chuyển tiếp Host', /proxy_set_header\s+Host/i.test(nginx));

  /* ============ 5. Mẫu .env production đặt đúng ============ */
  console.log('\n5. Mẫu .env cho production');

  check('NODE_ENV=production', /^NODE_ENV=production$/m.test(envProd), 'thiếu thì cookie phiên không có cờ Secure.');
  check(
    'TRUST_PROXY=1 (vì chạy sau Nginx)',
    /^TRUST_PROXY=1$/m.test(envProd),
    'để trống thì mọi khách mang IP 127.0.0.1, một người sai mật khẩu là khóa cả nhà.',
  );
  check(
    'CMS_PATH đã đổi khỏi /cms',
    !/^CMS_PATH=\/cms$/m.test(envProd),
    'để mặc định thì bot dò đúng cửa quản trị.',
  );
  check('SITE_URL không có dấu / ở cuối', !/^SITE_URL=\S*\/$/m.test(envProd));

  /* ============ 6. Không lộ bí mật ============ */
  console.log('\n6. Tệp đưa lên git không chứa bí mật');

  /**
   * Tìm bí mật THẬT, không tìm tên trường.
   * README có quyền nhắc chữ "passwordHash" để hướng dẫn; cái không được phép
   * là giá trị băm đầy đủ, mật khẩu bản rõ, hay khóa riêng.
   */
  const secretPattern = /0000@0000|\$2[aby]\$\d\d\$[./A-Za-z0-9]{20,}|BEGIN [A-Z ]*PRIVATE KEY/;
  for (const file of [...DEPLOY_FILES, 'README.md', 'package.json']) {
    if (!exists(file)) continue;
    check(`${file} không chứa mật khẩu / khóa`, !secretPattern.test(read(file)));
  }
  check(
    'mẫu .env để trống ADMIN_PASSWORD',
    /^ADMIN_PASSWORD=$/m.test(envProd),
    'tệp mẫu được commit lên git, điền mật khẩu vào là lộ.',
  );

  /* ============ 7. .gitignore đúng cả hai chiều ============ */
  console.log('\n7. .gitignore giữ đúng thứ cần giữ');

  const ignore = read('.gitignore');
  for (const [pattern, why] of [
    ['.env', 'chứa bí mật'],
    ['server/data/credentials.json', 'chứa mật khẩu đã băm'],
    ['server/data/.jwt-secret', 'khóa ký phiên'],
    ['server/data/db.json', 'nội dung thật của khách'],
    ['public/uploads/*', 'ảnh khách tải lên'],
  ]) {
    check(`bỏ qua ${pattern} (${why})`, ignore.split('\n').some((line) => line.trim() === pattern));
  }

  // Chiều ngược lại: tệp MẪU phải được đưa lên. Quy tắc `.env.*` so theo tên
  // tệp nên nó ăn luôn deploy/.env.production.example -> phải mở lại tay.
  check(
    'KHÔNG bỏ qua deploy/.env.production.example',
    ignore.includes('!deploy/.env.production.example'),
    'bị bỏ qua thì đẩy lên host sẽ không có tệp mẫu này.',
  );

  /* ============ 8. PM2: một tiến trình ============ */
  console.log('\n8. PM2 chỉ chạy một tiến trình');

  const pm2 = read('deploy/ecosystem.config.cjs');
  check(
    'instances: 1',
    /instances:\s*1\b/.test(pm2),
    'dữ liệu nằm trong db.json — nhiều tiến trình cùng ghi sẽ đè mất nội dung.',
  );
  check('exec_mode: fork (không cluster)', /exec_mode:\s*'fork'/.test(pm2));
  check(
    'watch: false',
    /watch:\s*false/.test(pm2),
    'bật watch thì mỗi lần CMS lưu là db.json đổi -> app tự khởi động lại liên tục.',
  );
  check('có mốc khởi động lại khi tràn bộ nhớ', /max_memory_restart/.test(pm2));

  /* ============ 9. Script shell chạy được ============ */
  console.log('\n9. Script shell an toàn');

  for (const file of ['deploy/deploy.sh', 'deploy/backup.sh']) {
    const src = read(file);
    check(`${path.basename(file)} có shebang`, src.startsWith('#!/usr/bin/env bash'));
    check(
      `${path.basename(file)} dừng ngay khi có lỗi (set -euo pipefail)`,
      /^set -euo pipefail$/m.test(src),
      'thiếu thì một bước lỗi vẫn chạy tiếp các bước sau.',
    );
  }
  check(
    'deploy.sh sao lưu TRƯỚC khi lấy code mới',
    read('deploy/deploy.sh').indexOf('backup.sh') < read('deploy/deploy.sh').indexOf('git pull'),
    'lấy code mới trước thì lỗi xong không còn bản nào để lùi về.',
  );
  check('deploy.sh kiểm tra lại app sau khi khởi động', read('deploy/deploy.sh').includes('/healthz'));

  /* ============ 10. README nói đúng sự thật ============ */
  console.log('\n10. README khớp với thực tế');

  /**
   * README từng lệch: ghi "7 bộ / 161 phép" trong khi đã có 12 bộ, và ghi
   * "Bốn cái bẫy" trong khi bên dưới liệt kê năm cái. Tài liệu sai còn tệ hơn
   * không có tài liệu — người đọc tin vào nó rồi làm sai. Vài phép dưới đây bắt
   * đúng loại lệch có thể kiểm bằng máy.
   */
  const readme = read('README.md');
  const pkg = JSON.parse(read('package.json'));

  const suiteCount = (pkg.scripts.test.match(/node test\//g) ?? []).length;
  const claimed = Number(/npm test\s+#\s*(\d+)\s*bộ/.exec(readme)?.[1]);
  check(
    `README ghi ${claimed} bộ test, thực tế ${suiteCount}`,
    claimed === suiteCount,
    'sửa con số trong README, hoặc thêm bộ mới vào script "test".',
  );

  // Mọi lệnh `npm run test:x` nhắc trong README phải có thật
  const mentioned = [...readme.matchAll(/npm run (test:[\w-]+)/g)].map((m) => m[1]);
  const missing = [...new Set(mentioned)].filter((name) => !pkg.scripts[name]);
  check('mọi lệnh test nhắc trong README đều tồn tại', missing.length === 0, missing.join(', '));

  // Và ngược lại: có bộ chạy riêng mà README không nhắc thì người ta không biết mà dùng
  const scripts = Object.keys(pkg.scripts).filter((n) => n.startsWith('test:'));
  const unmentioned = scripts.filter((name) => !mentioned.includes(name));
  check('mọi bộ test đều được nhắc trong README', unmentioned.length === 0, unmentioned.join(', '));

  // Tệp README trỏ tới phải có thật
  const linked = [...readme.matchAll(/\]\((?!http)([^)#][^)]*)\)/g)].map((m) => m[1]);
  const broken = linked.filter((target) => !exists(target));
  check(`${linked.length} liên kết tới tệp trong README đều còn sống`, broken.length === 0, broken.join(', '));

  // Đường dẫn tệp nhắc trong README (dạng `deploy/...`) phải tồn tại
  const paths = [...readme.matchAll(/`((?:deploy|server|public|cms|test|docs)\/[\w./-]+)`/g)].map((m) => m[1]);
  const gone = [...new Set(paths)].filter((p) => !exists(p));
  check(`${new Set(paths).size} đường dẫn tệp nhắc trong README đều tồn tại`, gone.length === 0, gone.join(', '));

  check(
    'README không còn để lộ mật khẩu',
    !secretPattern.test(readme),
    'tệp này nằm trong git, ai clone cũng đọc được.',
  );
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

console.log(`\n${failed === 0 ? '✓ TRIỂN KHAI ĐẠT' : '✗ TRIỂN KHAI CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
