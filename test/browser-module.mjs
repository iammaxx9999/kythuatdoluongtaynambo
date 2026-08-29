/**
 * Nạp một module viết cho TRÌNH DUYỆT vào Node để kiểm thử.
 *
 * Vấn đề: mã chạy trên trình duyệt import theo đường dẫn tuyệt đối của web
 * (`/assets/js/core/dom.js`) — trình duyệt hiểu là "gốc website", còn Node
 * hiểu là "gốc ổ đĩa" nên báo Cannot find module.
 *
 * Cách xử lý: đọc mã nguồn, đổi những đường dẫn kiểu web đó sang file thật,
 * rồi nạp qua data: URL. Làm đệ quy cho cả cây phụ thuộc và có nhớ đệm nên
 * một module dùng chung chỉ chạy đúng một lần.
 *
 * Cố ý KHÔNG dùng loader hook (`--import` / `module.register`) để `npm test`
 * chạy được bằng lệnh `node` trần, không cần cờ và không kén phiên bản Node.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WEB_ROOT = path.join(ROOT, 'public');

/** Bắt `from '...'` và `import '...'`, cả nháy đơn lẫn nháy kép. */
const SPEC_RE = /\b(from|import)\s+(['"])([^'"]+)\2/g;

/** Đổi một specifier trong mã nguồn thành đường dẫn tệp thật. */
const resolveSpec = (spec, fromFile) =>
  spec.startsWith('/') ? path.join(WEB_ROOT, spec) : path.resolve(path.dirname(fromFile), spec);

/**
 * Nạp module trình duyệt tại `entry` (đường dẫn tương đối so với gốc dự án).
 * @returns {Promise<object>} namespace của module, dùng như import bình thường
 */
export function importBrowserModule(entry) {
  const cache = new Map(); // đường dẫn tệp -> data: URL đã dựng

  const build = (file) => {
    const cached = cache.get(file);
    if (cached) return cached;

    // Đặt chỗ trước để cây phụ thuộc có vòng lặp cũng không chạy vô tận
    cache.set(file, null);

    let source = fs.readFileSync(file, 'utf8');
    for (const [, , , spec] of source.matchAll(SPEC_RE)) {
      if (!spec.startsWith('/') && !spec.startsWith('.')) continue; // gói npm: để Node tự lo
      const url = build(resolveSpec(spec, file));
      if (url) source = source.replaceAll(`'${spec}'`, `'${url}'`).replaceAll(`"${spec}"`, `"${url}"`);
    }

    const url = `data:text/javascript;base64,${Buffer.from(source, 'utf8').toString('base64')}`;
    cache.set(file, url);
    return url;
  };

  return import(build(path.join(ROOT, entry)));
}
