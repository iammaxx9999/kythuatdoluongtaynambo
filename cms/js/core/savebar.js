/**
 * savebar.js - thanh "Lưu thay đổi" luôn nổi ở cạnh dưới màn hình.
 *
 * Vì sao tách ra thành một phần tử dùng chung gắn thẳng vào <body>:
 *  - Trước đây thanh này nằm bên trong khung nội dung. Khung đó có hoạt ảnh
 *    `transform`, mà bất kỳ tổ tiên nào có transform đều biến thành khung tham
 *    chiếu mới cho `position: fixed` — thanh lưu hết "dính" vào màn hình và
 *    người dùng phải cuộn xuống cuối trang mới thấy.
 *  - Chuyển màn hình sẽ thay cả khung nội dung, kéo theo mất luôn thanh lưu.
 *
 * Gắn vào <body> thì `position: fixed` chắc chắn tính theo khung nhìn.
 */

import { html } from '/assets/js/core/dom.js';

let element = null;
let handlers = { onSave: null, onReset: null };

function ensureElement() {
  if (element) return element;

  element = document.createElement('div');
  element.className = 'savebar';
  element.setAttribute('role', 'status');
  element.innerHTML = html`
    <span class="savebar__dot" aria-hidden="true"></span>
    <span class="savebar__text">Bạn có thay đổi chưa lưu</span>
    <div class="savebar__actions">
      <button class="btn" type="button" data-reset>Hoàn tác</button>
      <button class="btn btn--primary" type="button" data-save>Lưu thay đổi</button>
    </div>
  `;

  element.querySelector('[data-reset]').addEventListener('click', () => handlers.onReset?.());
  element.querySelector('[data-save]').addEventListener('click', () => handlers.onSave?.());

  document.body.appendChild(element);
  return element;
}

export const savebar = {
  /** Hiện thanh lưu và gắn hành động cho màn hình đang mở. */
  show({ onSave, onReset }) {
    handlers = { onSave, onReset };
    ensureElement().classList.add('is-visible');
  },

  hide() {
    element?.classList.remove('is-visible');
  },

  /** Khoá nút trong lúc đang gửi lên server. */
  setBusy(busy) {
    if (!element) return;
    const save = element.querySelector('[data-save]');
    const reset = element.querySelector('[data-reset]');
    save.disabled = busy;
    reset.disabled = busy;
    save.textContent = busy ? 'Đang lưu…' : 'Lưu thay đổi';
  },
};

export default savebar;
