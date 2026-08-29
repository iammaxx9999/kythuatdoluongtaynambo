import db from '../lib/db.js';
import { deepMerge, sanitize } from '../lib/helpers.js';
import { badRequest } from '../lib/errors.js';

/** Cac nhanh noi dung ma CMS duoc phep sua. */
export const CONTENT_SECTIONS = [
  'settings',
  'hero',
  'home',
  'about',
  'productsSection',
  'contact',
  'floatingContact',
];

/** Du lieu cong khai cho trang chu (khong gom user, message). */
export async function getPublicSite() {
  const data = await db.read();
  const products = [...(data.products ?? [])]
    .filter((item) => item.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    settings: data.settings,
    hero: {
      ...data.hero,
      slides: (data.hero?.slides ?? []).filter((slide) => slide.enabled !== false),
    },
    home: data.home,
    about: data.about,
    productsSection: data.productsSection,
    products,
    contact: data.contact,
    floatingContact: {
      ...data.floatingContact,
      // Thu tu hien thi = thu tu trong mang (CMS keo tha de sap xep)
      channels: (data.floatingContact?.channels ?? []).filter((channel) => channel.enabled !== false),
    },
  };
}

/** Du lieu day du cho CMS (van khong tra password hash). */
export async function getAdminSite() {
  const data = await db.read();
  const { users, ...rest } = data;
  return rest;
}

export async function getSection(section) {
  assertSection(section);
  const data = await db.read();
  return data[section];
}

/** PATCH: gop patch vao section hien co. */
export async function patchSection(section, patch) {
  assertSection(section);
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw badRequest('Du lieu cap nhat khong hop le');
  }
  const safePatch = sanitize(patch);
  return db.update((data) => {
    data[section] = deepMerge(data[section] ?? {}, safePatch);
    return data[section];
  });
}

/** PUT: thay the toan bo section. */
export async function replaceSection(section, value) {
  assertSection(section);
  if (!value || typeof value !== 'object') throw badRequest('Du lieu khong hop le');
  const safeValue = sanitize(value);
  return db.update((data) => {
    data[section] = safeValue;
    return data[section];
  });
}

function assertSection(section) {
  if (!CONTENT_SECTIONS.includes(section)) {
    throw badRequest(`Section khong hop le: ${section}`);
  }
}
