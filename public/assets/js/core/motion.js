/**
 * motion.js - toan bo hieu ung chuyen dong cua trang.
 *
 * Nguyen tac:
 *  - Chi hoat hinh `transform` va `opacity` (GPU xu ly, khong gay reflow).
 *  - Moi hieu ung deu tat khi nguoi dung bat "giam chuyen dong" trong he dieu hanh.
 *  - Don dep `will-change` ngay sau khi chay xong de khong giu bo nho GPU.
 */

/** Nguoi dung co yeu cau giam chuyen dong khong? */
export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/* ===================== 1. Cuon muot ===================== */

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

let activeScroll = null;

/**
 * Cuon toi vi tri voi duong cong toc do rieng.
 * Cuon muot cua trinh duyet moi noi mot khac; tu viet de moi may deu giong nhau.
 */
export function smoothScrollTo(targetY, { duration = 720, onDone } = {}) {
  const startY = window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const endY = Math.max(0, Math.min(targetY, maxY));
  const distance = endY - startY;

  if (activeScroll) cancelAnimationFrame(activeScroll);

  if (prefersReducedMotion() || Math.abs(distance) < 2) {
    window.scrollTo(0, endY);
    onDone?.();
    return;
  }

  // Quang duong dai thi cuon lau hon mot chut, nhung khong qua 1,1 giay
  const time = Math.min(duration * (0.6 + Math.abs(distance) / 2600), 1100);
  const startAt = performance.now();

  // Nguoi dung tu cuon giua chung -> huy hoat hinh, tra quyen dieu khien lai cho ho
  const cancel = () => {
    if (activeScroll) cancelAnimationFrame(activeScroll);
    activeScroll = null;
    detach();
  };
  const detach = () => {
    window.removeEventListener('wheel', cancel);
    window.removeEventListener('touchstart', cancel);
    window.removeEventListener('keydown', onKey);
  };
  const onKey = (event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancel();
  };

  window.addEventListener('wheel', cancel, { passive: true, once: true });
  window.addEventListener('touchstart', cancel, { passive: true, once: true });
  window.addEventListener('keydown', onKey);

  const step = (now) => {
    const progress = Math.min((now - startAt) / time, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));

    if (progress < 1) {
      activeScroll = requestAnimationFrame(step);
      return;
    }
    activeScroll = null;
    detach();
    onDone?.();
  };

  activeScroll = requestAnimationFrame(step);
}

/* ============ 2. Xuat hien dan khi cuon toi (co so le) ============ */

let revealObserver = null;

/**
 * Cac phan tu [data-reveal] se truot len va hien dan khi lot vao khung nhin.
 * Cac phan tu canh nhau xuat hien lech nhau vai chuc mili giay cho co nhip.
 */
export function initReveal(scope = document) {
  const targets = Array.from(scope.querySelectorAll('[data-reveal]:not(.is-visible)'));
  if (!targets.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        // Sap theo vi tri tren man hinh de thu tu xuat hien tu tren xuong
        const shown = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        shown.forEach((entry, index) => {
          const el = entry.target;
          const delay = Number(el.dataset.revealDelay ?? Math.min(index * 70, 420));
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add('is-visible');

          // Bo will-change sau khi chay xong de khong chiem bo nho GPU
          el.addEventListener(
            'transitionend',
            () => {
              el.style.transitionDelay = '';
              el.style.willChange = '';
            },
            { once: true },
          );

          revealObserver.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
  }

  targets.forEach((el) => revealObserver.observe(el));
}

/* =============== 3. Dem so cho dai thong ke =============== */

const formatNumber = (value, sample = '') => {
  // Giu nguyen kieu ngan cach cua chuoi goc: "2.400" -> "2.400"
  const separator = sample.includes('.') ? '.' : sample.includes(',') ? ',' : '';
  const text = Math.round(value).toString();
  return separator ? text.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : text;
};

/** Chay so tu 0 len gia tri that khi khoi thong ke lot vao khung nhin. */
export function initCounters(scope = document) {
  const targets = Array.from(scope.querySelectorAll('[data-count]'));
  if (!targets.length) return;

  const run = (el) => {
    const raw = el.dataset.count ?? '';
    const numeric = Number(raw.replace(/[^\d]/g, ''));
    if (!Number.isFinite(numeric) || numeric === 0) return;

    const duration = 1400;
    const startAt = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startAt) / duration, 1);
      // easeOutExpo: chay nhanh luc dau roi cham dan, cam giac "dung lai" tu nhien
      const eased = progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
      el.textContent = formatNumber(numeric * eased, raw);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = raw;
    };

    requestAnimationFrame(tick);
  };

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.4 },
  );

  targets.forEach((el) => observer.observe(el));
}

/* ============ 4. Anh hien dan thay vi nhay ra dot ngot ============ */

export function initImageFade(scope = document) {
  scope.querySelectorAll('img:not([data-no-fade])').forEach((img) => {
    if (img.classList.contains('is-loaded')) return;
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('is-loaded');
      return;
    }
    img.classList.add('img-fade');
    img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
    img.addEventListener('error', () => img.classList.add('is-loaded'), { once: true });
  });
}

/* ============ 5. Loc danh sach kem hoat hinh (FLIP) ============ */

/**
 * An/hien the theo bo loc mot cach muot: ghi lai vi tri cu, doi DOM,
 * roi cho cac the truot tu vi tri cu ve vi tri moi.
 *
 * @param {HTMLElement} container
 * @param {HTMLElement[]} items
 * @param {(el: HTMLElement) => boolean} matches
 */
export function animateFilter(container, items, matches) {
  if (prefersReducedMotion()) {
    items.forEach((el) => {
      el.hidden = !matches(el);
    });
    return;
  }

  // FIRST: vi tri hien tai cua cac the dang hien
  const before = new Map();
  items.forEach((el) => {
    if (!el.hidden) before.set(el, el.getBoundingClientRect());
  });

  // Cac the sap bi an: mo dan roi moi thuc su an
  const leaving = items.filter((el) => !el.hidden && !matches(el));
  leaving.forEach((el) => el.classList.add('is-leaving'));

  const apply = () => {
    const entering = [];
    items.forEach((el) => {
      const show = matches(el);
      if (show && el.hidden) entering.push(el);
      el.hidden = !show;
      el.classList.remove('is-leaving');
    });

    // LAST + INVERT + PLAY: the o lai truot tu cho cu sang cho moi
    items.forEach((el) => {
      if (el.hidden) return;
      const old = before.get(el);
      if (!old) return;
      const now = el.getBoundingClientRect();
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(() => {
        el.style.transition = '';
        el.style.transform = '';
      });
    });

    // The moi xuat hien: hien dan, lech nhau chut cho co nhip
    entering.forEach((el, index) => {
      el.classList.add('is-entering');
      el.style.animationDelay = `${Math.min(index * 45, 360)}ms`;
      el.addEventListener(
        'animationend',
        () => {
          el.classList.remove('is-entering');
          el.style.animationDelay = '';
        },
        { once: true },
      );
    });
  };

  if (leaving.length) window.setTimeout(apply, 180);
  else apply();
}

/* ============ 6. Chuyen noi dung (dung cho slide hero) ============ */

/**
 * Thay noi dung mot vung bang cach: mo dan ra -> doi HTML -> hien dan vao.
 * @returns {Promise<void>}
 */
export function swapContent(element, nextHtml, { out = 260, inDelay = 20 } = {}) {
  if (!element) return Promise.resolve();

  if (prefersReducedMotion()) {
    element.innerHTML = nextHtml;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    element.classList.add('is-swapping-out');

    window.setTimeout(() => {
      element.innerHTML = nextHtml;
      element.classList.remove('is-swapping-out');
      element.classList.add('is-swapping-in');

      window.setTimeout(() => {
        element.classList.remove('is-swapping-in');
        resolve();
      }, inDelay + 520);
    }, out);
  });
}

/* ============ 7. Do bong theo con tro cho the san pham ============ */

/**
 * Nghieng nhe the theo vi tri con tro. Chi chay tren thiet bi co chuot that.
 */
export function initTilt(scope = document, selector = '[data-tilt]') {
  if (prefersReducedMotion() || !window.matchMedia?.('(hover: hover)').matches) return;

  scope.querySelectorAll(selector).forEach((card) => {
    let frame = null;

    const move = (event) => {
      if (frame) return; // gop nhieu su kien vao 1 khung hinh
      frame = requestAnimationFrame(() => {
        frame = null;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--tilt-x', `${(-y * 3).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(x * 3).toFixed(2)}deg`);
      });
    };

    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    };

    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', reset);
  });
}

/* ============ 8. Thanh tien do cuon trang o dinh header ============ */

let progressBar = null;
let progressBound = false;

/**
 * Thanh tien do cuon trang.
 * Header co the duoc ve lai nhieu lan -> chi gan listener mot lan,
 * moi lan goi chi cap nhat lai phan tu dang hien thi.
 */
export function initScrollProgress(bar) {
  progressBar = bar || null;
  if (!progressBar) return;

  const update = () => {
    if (!progressBar) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progressBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
  };

  if (!progressBound) {
    progressBound = true;
    let frame = null;
    window.addEventListener(
      'scroll',
      () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          update();
        });
      },
      { passive: true },
    );
  }

  update();
}
