/**
 * links.js - phan biet "nhay trong trang" va "di ra ngoai".
 *
 * Nhay trong trang (#san-pham, #lien-he...) duoc dung bang <button>, KHONG phai
 * <a href>. Ly do: co thuoc tinh href thi trinh duyet hien duong dan o goc duoi
 * trai khi re chuot, va bam vao la thanh dia chi doi thanh tenmien.com/#san-pham.
 *
 * Doi lai phai chap nhan mat vai thu, va day la danh doi co that:
 *  - Khong mo duoc tab moi (chuot giua / Ctrl+bam / chuot phai).
 *  - Trinh doc man hinh doc la "nut" thay vi "lien ket", nen nguoi khiem thi
 *    khong liet ke duoc bang danh sach lien ket. Van dung duoc qua vung <nav>.
 *  - Khong gui duoc dia chi tro thang toi mot khu vuc cho nguoi khac.
 *
 * VA LUU Y THAT: cach nay chi giau khoi THANH DIA CHI va DONG XEM TRUOC khi re
 * chuot. Ai mo cong cu nha phat trien (F12) van thay data-scroll-to trong HTML.
 * Khong co cach nao giau han o phia trinh duyet - moi thu deu nam tren may khach.
 *
 * Lien ket ra ngoai (Facebook, Zalo, Google Maps...) van giu nguyen <a href>:
 * do la lien ket that, giau di chi lam kho nguoi dung ma khong duoc gi.
 */

import { esc, safeUrl } from './dom.js';

/** '#san-pham' -> true. 'https://...' hoac '/uploads/x' -> false. */
export const isInPageTarget = (target) => String(target ?? '').trim().startsWith('#');

/**
 * Dung mot muc dieu huong.
 *
 * @param {object}  options
 * @param {string}  options.target     '#san-pham' hoac URL day du
 * @param {string}  options.label      chu hien ra (se duoc thoat HTML)
 * @param {string} [options.className] class CSS
 * @param {string} [options.attrs]     thuoc tinh them (da tu thoat san)
 * @param {string} [options.inner]     noi dung HTML thay cho label (da tu thoat san)
 * @returns {string} HTML
 */
export function navAction({ target, label = '', className = '', attrs = '', inner = null }) {
  const body = inner ?? esc(label);
  const cls = className ? ` class="${esc(className)}"` : '';

  if (isInPageTarget(target)) {
    // Bo dau # de trong HTML khong con thu gi trong nhu mot duong dan
    const id = String(target).trim().slice(1);
    return `<button type="button"${cls} data-scroll-to="${esc(id)}" ${attrs}>${body}</button>`;
  }

  const url = safeUrl(target);
  if (!url) return `<span${cls} ${attrs}>${body}</span>`;

  const external = /^https?:\/\//i.test(url);
  const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a${cls} href="${esc(url)}"${rel} ${attrs}>${body}</a>`;
}

export default navAction;
