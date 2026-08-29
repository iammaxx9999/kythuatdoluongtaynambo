import crypto from 'node:crypto';

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`;

/** Bo dau tieng Viet + chuyen thanh slug an toan cho URL. */
export const slugify = (text = '') =>
  String(text)
    .normalize('NFD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/** Chi giu lai cac key duoc phep -> tranh client gui rac vao db. */
export const pick = (source = {}, keys = []) =>
  keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});

/**
 * Khoa nguy hiem: neu de lot vao object se lam hong prototype cua toan bo tien trinh
 * (prototype pollution). Moi du lieu tu client deu phai di qua sanitize().
 */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Sao chep sau va loai bo cac khoa nguy hiem. */
export const sanitize = (value, depth = 0) => {
  if (depth > 20) return undefined; // chan JSON long nhau qua sau
  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
  if (value === null || typeof value !== 'object') return value;

  const output = Object.create(null);
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    output[key] = sanitize(item, depth + 1);
  }
  // Tra ve object thuong de JSON.stringify hoat dong binh thuong
  return { ...output };
};

/** Gop object long nhau (deep merge) - dung cho PATCH cau hinh. */
export const deepMerge = (target, patch) => {
  if (Array.isArray(patch) || patch === null || typeof patch !== 'object') return patch;
  const output = { ...(target ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    output[key] = deepMerge(output[key], value);
  }
  return output;
};

export const clampText = (value, max = 5000) => String(value ?? '').trim().slice(0, max);

export const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

/**
 * Chuan hoa dia chi goc cua website (dung cho sitemap, canonical, log khoi dong).
 *
 * Chi nhan http:// hoac https:// tuyet doi, bo dau / o cuoi. Khong hop le -> ''.
 *
 * LUU Y: trinh duyet co ban sao cung quy tac o public/assets/js/core/dom.js
 * (originUrl). Doi mot ben thi phai doi ben kia - test/deploy.mjs doi chieu
 * ca hai tren cung mot bang du lieu.
 */
export const normalizeSiteUrl = (value) => {
  // Bo ky tu dieu khien truoc khi so khop, khong thi "http:\n//x" lot qua duoc
  const url = String(value ?? '')
    .trim()
    .replace(/[\u0000-\u0020]/g, '');
  if (!/^https?:\/\/[^/?#\s]+/i.test(url)) return '';
  return url.replace(/\/+$/, '');
};
