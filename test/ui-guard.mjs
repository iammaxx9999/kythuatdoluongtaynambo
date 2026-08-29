/**
 * Kiểm tra tĩnh giao diện — bắt nhóm lỗi "không bấm được vào trang".
 *
 * Chạy: npm test (chạy trước bộ e2e)
 *
 * Bối cảnh: đã từng có lỗi #product-modal phủ kín màn hình vì thuộc tính `hidden`
 * bị quy tắc `.modal { display: grid }` ghi đè. Khối "đang ẩn" vẫn chiếm toàn bộ
 * viewport và nuốt hết cú nhấp chuột. Mắt thường không thấy vì nó trong suốt.
 * Những phép kiểm tra dưới đây canh đúng loại lỗi đó.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/**
 * Hai trang dùng hai bộ CSS tách biệt và không bao giờ nạp cùng lúc.
 * Phải soi riêng từng bộ, nếu gộp lại thì các class trùng tên (ví dụ .modal)
 * sẽ đè lên nhau và cho kết quả sai.
 */
const SCOPES = {
  'trang web': [
    'public/assets/css/base.css',
    'public/assets/css/layout.css',
    'public/assets/css/components.css',
    'public/assets/css/motion.css',
  ],
  CMS: ['cms/css/admin.css'],
};

let passed = 0;
let failed = 0;

const check = (name, ok, hint = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !hint ? '' : `\n      → ${hint}`}`);
  ok ? (passed += 1) : (failed += 1);
};

/* ---------- Bóc tách CSS thô: (selector, khai báo) ---------- */
function parseRules(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean))) {
    const selector = m[1].trim().replace(/\s+/g, ' ');
    if (selector.startsWith('@')) continue;
    const decl = {};
    for (const part of m[2].split(';')) {
      const i = part.indexOf(':');
      if (i > 0) decl[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    }
    for (const one of selector.split(',')) rules.push({ selector: one.trim(), decl });
  }
  return rules;
}

/** Gộp mọi khai báo của cùng một selector, trong phạm vi một bộ CSS. */
const buildScope = (files) => {
  const map = new Map();
  for (const { selector, decl } of files.flatMap((f) => parseRules(read(f)))) {
    if (!map.has(selector)) map.set(selector, {});
    Object.assign(map.get(selector), decl);
  }
  return map;
};

const scopes = Object.fromEntries(Object.entries(SCOPES).map(([k, v]) => [k, buildScope(v)]));
const bySelector = scopes['trang web'];
const declOf = (selector, scope = bySelector) => scope.get(selector) ?? {};

const coversContainer = (d) => {
  if (d.position !== 'fixed' && d.position !== 'absolute') return false;
  if (['0', '0px'].includes((d.inset ?? '').trim())) return true;
  return ['top', 'right', 'bottom', 'left'].every((s) => ['0', '0px'].includes((d[s] ?? '').trim()));
};

/* ================= 1. Thuộc tính hidden ================= */
console.log('\n1. Thuộc tính `hidden` phải thắng mọi quy tắc display');

const base = read('public/assets/css/base.css').replace(/\/\*[\s\S]*?\*\//g, '');
check(
  'base.css có [hidden] { display: none !important }',
  /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(base),
  'Thiếu quy tắc này thì mọi class có display sẽ vô hiệu hoá thuộc tính hidden.',
);

// Phần tử mang hidden trong HTML mà class của nó lại đặt display
for (const file of ['public/index.html', 'cms/index.html']) {
  const html = read(file);
  const re = /<(\w+)([^>]*\bhidden\b[^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const classAttr = /class="([^"]*)"/.exec(m[2])?.[1] ?? '';
    const conflicts = classAttr
      .split(/\s+/)
      .filter(Boolean)
      .filter((c) => declOf(`.${c}`).display);
    check(
      `${path.basename(file)}: <${m[1]} class="${classAttr}"> ẩn được`,
      conflicts.length === 0 || /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(base),
      `class .${conflicts.join(', .')} đặt display, sẽ đè lên hidden.`,
    );
  }
}

// Phần tử được JS bật/tắt bằng .hidden
for (const cls of ['product-card', 'empty-state', 'fab__bubble']) {
  const d = declOf(`.${cls}`);
  check(
    `.${cls} ẩn được bằng thuộc tính hidden`,
    !d.display || /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(base),
    `.${cls} đặt display: ${d.display}`,
  );
}

/* ============ 2. Lớp phủ toàn màn hình ============ */
console.log('\n2. Không lớp phủ nào được âm thầm chặn chuột');

const hiddenByAttr = /\[hidden\]\s*\{[^}]*display:\s*none\s*!important/.test(base);

for (const [scopeName, scope] of Object.entries(scopes)) {
  for (const [selector, d] of scope) {
    if (d.position !== 'fixed' || !coversContainer(d)) continue;
    if (d['pointer-events'] === 'none') {
      check(`[${scopeName}] ${selector} đã tắt nhận chuột`, true);
      continue;
    }
    // Chấp nhận nếu có quy tắc đi kèm để vô hiệu hoá: [hidden] hoặc .is-hidden
    const guard = [...scope.keys()].some(
      (k) =>
        k.startsWith(selector) &&
        k !== selector &&
        (scope.get(k)['pointer-events'] === 'none' || scope.get(k).visibility === 'hidden'),
    );
    check(
      `[${scopeName}] ${selector} không chặn chuột khi đang ẩn`,
      guard || hiddenByAttr,
      'Cần pointer-events: none, hoặc phải thực sự bị display:none khi ẩn.',
    );
  }
}

/* ============ 3. Nút liên hệ nổi ============ */
console.log('\n3. Nút liên hệ nổi (CSKH)');

const fab = declOf('.fab');
const fabList = declOf('.fab__list');
const fabBubble = declOf('.fab__bubble');

check(
  '.fab chỉ to bằng cái nút',
  Boolean(fab.width && fab.height),
  '.fab không đặt kích thước -> nó giãn theo danh sách kênh và tạo vùng vô hình chặn chuột ở góc màn hình.',
);
check(
  '.fab__list neo tuyệt đối, không chiếm chỗ trong bố cục',
  fabList.position === 'absolute',
  `đang là position: ${fabList.position ?? 'static'}`,
);
check(
  '.fab__list không nhận chuột khi đóng',
  fabList['pointer-events'] === 'none',
  'danh sách kênh khi đóng vẫn là một khối trong suốt nuốt cú nhấp.',
);
check('.fab.is-open .fab__list nhận lại chuột', declOf('.fab.is-open .fab__list')['pointer-events'] === 'auto');
check(
  '.fab__bubble neo vào nút (không trôi tự do)',
  fabBubble.position === 'absolute' && Boolean(fabBubble.bottom),
  'bong bóng phải neo ngay phía trên nút, nếu không nó sẽ tách rời khỏi nút.',
);
check(
  '.fab__bubble có mũi nhọn chỉ vào nút',
  Boolean(declOf('.fab__bubble::after').content !== undefined),
);
check(
  'bong bóng có kiểu nền kính mờ',
  Boolean(declOf('.fab__bubble--glass')['backdrop-filter']),
  'thiếu backdrop-filter cho kiểu glass',
);
check(
  'kiểu kính mờ có phương án dự phòng cho trình duyệt cũ',
  read('public/assets/css/components.css').includes('@supports not ((backdrop-filter'),
  'trình duyệt không hỗ trợ backdrop-filter sẽ thấy chữ trên nền trong suốt, khó đọc.',
);
check('bong bóng chỉ nhận chuột khi đang hiện', declOf('.fab.has-bubble .fab__bubble')['pointer-events'] === 'auto');
check(
  'bong bóng ẩn đi khi danh sách kênh bung ra',
  declOf('.fab.is-open .fab__bubble').display === 'none',
  'không thì bong bóng và danh sách kênh chồng lên nhau.',
);

/* ============ 4. Thứ tự lớp ============ */
console.log('\n4. Thứ tự chồng lớp hợp lý');

const z = (sel) => Number.parseInt(declOf(sel)['z-index'] ?? '0', 10) || 0;
check('cửa sổ chi tiết nằm trên nút liên hệ nổi', z('.modal') > z('.fab'), `${z('.modal')} vs ${z('.fab')}`);
check('màn hình chờ nằm trên tất cả', z('.site-loader') > z('.modal'), `${z('.site-loader')} vs ${z('.modal')}`);
check('header nằm dưới cửa sổ chi tiết', z('.site-header') < z('.modal'));
check('thông báo (toast) không chặn chuột', declOf('.toast-root')['pointer-events'] === 'none');

/* ====== 5. Khối tự chạy không được cuộn trang ====== */
console.log('\n5. Slideshow tự chạy không được kéo trang');

/**
 * scrollIntoView() cuộn MỌI khung cha, kể cả chính trang. Đặt trong một khối
 * tự đổi ảnh theo hẹn giờ (hero, bộ sưu tập) thì cứ vài giây trang lại tự nhảy
 * về khối đó, dù người xem đang đọc phần khác. Muốn kéo dải ảnh nhỏ thì gọi
 * scrollBy() trên đúng phần tử cuộn.
 */
const AUTOPLAY_FILES = [
  'public/assets/js/components/gallery.js',
  'public/assets/js/components/hero.js',
  'public/assets/js/components/products.js',
  'public/assets/js/components/sections.js',
];

for (const file of AUTOPLAY_FILES) {
  const src = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
  check(
    `${path.basename(file)} không gọi scrollIntoView`,
    !src.includes('.scrollIntoView('),
    'scrollIntoView cuộn cả trang -> mỗi lần đổi ảnh là trang tự nhảy về khối này.',
  );
}

const gallerySrc = read('public/assets/js/components/gallery.js');
check(
  'bộ sưu tập kéo dải ảnh nhỏ bằng scrollBy trên đúng khung cuộn',
  /thumbTrack\.scrollBy\(/.test(gallerySrc),
  'thiếu cách kéo dải ảnh nhỏ mà không đụng tới vị trí cuộn của trang.',
);
check(
  'chỉ kéo khi dải ảnh nhỏ thực sự tràn',
  /scrollWidth\s*<=\s*thumbTrack\.clientWidth/.test(gallerySrc),
  'dải ảnh vừa đủ chỗ mà vẫn gọi cuộn thì thừa, dễ gây giật.',
);

/* ====== 6. Biểu tượng đổi được qua CMS ====== */
console.log('\n6. Biểu tượng phương thức liên hệ');

const iconsSrc = read('public/assets/js/core/icons.js');
const schemasSrc = read('cms/js/views/schemas.js');

// Tên icon trong ô chọn của CMS phải có thật trong kho icon, không thì chọn xong ra ô trống.
// Chỉ soi đúng hai khối khai báo, không quét cả tệp - trong tệp còn nhiều select khác.
const blockOf = (src, name, open, close) => src.split(`const ${name} = ${open}`)[1]?.split(close)[0] ?? '';

const available = new Set(
  [...blockOf(iconsSrc, 'PATHS', '{', '\n};').matchAll(/(?:^|\n)\s{2}(\w+):/g)].map((m) => m[1]),
);
const offered = [...blockOf(schemasSrc, 'ICON_OPTIONS', '[', '\n];').matchAll(/value: '(\w+)'/g)].map((m) => m[1]);
const missing = offered.filter((name) => !available.has(name));
check(
  `${offered.length} biểu tượng trong ô chọn đều có thật trong kho icon`,
  missing.length === 0,
  `không tìm thấy: ${missing.join(', ')}`,
);

check(
  'kho icon xuất hàm dùng được ảnh riêng',
  /export const iconOrImage/.test(iconsSrc),
  'thiếu iconOrImage() -> không thay biểu tượng bằng ảnh tải lên được.',
);
check(
  'ảnh riêng dựng bằng <img>, không nhúng thẳng SVG',
  /iconOrImage[\s\S]{0,600}<img class="icon icon--img/.test(iconsSrc) && !/innerHTML[\s\S]{0,80}imageUrl/.test(iconsSrc),
  'tệp .svg tải lên có thể chứa <script>; nhúng thẳng vào trang là lỗ hổng XSS.',
);
check(
  'ảnh riêng phải qua safeUrl',
  /const url = safeUrl\(imageUrl\)/.test(iconsSrc),
  'thiếu lọc thì javascript:… nhét vào ô đường dẫn sẽ chạy được.',
);

for (const [file, label] of [
  ['public/assets/js/components/floating-contact.js', 'nút liên hệ nổi'],
  ['public/assets/js/components/contact.js', 'khối thông tin liên hệ'],
]) {
  check(`${label} dùng iconOrImage (nhận được ảnh riêng)`, read(file).includes('iconOrImage('));
}

check(
  'khối liên hệ đọc biểu tượng từ dữ liệu, không cắm cứng',
  /icons\.address \|\| 'pin'/.test(read('public/assets/js/components/contact.js')),
  'cắm cứng thì đổi trong CMS không có tác dụng.',
);
check(
  'CMS có loại ô "icon" kèm hình xem trước',
  read('cms/js/core/form.js').includes('data-icon-preview-for'),
);
check('CSS có .icon--img giữ tỉ lệ ảnh', Boolean(declOf('.icon--img')['object-fit']), 'thiếu -> logo tải lên bị kéo méo.');
check('CSS trang quản trị có ô chọn biểu tượng', Boolean(declOf('.icon-field', scopes.CMS).display));

/* ====== 7. Tên thương hiệu đặt một chỗ ====== */
console.log('\n7. Ký tự đại diện {brand} không được lọt ra trang');

/**
 * Mọi đường vào state của trang web phải đi qua apply() - nơi duy nhất gọi
 * resolveSite(). Nếu sau này ai đó gán thẳng `state = ...` thì nhánh đó sẽ
 * hiện đúng chữ "{brand}" cho khách đọc.
 */
const storeSrc = read('public/assets/js/core/store.js').replace(/\/\*[\s\S]*?\*\//g, '');
const directAssign = [...storeSrc.matchAll(/^\s*state = (.+)$/gm)].map((m) => m[1].trim());

check(
  'store.js chỉ đặt state qua một cửa duy nhất',
  directAssign.length === 1 && directAssign[0].startsWith('resolveSite('),
  `gán trực tiếp: ${directAssign.join(' | ')} — phải đi qua apply()/resolveSite()`,
);
check('store.js có nạp bộ thay ký tự đại diện', storeSrc.includes("from './tokens.js'"));

// CMS thì NGƯỢC LẠI: phải giữ nguyên {brand} để người dùng còn sửa được
for (const file of ['cms/js/app.js', 'cms/js/core/section-view.js']) {
  check(
    `${path.basename(file)} không tự thay ký tự đại diện (CMS phải sửa được chữ gốc)`,
    !read(file).includes('resolveSite'),
    'thay sớm ở CMS thì bấm Lưu là ghi đè mất {brand} trong dữ liệu.',
  );
}

check(
  'CMS có nhắc người dùng về {brand}',
  read('cms/js/views/schemas.js').includes('TOKEN_HINT'),
  'không nhắc thì không ai biết là gõ được.',
);

/* ====== 8. Listener gắn ngoài component phải dọn được ====== */
console.log('\n8. Listener trên document/window không được nhân bản');

/**
 * `render()` chỉ thay innerHTML nên listener gắn trên `document`/`window` (và
 * trên chính phần tử gốc của khối) sống sót qua mọi lần vẽ lại. Không dọn thì
 * mỗi lần trang tự cập nhật nội dung lại chồng thêm một bộ, và những bản cũ vẫn
 * chạy hẹn giờ rồi vẽ vào DOM đã bị bỏ — trang trông như đứng.
 *
 * Hai cách hợp lệ: cờ "chỉ gắn một lần", hoặc trả về hàm dọn dẹp và gọi nó
 * trước khi gắn bộ mới.
 */
const GLOBAL_LISTENER_FILES = [
  'public/assets/js/components/hero.js',
  'public/assets/js/components/header.js',
  'public/assets/js/components/floating-contact.js',
  'public/assets/js/components/products.js',
];

for (const file of GLOBAL_LISTENER_FILES) {
  const src = read(file).replace(/\/\*[\s\S]*?\*\//g, '');
  const bindsGlobal = /(document|window)\.addEventListener/.test(src);
  if (!bindsGlobal) {
    check(`${path.basename(file)} không gắn listener toàn cục`, true);
    continue;
  }
  const hasTeardown = /removeEventListener/.test(src);
  // Quy ước trong project: cờ "chỉ gắn một lần" đặt tên kết thúc bằng ...Bound
  const hasOnceFlag = /\blet\s+\w*Bound\b/.test(src);
  check(
    `${path.basename(file)} có cách chống nhân bản listener`,
    hasTeardown || hasOnceFlag,
    'cần cờ "gắn một lần" hoặc hàm dọn dẹp gọi removeEventListener.',
  );
}

const heroSrc = read('public/assets/js/components/hero.js');
check(
  'hero gọi dọn dẹp trước khi vẽ lại',
  /teardown\?\.\(\)/.test(heroSrc),
  'thiếu thì mỗi lần cập nhật nội dung lại thêm một hẹn giờ chạy song song.',
);
/**
 * Slideshow đầu trang phải LUÔN chạy. Mọi cơ chế "tạm dừng vì con trỏ / vì tiêu
 * điểm" đều đã gây kẹt vĩnh viễn ít nhất một lần, nên cấm hẳn:
 *
 *  - mouseenter/mouseleave: mouseleave không bắn khi cuộn trang mà chuột đứng yên.
 *  - focusin/focusout: bấm một đầu chấm thì nút đó GIỮ tiêu điểm sau cú bấm,
 *    focusout không bao giờ bắn -> đứng hẳn.
 *
 * Chỉ còn hai lý do hợp lệ: người dùng bấm nút Tạm dừng, và tab bị ẩn.
 */
const heroCode = heroSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

for (const [event, why] of [
  ['mouseenter', 'mouseleave không bắn khi cuộn trang mà chuột đứng yên'],
  ['mouseleave', 'cùng lý do trên'],
  ['mouseover', 'theo dõi con trỏ để tạm dừng đều đã gây kẹt'],
  ['focusin', 'nút giữ tiêu điểm sau cú bấm -> focusout không bao giờ bắn'],
  ['focusout', 'cùng lý do trên'],
]) {
  check(
    `hero không tạm dừng theo '${event}'`,
    !new RegExp(`addEventListener\\('${event}'`).test(heroCode),
    why,
  );
}

check(
  'hero không dò vị trí con trỏ nữa',
  !/elementFromPoint/.test(heroCode),
  'đã bỏ hẳn cơ chế tạm dừng khi rê chuột.',
);
check(
  'chỉ còn hai lý do dừng: người dùng bấm, và tab bị ẩn',
  /!stoppedByUser && !tabHidden/.test(heroCode),
  'thêm lý do nào nữa là mở lại cửa cho lỗi kẹt.',
);
check(
  'vẫn nghỉ khi tab bị ẩn',
  /addEventListener\('visibilitychange'/.test(heroCode),
  'chạy nền khi không ai xem chỉ tốn pin.',
);
check(
  'vẫn còn nút Tạm dừng cho người xem chủ động dừng',
  /data-hero-toggle/.test(read('public/assets/js/components/hero.js')),
  'cần có cách dừng thủ công (WCAG 2.2.2) khi đã bỏ tạm dừng tự động.',
);

/* ====== 9. Bảo trì không được tự khoá mình ra ngoài ====== */
console.log('\n9. Chế độ bảo trì');

/**
 * Rủi ro chết người của tính năng này: chặn nhầm cả đường vào CMS. Bật bảo trì
 * xong thì không còn cửa nào để tắt, phải vào SSH sửa tay db.json.
 */
const guardSrc = read('server/middleware/maintenance.js');

check(
  'luôn cho qua đường dẫn CMS',
  /config\.cmsPath/.test(guardSrc),
  'không chừa CMS thì bật bảo trì xong không tắt được nữa.',
);
check(
  'luôn cho qua /api/auth (để còn đăng nhập)',
  guardSrc.includes("'/api/auth/'"),
  'hết phiên giữa lúc bảo trì là mất luôn quyền vào CMS.',
);
check('luôn cho qua tệp tĩnh (trang bảo trì cần logo)', /\/assets\/|\/uploads\//.test(guardSrc));
check(
  '/healthz không bị chặn',
  guardSrc.includes('/healthz'),
  'chặn thì monitoring và script deploy tưởng server chết.',
);
check(
  'trả mã 503 chứ không phải 200',
  /status\(503\)/.test(guardSrc),
  '200 kèm chữ "đang bảo trì" -> Google coi đó là nội dung thật và hạ thứ hạng.',
);
check(
  'có Retry-After',
  /Retry-After/i.test(guardSrc),
  'thiếu thì bot không biết bao giờ quay lại.',
);
check(
  'trang bảo trì không được cache',
  /no-store/.test(guardSrc),
  'tắt bảo trì rồi khách vẫn thấy trang bảo trì cho tới khi tự xoá cache.',
);
check(
  'người đã đăng nhập vẫn gọi được API',
  /req\.user/.test(guardSrc),
  'chặn cả API của người đã đăng nhập thì CMS tê liệt, không sửa được gì.',
);

// Cổng bảo trì phải đứng TRƯỚC mọi thứ phục vụ nội dung
const appSrc = read('server/app.js');
check(
  'cổng bảo trì đặt trước phần phục vụ trang',
  appSrc.indexOf('maintenanceGuard') < appSrc.indexOf("app.use('/api', apiRoutes)"),
  'đặt sau thì nội dung thật vẫn ra ngoài qua API.',
);
check(
  'đọc cookie phiên trước cổng bảo trì',
  appSrc.indexOf('app.use(optionalAuth)') < appSrc.indexOf('app.use(maintenanceGuard)'),
  'không thì cổng bảo trì không biết ai đã đăng nhập.',
);

// Trang bảo trì phải thoát HTML, vì nội dung do người dùng gõ trong CMS
const pageSrc = read('server/lib/maintenance-page.js');
check('trang bảo trì có thoát HTML', /const esc =/.test(pageSrc));
check(
  'tiêu đề và lời nhắn đều đi qua esc()',
  /esc\(title\)/.test(pageSrc) && /esc\(message\)/.test(pageSrc),
  'người gõ thẻ <script> vào ô lời nhắn là chạy được.',
);
check(
  'màu thương hiệu chỉ nhận mã hex',
  /safeColor/.test(pageSrc),
  'màu nhét thẳng vào <style>, không lọc là chèn được CSS lạ.',
);

check(
  'CMS có dải cảnh báo khi đang bảo trì',
  read('cms/js/app.js').includes('maintenanceBanner'),
  'không nhắc thì rất dễ quên tắt, website đóng cửa hàng ngày trời.',
);
check('CSS có dải cảnh báo', Boolean(declOf('.alert-bar', scopes.CMS).display));

/* ====== 10. Thanh header đủ thoáng ====== */
console.log('\n10. Khoảng cách trên thanh header');

/**
 * Bộ bóc tách CSS ở đầu tệp gộp mọi khai báo cùng selector, kể cả các quy tắc
 * nằm trong @media. Với khoảng cách header thì gộp như vậy cho kết quả SAI:
 * bản cho điện thoại (`gap: 2px`, menu xếp dọc) sẽ đè lên bản cho màn hình lớn.
 * Nên ở mục này phải cắt bỏ hẳn các khối @media rồi mới đọc.
 */
const stripMedia = (css) => {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf('@media', i);
    if (at < 0) {
      out += css.slice(i);
      break;
    }
    out += css.slice(i, at);

    // Nhảy tới dấu { mở khối rồi đếm ngoặc để tìm đúng dấu } đóng của nó
    let cursor = css.indexOf('{', at);
    if (cursor < 0) break;
    let depth = 1;
    cursor += 1;
    while (cursor < css.length && depth > 0) {
      if (css[cursor] === '{') depth += 1;
      else if (css[cursor] === '}') depth -= 1;
      cursor += 1;
    }
    i = cursor;
  }
  return out;
};

const baseScope = new Map();
for (const file of SCOPES['trang web']) {
  for (const { selector, decl } of parseRules(stripMedia(read(file)))) {
    if (!baseScope.has(selector)) baseScope.set(selector, {});
    Object.assign(baseScope.get(selector), decl);
  }
}
const baseDeclOf = (selector) => baseScope.get(selector) ?? {};

/**
 * Lấy giá trị LỚN NHẤT của một khai báo, hiểu được clamp().
 * clamp(6px, 1.1vw, 14px) -> 14. Số thường '16px' -> 16.
 */
const maxPx = (value) => {
  const raw = String(value ?? '').trim();
  const clampArgs = /^clamp\(([^)]*)\)$/.exec(raw)?.[1];
  const source = clampArgs ? clampArgs.split(',').pop() : raw;
  return Number.parseFloat(source) || 0;
};
/** Giá trị NHỎ NHẤT — dùng để canh màn hình hẹp cũng không bị dính nhau. */
const minPx = (value) => {
  const raw = String(value ?? '').trim();
  const clampArgs = /^clamp\(([^)]*)\)$/.exec(raw)?.[1];
  const source = clampArgs ? clampArgs.split(',')[0] : raw;
  return Number.parseFloat(source) || 0;
};

const navList = baseDeclOf('.site-nav__list');
const navLink = baseDeclOf('.site-nav__link');
const headerInner = baseDeclOf('.site-header__inner');

check(
  `khe giữa hai mục menu đủ rộng (tối đa ${maxPx(navList.gap)}px)`,
  maxPx(navList.gap) >= 12,
  'khe hẹp quá thì các nền bo tròn khi rê chuột gần dính vào nhau, nhìn như một dải liền.',
);
check(
  `màn hẹp vẫn còn khe (tối thiểu ${minPx(navList.gap)}px)`,
  minPx(navList.gap) >= 6,
  'co xuống 0 là hai mục chạm nhau.',
);
check(
  `đệm trong mỗi mục đủ rộng (tối đa ${maxPx(navLink['padding-inline'])}px)`,
  maxPx(navLink['padding-inline']) >= 16,
);
check(
  `khe giữa logo · menu · nút phải (tối đa ${maxPx(headerInner.gap)}px)`,
  maxPx(headerInner.gap) >= 28,
);
check(
  'khoảng cách co giãn theo bề ngang màn hình',
  /clamp\(/.test(navList.gap ?? '') && /clamp\(/.test(navLink['padding-inline'] ?? ''),
  'để số cứng thì màn hẹp bị tràn hàng, màn rộng lại trống trải.',
);

/**
 * Vùng bấm phải đủ lớn cho ngón tay. WCAG khuyến nghị tối thiểu 44×44px;
 * chiều cao 40px + khoảng đệm quanh là đạt trên thực tế, nhưng đừng thấp hơn.
 */
check(
  `mỗi mục cao ${Number.parseFloat(navLink.height) || 0}px, đủ để bấm bằng ngón tay`,
  (Number.parseFloat(navLink.height) || 0) >= 40,
);

console.log(`\n${failed === 0 ? '✓ GIAO DIỆN ĐẠT' : '✗ GIAO DIỆN CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
