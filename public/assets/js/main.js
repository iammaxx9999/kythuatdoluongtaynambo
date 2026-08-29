/**
 * main.js - diem khoi dong trang chu.
 * Luong: tai du lieu -> ap dung theme/SEO -> render tung component -> hieu ung.
 */

import { qs, toast, originUrl } from './core/dom.js';
import { loadSite, reloadSite, getState, t } from './core/store.js';
import { renderHeader, initScrollSpy, scrollToSection } from './components/header.js';
import { renderHero } from './components/hero.js';
import { renderStats, renderServices, renderFeatures, renderCta, renderFooter } from './components/sections.js';
import { renderProducts } from './components/products.js';
import { renderAbout } from './components/about.js';
import { renderGallery } from './components/gallery.js';
import { renderContact } from './components/contact.js';
import { renderFloatingContact } from './components/floating-contact.js';
import { initReveal, initCounters, initImageFade, initTilt, prefersReducedMotion } from './core/motion.js';

/** Ban do: selector component -> ham render */
const COMPONENTS = {
  header: renderHeader,
  hero: renderHero,
  stats: renderStats,
  services: renderServices,
  products: renderProducts,
  features: renderFeatures,
  about: renderAbout,
  gallery: renderGallery,
  cta: renderCta,
  contact: renderContact,
  footer: renderFooter,
  'floating-contact': renderFloatingContact,
};

async function bootstrap() {
  try {
    const state = await loadSite();
    paint(state);
    afterRender();
    initLiveRefresh();
  } catch (error) {
    console.error(error);
    toast(t('loadError', 'Không tải được nội dung trang. Vui lòng tải lại.'), 'error', 6000);
  } finally {
    // Cho trinh duyet ve xong khung hinh dau tien roi moi go man cho -> khong thay giat
    requestAnimationFrame(() =>
      requestAnimationFrame(() => qs('#site-loader')?.classList.add('is-hidden')),
    );
  }
}

/** Vẽ lại toàn bộ trang từ dữ liệu mới. */
function paint(state) {
  applyTheme(state.settings);
  applySeo(state.settings);
  applyStaticLabels(state.settings);
  mountComponents(state);
}

/**
 * Tự cập nhật nội dung khi người dùng quay lại tab.
 *
 * Tình huống thường gặp: mở CMS ở một tab, trang web ở tab khác. Sau khi bấm Lưu
 * trong CMS, tab trang web vẫn đang giữ dữ liệu cũ trong bộ nhớ. Thay vì bắt người
 * dùng tự bấm F5, trang sẽ lặng lẽ hỏi lại server mỗi khi được xem lại và chỉ vẽ lại
 * khi nội dung thực sự khác.
 */
function initLiveRefresh() {
  let busy = false;
  let lastCheck = Date.now();

  const check = async () => {
    // Chống gọi dồn: cách nhau ít nhất 2 giây
    if (busy || Date.now() - lastCheck < 2000) return;
    busy = true;
    lastCheck = Date.now();

    try {
      const { changed, state } = await reloadSite();
      if (!changed) return;

      paint(state);
      afterRender();
      document.body.classList.add('is-refreshed');
      window.setTimeout(() => document.body.classList.remove('is-refreshed'), 700);
    } catch {
      /* mất mạng tạm thời - lần sau thử lại */
    } finally {
      busy = false;
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check();
  });
  window.addEventListener('focus', check);
  window.addEventListener('pageshow', (event) => {
    // Trang lấy lại từ bộ nhớ đệm quay lui/tiến của trình duyệt
    if (event.persisted) check();
  });
}

function mountComponents(state) {
  Object.entries(COMPONENTS).forEach(([name, renderFn]) => {
    const root = document.querySelector(`[data-component="${name}"]`);
    if (!root) return;
    try {
      renderFn(root, state);
    } catch (error) {
      console.error(`[component:${name}]`, error);
    }
  });
}

/** Mau thuong hieu do CMS cau hinh -> ghi de bien CSS. */
function applyTheme(settings = {}) {
  const root = document.documentElement;
  root.classList.toggle('reduce-motion', prefersReducedMotion());
  if (settings.themeColor) {
    root.style.setProperty('--brand', settings.themeColor);
    root.style.setProperty('--brand-dark', shade(settings.themeColor, -18));
    root.style.setProperty('--brand-soft', tint(settings.themeColor, 0.92));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', settings.themeColor);
  }
  if (settings.accentColor) root.style.setProperty('--ink', settings.accentColor);
  if (settings.favicon) document.querySelector('link[rel="icon"]')?.setAttribute('href', settings.favicon);
}

function applyStaticLabels(settings = {}) {
  const labels = settings.labels ?? {};
  const skip = document.querySelector('.skip-link');
  if (skip && labels.skipLink) skip.textContent = labels.skipLink;
  const loading = document.querySelector('#site-loader .sr-only');
  if (loading && labels.loading) loading.textContent = labels.loading;
}

function applySeo(settings = {}) {
  document.title = settings.siteTitle || settings.siteName || 'Website';
  setMeta('description', settings.siteDescription);
  setMeta('keywords', settings.keywords);
  setMeta('og:title', settings.siteTitle, 'property');
  setMeta('og:description', settings.siteDescription, 'property');
  setMeta('og:type', 'website', 'property');
  setMeta('og:site_name', settings.siteName, 'property');

  /**
   * Địa chỉ chuẩn (canonical).
   *
   * Một trang mở được bằng nhiều địa chỉ (có/không www, http/https, kèm ?utm_…)
   * thì Google coi là nhiều trang trùng nội dung và chia nhỏ điểm SEO.
   * Thẻ này nói rõ "địa chỉ thật là cái này".
   *
   * Ưu tiên ô "Địa chỉ website" trong CMS; bỏ trống thì dùng địa chỉ đang mở
   * (bỏ query và hash để không sinh vô số bản trùng).
   */
  const base = originUrl(settings.siteUrl) || `${location.origin}${location.pathname}`;
  const canonical = base.replace(/\/index\.html$/, '/').replace(/(.)\/$/, '$1');
  setLink('canonical', canonical);
  setMeta('og:url', canonical, 'property');

  // Ảnh chia sẻ: cần địa chỉ tuyệt đối, Facebook/Zalo không đọc đường dẫn tương đối
  if (settings.logo) {
    setMeta('og:image', new URL(settings.logo, canonical || location.origin).href, 'property');
  }
}

function setLink(rel, href) {
  if (!href) return;
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

let firstPaint = true;

function afterRender() {
  initReveal(document);
  initCounters(document);
  initImageFade(document);
  initTilt(document);
  initScrollSpy(document);
  syncHeaderHeight();

  bindResizeOnce();

  // Chỉ cuộn tới hash trong lần vẽ đầu tiên, không lặp lại khi làm mới nội dung
  const hash = firstPaint ? location.hash : '';
  firstPaint = false;
  if (hash && hash.length > 1) {
    try {
      const target = document.querySelector(hash);
      if (target) window.setTimeout(() => scrollToSection(target), 260);
    } catch {
      /* hash khong phai selector hop le - bo qua */
    }
  }
}

/** Chỉ gắn một lần dù trang được vẽ lại nhiều lần. */
let resizeBound = false;
function bindResizeOnce() {
  if (resizeBound) return;
  resizeBound = true;

  // Chỉ tính lại chiều cao header khi kích thước thực sự đổi (tránh giật trên mobile)
  let resizeTimer = null;
  window.addEventListener(
    'resize',
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(syncHeaderHeight, 120);
    },
    { passive: true },
  );
}

function syncHeaderHeight() {
  const header = qs('#site-header');
  if (!header) return;
  document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
}

/* ---------------- Tien ich mau ---------------- */
const parseHex = (hex) => {
  const value = String(hex).replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const int = Number.parseInt(full, 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
};

const toHex = ({ r, g, b }) =>
  `#${[r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')}`;

/** Lam dam (percent < 0) hoac sang hon (percent > 0). */
const shade = (hex, percent) => {
  const { r, g, b } = parseHex(hex);
  const factor = 1 + percent / 100;
  return toHex({ r: r * factor, g: g * factor, b: b * factor });
};

/** Tron voi mau trang theo ti le (0 -> giu nguyen, 1 -> trang). */
const tint = (hex, ratio) => {
  const { r, g, b } = parseHex(hex);
  return toHex({
    r: r + (255 - r) * ratio,
    g: g + (255 - g) * ratio,
    b: b + (255 - b) * ratio,
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

// Ho tro CMS preview: cho phep tai lai noi dung tu console/iframe
window.__site = { reload: bootstrap, refresh: () => reloadSite().then(({ changed, state }) => {
  if (changed) { paint(state); afterRender(); }
  return changed;
}), getState };
