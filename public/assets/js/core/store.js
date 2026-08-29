/**
 * store.js - nguon du lieu duy nhat cho trang chu.
 * Tai 1 lan tu /api/site, cac component doc qua getState().
 */

import { siteApi } from './api.js';
import { resolveSite } from './tokens.js';

let state = null;
let signature = '';
const listeners = new Set();

export const getState = () => state;

/** "Dấu vân tay" của dữ liệu hiện tại - dùng để biết nội dung có đổi hay không. */
export const getSignature = () => signature;

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notify = () => listeners.forEach((listener) => listener(state));

/**
 * Cửa duy nhất để đặt dữ liệu.
 *
 * Mọi đường vào đều đi qua đây nên ký tự đại diện ({brand}, {company}, {year})
 * chắc chắn được thay - không có lối nào lọt vào state mà còn nguyên {brand}.
 */
function apply(next) {
  state = resolveSite(next);
  signature = JSON.stringify(state);
  return state;
}

export async function loadSite() {
  apply(await siteApi.getPublicSite());
  notify();
  return state;
}

/**
 * Tải lại dữ liệu và cho biết nội dung có thực sự thay đổi không.
 * @returns {Promise<{changed: boolean, state: object}>}
 */
export async function reloadSite() {
  const before = signature;
  apply(await siteApi.getPublicSite());
  const changed = signature !== before;

  if (changed) notify();
  return { changed, state };
}

/** Cap nhat cuc bo (dung khi CMS preview) */
export function setState(next) {
  apply(next);
  notify();
}

/**
 * Nhan giao dien do CMS quan ly. Luon co gia tri du phong de trang khong bao gio trong.
 * Dung: t('productDetail') hoac t('productDetail', 'Chi tiet')
 */
export const t = (key, fallback = '') => {
  const value = state?.settings?.labels?.[key];
  return value === undefined || value === null || value === '' ? fallback : value;
};

/** Anh du phong khi mot muc chua co hinh rieng. */
export const placeholder = () => state?.settings?.placeholderImage || '/assets/img/placeholder.svg';

/** Doc gia tri long nhau an toan: pluck('contact.map.zoom', 16) */
export const pluck = (path, fallback = undefined) => {
  const value = String(path)
    .split('.')
    .reduce((acc, key) => (acc == null ? undefined : acc[key]), state);
  return value === undefined || value === null ? fallback : value;
};
