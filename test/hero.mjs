/**
 * Kiểm thử slideshow đầu trang: phải LUÔN chạy.
 *
 * Chạy: npm test (hoặc npm run test:hero)
 *
 * Khoá lại hai lỗi đã xảy ra, cùng một triệu chứng "rê chuột vào rồi ra là đứng
 * hẳn" nhưng khác nguyên nhân:
 *
 *  1. Code đầu tiên tin vào cặp `mouseenter` / `mouseleave`. Trình duyệt chỉ bắn
 *     `mouseleave` khi con trỏ DI CHUYỂN ra khỏi phần tử — cuộn trang mà chuột
 *     đứng yên thì nó không bao giờ bắn.
 *  2. Bản sửa sau đó vẫn dừng khi có nút bên trong được chọn. Bấm một đầu chấm
 *     rồi đưa chuột ra thì nút đó VẪN GIỮ tiêu điểm, nên lý do "focus" không bao
 *     giờ được gỡ — slideshow đứng vĩnh viễn.
 *
 * Nay chỉ còn hai lý do được phép dừng: người dùng bấm nút Tạm dừng, và tab bị
 * ẩn. Rê chuột, bấm chuột, tiêu điểm bàn phím — không cái nào dừng được nữa.
 *
 * Test dựng DOM giả có mô hình sự kiện thật và đồng hồ điều khiển được, nên mô
 * phỏng đúng những tình huống trên.
 */

import { importBrowserModule } from './browser-module.mjs';

let passed = 0;
let failed = 0;

const check = (name, ok, hint = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !hint ? '' : `  (${hint})`}`);
  ok ? (passed += 1) : (failed += 1);
};

/* ===================== DOM giả ===================== */

const makeNode = (tag = 'div', attrs = {}) => {
  const classes = new Set((attrs.class ?? '').split(/\s+/).filter(Boolean));
  const node = {
    tagName: tag.toUpperCase(),
    dataset: { ...(attrs.dataset ?? {}) },
    children: [],
    parent: null,
    innerHTML: '',
    complete: false,
    naturalWidth: 0,
    attrs: {},
    listeners: new Map(),
    style: { setProperty() {} },

    classList: {
      add: (...names) => names.forEach((n) => classes.add(n)),
      remove: (...names) => names.forEach((n) => classes.delete(n)),
      contains: (n) => classes.has(n),
      toggle: (n, force) => {
        const on = force === undefined ? !classes.has(n) : Boolean(force);
        on ? classes.add(n) : classes.delete(n);
        return on;
      },
      get value() {
        return [...classes].join(' ');
      },
    },

    setAttribute(name, value) {
      node.attrs[name] = String(value);
    },
    getAttribute(name) {
      return node.attrs[name] ?? null;
    },

    addEventListener(type, handler) {
      if (!node.listeners.has(type)) node.listeners.set(type, []);
      node.listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      const list = node.listeners.get(type) ?? [];
      const at = list.indexOf(handler);
      if (at >= 0) list.splice(at, 1);
    },
    countListeners(type) {
      return (node.listeners.get(type) ?? []).length;
    },

    contains(other) {
      let cursor = other;
      while (cursor) {
        if (cursor === node) return true;
        cursor = cursor.parent;
      }
      return false;
    },

    append(...kids) {
      for (const kid of kids) {
        kid.parent = node;
        node.children.push(kid);
      }
      return node;
    },

    /** Duyệt cả cây con để tìm theo selector rất hạn chế (đủ cho hero.js). */
    querySelectorAll(selector) {
      const out = [];
      const walk = (n) => {
        for (const kid of n.children) {
          if (matches(kid, selector)) out.push(kid);
          walk(kid);
        }
      };
      walk(node);
      return out;
    },
    querySelector(selector) {
      return node.querySelectorAll(selector)[0] ?? null;
    },
  };
  return node;
};

/** Chỉ hỗ trợ đúng những selector hero.js dùng. */
function matches(node, selector) {
  if (selector === '[data-slide]') return node.dataset.slide !== undefined;
  if (selector === '[data-dot]') return node.dataset.dot !== undefined;
  if (selector === '[data-hero-toggle]') return node.dataset.heroToggle !== undefined;
  if (selector === '.hero__stage') return node.classList.contains('hero__stage');
  if (selector === 'img:not([data-no-fade])') return node.tagName === 'IMG';
  return false;
}

/** Bắn sự kiện: chạy handler trên target rồi nổi bọt lên các cha. */
const fire = (target, type, extra = {}) => {
  let cursor = target;
  while (cursor) {
    for (const handler of [...(cursor.listeners.get(type) ?? [])]) {
      handler({ type, target, currentTarget: cursor, ...extra });
    }
    cursor = extra.bubbles === false ? null : cursor.parent;
  }
};

/* ===================== Đồng hồ giả ===================== */

let now = 0;
let seq = 0;
const timers = new Map();

const clock = {
  setTimeout(fn, ms = 0) {
    const id = ++seq;
    timers.set(id, { at: now + ms, fn });
    return id;
  },
  clearTimeout(id) {
    timers.delete(id);
  },
  /** Nhảy thời gian tới trước ms, chạy đúng những hẹn giờ đã tới hạn. */
  advance(ms) {
    const target = now + ms;
    let guard = 0;
    while (guard++ < 10000) {
      const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      const [id, timer] = due;
      timers.delete(id);
      now = timer.at;
      timer.fn();
    }
    now = target;
  },
  pending() {
    return timers.size;
  },
};

/* ===================== Dàn dựng ===================== */

/** Phần tử đang nằm ngay dưới con trỏ — test tự đặt để mô phỏng. */
let elementUnderPointer = null;

function installGlobals() {
  const documentNode = makeNode('body');

  globalThis.document = Object.assign(documentNode, {
    hidden: false,
    elementFromPoint: () => elementUnderPointer,
    createElement: (tag) => makeNode(tag),
    head: makeNode('head'),
  });

  globalThis.window = {
    PointerEvent: function PointerEvent() {},
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: clock.setTimeout,
    clearInterval: clock.clearTimeout,
    requestAnimationFrame: (fn) => clock.setTimeout(fn, 16),
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    listeners: new Map(),
    addEventListener(type, handler) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(handler);
    },
    removeEventListener(type, handler) {
      const list = this.listeners.get(type) ?? [];
      const at = list.indexOf(handler);
      if (at >= 0) list.splice(at, 1);
    },
    fire(type, extra = {}) {
      for (const handler of [...(this.listeners.get(type) ?? [])]) handler({ type, ...extra });
    },
  };

  globalThis.requestAnimationFrame = globalThis.window.requestAnimationFrame;
}

/** Dựng cây DOM của hero đúng như renderSlideshowHero sinh ra. */
function buildHero(slideCount) {
  const root = makeNode('section', { class: 'hero' });
  const slidesBox = makeNode('div', { class: 'hero__slides' });

  for (let i = 0; i < slideCount; i += 1) {
    const slide = makeNode('div', { class: `hero__slide${i === 0 ? ' is-active' : ''}`, dataset: { slide: String(i) } });
    slide.append(makeNode('img'));
    slidesBox.append(slide);
  }

  const stage = makeNode('div', { class: 'hero__stage' });
  const controls = makeNode('div', { class: 'hero__controls' });
  const dotsBox = makeNode('div', { class: 'hero__dots' });
  for (let i = 0; i < slideCount; i += 1) {
    dotsBox.append(makeNode('button', { class: `hero__dot${i === 0 ? ' is-active' : ''}`, dataset: { dot: String(i) } }));
  }
  const toggle = makeNode('button', { class: 'hero__toggle', dataset: { heroToggle: '' } });
  controls.append(dotsBox, toggle);

  root.append(slidesBox, stage, controls);
  root.parent = globalThis.document;
  globalThis.document.children.push(root);

  // render() ghi innerHTML — cây con đã dựng tay ở trên nên bỏ qua là được
  Object.defineProperty(root, 'innerHTML', { get: () => '', set: () => {}, configurable: true });

  return { root, stage, dots: dotsBox.children, toggle, slides: slidesBox.children };
}

const activeIndex = (slides) => slides.findIndex((s) => s.classList.contains('is-active'));

/** Rê chuột vào một phần tử: có toạ độ + phần tử dưới con trỏ. */
const pointerTo = (node, root, x = 10, y = 10) => {
  elementUnderPointer = node;
  fire(globalThis.document, 'pointermove', { pointerType: 'mouse', clientX: x, clientY: y, bubbles: false });
  clock.advance(20); // để requestAnimationFrame trong queueSync chạy
  return root;
};

/* ===================== Chạy test ===================== */

const STATE = {
  hero: {
    mode: 'slideshow',
    autoplay: true,
    intervalMs: 6000,
    slides: [
      { image: '/a.jpg', title: 'A', enabled: true },
      { image: '/b.jpg', title: 'B', enabled: true },
      { image: '/c.jpg', title: 'C', enabled: true },
    ],
  },
};

try {
  installGlobals();
  const { renderHero } = await importBrowserModule('public/assets/js/components/hero.js');

  /* ---------- 1. Tự chạy ---------- */
  console.log('\n1. Tự chạy');

  let dom = buildHero(3);
  renderHero(dom.root, STATE);

  check('bắt đầu ở slide 1', activeIndex(dom.slides) === 0);
  clock.advance(6000);
  check('sau 6 giây sang slide 2', activeIndex(dom.slides) === 1, `đang ở ${activeIndex(dom.slides) + 1}`);
  clock.advance(6000);
  check('sau 12 giây sang slide 3', activeIndex(dom.slides) === 2);
  clock.advance(6000);
  check('quay vòng về slide 1', activeIndex(dom.slides) === 0);

  /* ---------- 2. Rê chuột KHÔNG được dừng ---------- */
  console.log('\n2. Rê chuột vào không được dừng');

  pointerTo(dom.slides[0], dom.root);
  const beforeHover = activeIndex(dom.slides);
  clock.advance(6000);
  check('rê chuột vào -> VẪN chạy', activeIndex(dom.slides) !== beforeHover, 'đây chính là lỗi được báo');

  const during = activeIndex(dom.slides);
  clock.advance(6000);
  check('giữ chuột trong đó -> vẫn chạy tiếp', activeIndex(dom.slides) !== during);

  pointerTo(null, dom.root); // đưa chuột ra chỗ khác
  const afterOut = activeIndex(dom.slides);
  clock.advance(6000);
  check('đưa chuột ra -> vẫn chạy', activeIndex(dom.slides) !== afterOut);
  check('không gắn lớp hero--paused', !dom.root.classList.contains('hero--paused'));

  /* ---------- 3. Bấm vào rồi đưa chuột ra: lỗi thật ---------- */
  console.log('\n3. Bấm vào nút bên trong rồi đưa chuột ra');

  /**
   * Đây là đường đi gây lỗi trong thực tế: bấm một đầu chấm thì nút đó GIỮ tiêu
   * điểm sau cú bấm. Bản trước dừng vì "focus" và không bao giờ gỡ ra được.
   */
  pointerTo(dom.slides[0], dom.root);
  fire(dom.dots[1], 'click');
  fire(dom.dots[1], 'focusin');
  check('bấm đầu chấm -> nhảy đúng ảnh', activeIndex(dom.slides) === 1);

  pointerTo(null, dom.root);
  clock.advance(6000);
  check(
    'bấm rồi đưa chuột ra -> VẪN chạy tiếp',
    activeIndex(dom.slides) === 2,
    'nút vẫn giữ tiêu điểm sau cú bấm — đây là chỗ từng kẹt vĩnh viễn',
  );

  // Cuộn trang khi đang rê chuột (mouseleave không bắn) cũng không còn ảnh hưởng
  elementUnderPointer = dom.slides[0];
  fire(globalThis.document, 'scroll', { bubbles: false });
  clock.advance(20);
  const beforeScroll = activeIndex(dom.slides);
  clock.advance(6000);
  check('cuộn trang khi chuột đứng yên -> vẫn chạy', activeIndex(dom.slides) !== beforeScroll);

  // Cửa sổ mất tiêu điểm (bấm sang ứng dụng khác) cũng không làm kẹt
  globalThis.window.fire('blur');
  const beforeBlur = activeIndex(dom.slides);
  clock.advance(6000);
  check('đổi sang cửa sổ khác -> không bị kẹt', activeIndex(dom.slides) !== beforeBlur);

  /* ---------- 4. Nút Tạm dừng phải thắng ---------- */
  console.log('\n4. Nút Tạm dừng do người dùng bấm');

  pointerTo(null, dom.root);
  fire(dom.toggle, 'click');
  const paused = activeIndex(dom.slides);
  clock.advance(30000);
  check('bấm Tạm dừng -> dừng hẳn', activeIndex(dom.slides) === paused);

  // Rê chuột vào rồi ra: KHÔNG được tự chạy lại, vì người dùng đã chủ động dừng
  pointerTo(dom.slides[0], dom.root);
  pointerTo(null, dom.root);
  fire(dom.slides[0], 'click');
  clock.advance(30000);
  check(
    'rê chuột và bấm vẫn TÔN TRỌNG nút Tạm dừng',
    activeIndex(dom.slides) === paused,
    'nút Tạm dừng là lệnh của người dùng, không được tự ghi đè',
  );

  fire(dom.toggle, 'click');
  clock.advance(6000);
  check('bấm lần nữa -> chạy tiếp', activeIndex(dom.slides) !== paused);

  /* ---------- 5. Ẩn tab ---------- */
  console.log('\n5. Ẩn tab');

  globalThis.document.hidden = true;
  fire(globalThis.document, 'visibilitychange', { bubbles: false });
  const hiddenAt = activeIndex(dom.slides);
  clock.advance(30000);
  check('tab bị ẩn -> không chạy nền vô ích', activeIndex(dom.slides) === hiddenAt);

  globalThis.document.hidden = false;
  fire(globalThis.document, 'visibilitychange', { bubbles: false });
  clock.advance(6000);
  check('quay lại tab -> chạy tiếp', activeIndex(dom.slides) !== hiddenAt);

  /* ---------- 6. Bấm đầu chấm ---------- */
  console.log('\n6. Bấm vào đầu chấm điều hướng');

  fire(dom.dots[2], 'click');
  check('nhảy đúng slide 3', activeIndex(dom.slides) === 2);
  clock.advance(5000);
  check('đếm lại từ đầu, chưa đổi sau 5 giây', activeIndex(dom.slides) === 2, 'bấm xong bị đổi ảnh ngay');
  clock.advance(1200);
  check('đủ 6 giây thì đổi', activeIndex(dom.slides) === 0);

  /* ---------- 7. Vẽ lại không được chồng listener ---------- */
  console.log('\n7. Vẽ lại trang (nội dung cập nhật)');

  const focusBefore = dom.root.countListeners('focusin');
  const docMoveBefore = globalThis.document.countListeners('pointermove');

  renderHero(dom.root, STATE);
  renderHero(dom.root, STATE);
  renderHero(dom.root, STATE);

  check(
    'listener trên hero không chồng lên nhau',
    dom.root.countListeners('focusin') === focusBefore,
    `${dom.root.countListeners('focusin')} thay vì ${focusBefore}`,
  );
  check(
    'listener trên document không chồng lên nhau',
    globalThis.document.countListeners('pointermove') === docMoveBefore,
    `${globalThis.document.countListeners('pointermove')} thay vì ${docMoveBefore}`,
  );

  /**
   * Phép đo thật của việc chồng hẹn giờ: sau 3 lần vẽ lại, một chu kỳ phải đổi
   * ĐÚNG một ảnh. Thiếu bước dọn dẹp thì 3 hẹn giờ cùng bắn, mỗi cái +1 -> nhảy
   * 3 ảnh một lúc, và người xem thấy ảnh "giật" qua mấy tấm liền.
   */
  const beforeCycle = activeIndex(dom.slides);
  clock.advance(6000);
  const moved = (activeIndex(dom.slides) - beforeCycle + 3) % 3;
  check('một chu kỳ chỉ đổi đúng một ảnh', moved === 1, `nhảy ${moved} ảnh -> có ${moved} hẹn giờ cùng chạy`);

  /* ---------- 8. Trường hợp biên ---------- */
  console.log('\n8. Trường hợp biên');

  const one = buildHero(1);
  renderHero(one.root, { hero: { mode: 'slideshow', intervalMs: 6000, slides: [{ image: '/a.jpg', title: 'A' }] } });
  clock.advance(30000);
  check('một slide thì không chạy hẹn giờ', activeIndex(one.slides) === 0);

  const noAuto = buildHero(3);
  renderHero(noAuto.root, { hero: { ...STATE.hero, autoplay: false } });
  clock.advance(30000);
  check('tắt tự chạy trong CMS thì đứng yên', activeIndex(noAuto.slides) === 0);

  // Điện thoại: chạm vào cũng không được làm đứng
  const touch = buildHero(3);
  renderHero(touch.root, STATE);
  elementUnderPointer = touch.slides[0];
  fire(touch.root, 'touchstart', { touches: [{ clientX: 10 }] });
  fire(touch.root, 'touchend', { changedTouches: [{ clientX: 12 }] });
  clock.advance(6020);
  check(
    'chạm trên điện thoại không làm slideshow đứng',
    activeIndex(touch.slides) !== 0,
    'chạm nhẹ (không đủ để coi là vuốt) vẫn phải chạy tiếp',
  );

  // Vuốt đủ mạnh thì đổi ảnh và đếm lại từ đầu
  const swipe = buildHero(3);
  renderHero(swipe.root, STATE);
  fire(swipe.root, 'touchstart', { touches: [{ clientX: 200 }] });
  fire(swipe.root, 'touchend', { changedTouches: [{ clientX: 100 }] });
  check('vuốt sang trái -> ảnh kế tiếp', activeIndex(swipe.slides) === 1);
} catch (error) {
  console.error('\nLỖI:', error.stack);
  failed += 1;
}

console.log(`\n${failed === 0 ? '✓ SLIDESHOW ĐẠT' : '✗ SLIDESHOW CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
