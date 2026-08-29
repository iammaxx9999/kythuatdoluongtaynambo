/**
 * icons.js - kho icon SVG inline (khong phu thuoc font/CDN).
 * Dung: icon('phone', 20)
 *
 * Muon dung anh rieng tai len tu CMS thay cho icon co san: iconOrImage().
 */

import { safeUrl, esc } from './dom.js';

const PATHS = {
  phone:
    '<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.37 2.3.57 3.5.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.57 3.5a1 1 0 0 1-.25 1z"/>',
  mail: '<path d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m3.6 6.5 8.4 6 8.4-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  pin: '<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z"/>',
  clock:
    '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5.3l3.4 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  chat: '<path d="M12 3c5 0 9 3.4 9 7.6 0 4.2-4 7.6-9 7.6-.9 0-1.8-.1-2.6-.3L4 20l1.2-3.4C3.8 15.2 3 13 3 10.6 3 6.4 7 3 12 3z"/>',
  close:
    '<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  zalo: '<path d="M12 3C6.8 3 2.6 6.6 2.6 11c0 2.5 1.3 4.7 3.4 6.2-.1.9-.6 2.3-1.4 3.3-.2.2 0 .6.3.5 2-.4 3.4-1.2 4.2-1.8 1 .2 1.9.3 2.9.3 5.2 0 9.4-3.6 9.4-8s-4.2-8-9.4-8zm-4 5.6h3.6c.3 0 .5.2.5.5s-.2.5-.4.7l-2.6 3.3h2.6c.3 0 .5.2.5.5s-.2.5-.5.5H7.9c-.3 0-.5-.2-.5-.5 0-.2.1-.4.2-.5l2.7-3.4H8c-.3 0-.5-.2-.5-.5s.2-.6.5-.6zm5.9 1.3c.3 0 .5.2.5.5v3.7c0 .3-.2.5-.5.5s-.5-.2-.5-.5v-3.7c0-.3.2-.5.5-.5zm2.5 0c.3 0 .5.2.5.5v3c0 .1.1.2.2.2h1.3c.3 0 .5.2.5.5s-.2.5-.5.5h-1.9c-.4 0-.7-.3-.7-.7v-3.5c0-.3.3-.5.6-.5z"/>',
  facebook:
    '<path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94z"/>',
  link: '<path d="M10.6 13.4a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.8 6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13.4 10.6a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 1 0 5.7 5.7l1.6-1.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  check:
    '<path d="m5 12.8 4.2 4.2L19 7.2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  pause: '<path d="M8 5h3v14H8zM13 5h3v14h-3z"/>',
  blueprint:
    '<path d="M4 5h16v14H4z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 9h16M9 9v10M14 5v14" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".6"/>',
  build:
    '<path d="M14.7 6.3a4 4 0 0 1 5.2 5.2l-3.4-1.8-1.8-3.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m14 10-8.6 8.6a2 2 0 1 0 2.8 2.8L16.8 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  verify:
    '<path d="m12 3 7 3v5.5c0 4.3-3 8-7 9.5-4-1.5-7-5.2-7-9.5V6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9 12 2 2 4-4.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  support:
    '<path d="M4 13a8 8 0 0 1 16 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="3" y="12.5" width="4" height="6" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="17" y="12.5" width="4" height="6" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19 18.5v.8a2 2 0 0 1-2 2h-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  scale:
    '<path d="M12 4v16M6 20h12M8 8h8M8 8 5 15h6zM16 8l3 7h-6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  arrow:
    '<path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
};

export const icon = (name, size = 20, extraClass = '') => {
  const path = PATHS[name] ?? PATHS.link;
  return `<svg class="icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">${path}</svg>`;
};

/** Danh sách tên icon có sẵn - CMS đọc để dựng ô chọn, khỏi phải chép tay. */
export const iconNames = () => Object.keys(PATHS);

/**
 * Icon có sẵn, HOẶC ảnh riêng người dùng tải lên qua CMS.
 *
 * Ảnh riêng luôn dựng bằng thẻ <img>, KHÔNG nhúng thẳng nội dung SVG vào trang:
 * tệp .svg tải lên có thể chứa <script>, nhúng thẳng là mở cửa cho XSS, còn đặt
 * trong <img> thì trình duyệt không cho chạy script bên trong.
 *
 * @param {string} name      tên icon có sẵn, dùng khi không có ảnh riêng
 * @param {string} imageUrl  đường dẫn ảnh riêng (để trống = dùng icon có sẵn)
 */
export const iconOrImage = (name, imageUrl, size = 20, extraClass = '') => {
  const url = safeUrl(imageUrl);
  if (!url) return icon(name, size, extraClass);
  return `<img class="icon icon--img ${esc(extraClass)}" src="${esc(url)}" alt="" width="${size}" height="${size}" loading="lazy" decoding="async" />`;
};

export default icon;
