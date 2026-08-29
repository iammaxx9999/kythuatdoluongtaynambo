/**
 * dom.js - tien ich DOM & template an toan.
 * `html` tu dong escape moi gia tri noi suy; dung `raw()` khi co y chen HTML.
 */

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);

class RawHtml {
  constructor(value) {
    this.value = String(value ?? '');
  }

  /** Cho phep gan truc tiep: el.innerHTML = html`…` */
  toString() {
    return this.value;
  }
}

/** Danh dau doan HTML da an toan, khong escape. */
export const raw = (value) => new RawHtml(value);

const serialize = (value) => {
  if (value === null || value === undefined || value === false) return '';
  if (value instanceof RawHtml) return value.value;
  if (Array.isArray(value)) return value.map(serialize).join('');
  return esc(value);
};

/**
 * Tagged template: html`<p>${text}</p>`
 * Tra ve RawHtml de co the long nhau ma khong bi escape hai lan.
 */
export const html = (strings, ...values) =>
  new RawHtml(strings.reduce((acc, str, i) => acc + serialize(values[i - 1]) + str));

/** Tao element tu chuoi HTML. */
export const fromHtml = (markup) => {
  const template = document.createElement('template');
  template.innerHTML = String(markup).trim();
  return template.content.firstElementChild;
};

/**
 * Lam sach URL truoc khi dua vao href/src.
 *
 * Noi dung do CMS nhap van co the chua `javascript:` (vi du khi tai khoan quan tri
 * bi chiem). CSP da chan thuc thi, day la lop bao ve thu hai.
 *
 * @param {string} value        gia tri can kiem tra
 * @param {object} options
 * @param {boolean} options.allowData  cho phep data: (chi dung cho anh)
 */
export const safeUrl = (value, { allowData = false } = {}) => {
  const url = String(value ?? '').trim();
  if (!url) return '';

  // Bo ky tu dieu khien roi so khop giao thuc
  const scheme = url.replace(/[\u0000-\u0020]/g, '').toLowerCase();

  if (/^(javascript|vbscript|file):/.test(scheme)) return '';
  if (scheme.startsWith('data:') && !allowData) return '';
  if (scheme.startsWith('data:') && !/^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml);/.test(scheme)) return '';

  return url;
};

/** URL bat buoc phai la https (dung cho iframe nhung tu ben ngoai). */
export const httpsUrl = (value) => {
  const url = safeUrl(value);
  return /^https:\/\//i.test(url) ? url : '';
};

/**
 * Dia chi goc cua website - dung cho nut "Xem website", the canonical, sitemap.
 *
 * Chi nhan http:// hoac https:// tuyet doi va bo dau / o cuoi cho gon.
 * Khong hop le -> tra '' de noi goi tu lui ve duong dan tuong doi ('/').
 *
 * LUU Y: server co ban sao cung quy tac o server/lib/helpers.js
 * (normalizeSiteUrl). Doi mot ben thi phai doi ben kia - co test doi chieu.
 */
export const originUrl = (value) => {
  const url = safeUrl(value);
  if (!/^https?:\/\/[^/?#\s]+/i.test(url)) return '';
  return url.replace(/\/+$/, '');
};

export const qs = (selector, scope = document) => scope.querySelector(selector);
export const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/** Gan HTML vao container va tra ve chinh container. */
export const render = (target, markup) => {
  if (!target) return null;
  target.innerHTML = typeof markup === 'string' ? markup : String(markup ?? '');
  return target;
};

/** Uy quyen su kien - it listener hon, hoat dong voi node them sau. */
export const delegate = (root, eventName, selector, handler) => {
  if (!root) return () => {};
  const listener = (event) => {
    const match = event.target.closest(selector);
    if (match && root.contains(match)) handler(event, match);
  };
  root.addEventListener(eventName, listener);
  return () => root.removeEventListener(eventName, listener);
};

/**
 * Giu lai cho tuong thich: hieu ung xuat hien nay da chuyen sang core/motion.js.
 * @deprecated dung initReveal() trong motion.js
 */
export const observeReveal = (scope = document) =>
  import('./motion.js').then((motion) => motion.initReveal(scope));

/** Thong bao ngan gon o giua duoi man hinh. */
export const toast = (message, variant = 'info', duration = 3200) => {
  const root = qs('#toast-root');
  if (!root) return;
  const node = fromHtml(html`<div class="toast toast--${variant}">${message}</div>`);
  root.appendChild(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transition = 'opacity 220ms ease';
    setTimeout(() => node.remove(), 240);
  }, duration);
};

export const lockScroll = (locked) => {
  document.body.classList.toggle('is-locked', Boolean(locked));
};
