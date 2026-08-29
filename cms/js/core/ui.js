/** ui.js - modal, confirm va toast dung chung cho CMS. */

import { html, raw, qs, originUrl } from '/assets/js/core/dom.js';

/**
 * Dia chi cho nut "Xem website".
 *
 * Co dien "Dia chi website" trong CMS thi luon mo ten mien that - ke ca khi ban
 * dang mo CMS bang localhost hay bang IP may chu. Bo trong thi lui ve '/', tuc
 * la cung host dang mo CMS (tien khi thu ban tren may).
 */
export const siteHref = (settings) => originUrl(settings?.siteUrl) || '/';

const modalRoot = () => qs('#modal-root');

/**
 * Mo modal. onMount(dialog, close) duoc goi sau khi gan vao DOM.
 * Tra ve Promise resolve bang gia tri truyen cho close().
 */
export function openModal({ title, body = '', footer = '', width, onMount }) {
  return new Promise((resolve) => {
    const root = modalRoot();
    const wrapper = document.createElement('div');
    wrapper.className = 'modal';
    wrapper.innerHTML = html`
      <div class="modal__backdrop" data-close></div>
      <div class="modal__dialog" role="dialog" aria-modal="true" style="${raw(width ? `width:${width}` : '')}">
        <div class="modal__head">
          <span class="modal__title">${title}</span>
          <button class="btn btn--sm" type="button" data-close style="margin-left:auto">Đóng</button>
        </div>
        <div class="modal__body">${raw(body)}</div>
        ${footer ? html`<div class="modal__foot">${raw(footer)}</div>` : ''}
      </div>
    `;

    const close = (value) => {
      wrapper.remove();
      document.removeEventListener('keydown', onKey);
      resolve(value);
    };

    const onKey = (event) => {
      if (event.key === 'Escape') close(undefined);
    };

    wrapper.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) close(undefined);
    });

    document.addEventListener('keydown', onKey);
    root.appendChild(wrapper);
    onMount?.(wrapper.querySelector('.modal__dialog'), close);
  });
}

export const confirmDialog = (message, { confirmLabel = 'Xóa', danger = true } = {}) =>
  openModal({
    title: 'Xác nhận',
    width: '440px',
    // Boc trong <div>: cho phep truyen ca doan HTML nhieu khoi, khong chi mot dong chu
    body: html`<div class="confirm-body">${message}</div>`,
    footer: html`
      <button class="btn" type="button" data-close>Hủy</button>
      <button class="btn ${raw(danger ? 'btn--danger' : 'btn--primary')}" type="button" data-confirm>
        ${confirmLabel}
      </button>
    `,
    onMount: (dialog, close) => {
      dialog.querySelector('[data-confirm]')?.addEventListener('click', () => close(true));
    },
  }).then((value) => value === true);

export function toast(message, variant = 'info', duration = 3000) {
  const root = qs('#toast-root');
  if (!root) return;
  const node = document.createElement('div');
  node.className = `toast toast--${variant}`;
  node.textContent = message;
  root.appendChild(node);
  setTimeout(() => {
    node.style.transition = 'opacity 200ms ease';
    node.style.opacity = '0';
    setTimeout(() => node.remove(), 220);
  }, duration);
}

export const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * Rút gọn một đường dẫn thành tên tệp để hiển thị.
 *   /uploads/logo-abc123.svg        -> logo-abc123.svg
 *   https://cdn.com/a/b/anh.png?v=2 -> anh.png
 * Đường dẫn đầy đủ vẫn được giữ nguyên trong dữ liệu, chỉ gọn phần nhìn thấy.
 */
export const fileName = (value = '') => {
  const raw = String(value).trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, 'http://x');
    const last = url.pathname.split('/').filter(Boolean).pop();
    return decodeURIComponent(last || raw);
  } catch {
    return raw.split(/[\\/]/).filter(Boolean).pop() || raw;
  }
};

/** Đường dẫn có trỏ ra ngoài tên miền của mình không? */
export const isExternalUrl = (value = '') => /^https?:\/\//i.test(String(value).trim());

export const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleString('vi-VN', { hour12: false });
};
