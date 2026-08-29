import db from '../lib/db.js';
import { uid, slugify, pick, isBlank, sanitize } from '../lib/helpers.js';
import { badRequest, notFound } from '../lib/errors.js';

const EDITABLE_FIELDS = [
  'name',
  'slug',
  'category',
  'badge',
  'shortDescription',
  'description',
  'price',
  'image',
  'gallery',
  'specs',
  'featured',
  'enabled',
  'order',
];

const normalizeSpecs = (specs) =>
  (Array.isArray(specs) ? specs : [])
    .filter((spec) => spec && !isBlank(spec.key))
    .map((spec) => ({
      id: spec.id || uid('sp'),
      key: String(spec.key).trim(),
      value: String(spec.value ?? '').trim(),
    }));

const normalize = (rawInput, existing = {}) => {
  const input = sanitize(rawInput ?? {});
  const draft = { ...existing, ...pick(input, EDITABLE_FIELDS) };

  if (isBlank(draft.name)) throw badRequest('Ten san pham khong duoc de trong');

  return {
    ...draft,
    name: String(draft.name).trim(),
    slug: slugify(draft.slug || draft.name),
    category: draft.category || 'khac',
    badge: String(draft.badge ?? '').trim(),
    shortDescription: String(draft.shortDescription ?? '').trim(),
    description: String(draft.description ?? '').trim(),
    price: String(draft.price ?? 'Liên hệ').trim(),
    image: draft.image ?? '',
    gallery: Array.isArray(draft.gallery) ? draft.gallery.filter(Boolean) : [],
    specs: normalizeSpecs(draft.specs),
    featured: Boolean(draft.featured),
    enabled: draft.enabled !== false,
    order: Number.isFinite(Number(draft.order)) ? Number(draft.order) : 999,
  };
};

export async function listProducts({ includeDisabled = true } = {}) {
  const data = await db.read();
  return (data.products ?? [])
    .filter((item) => includeDisabled || item.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getProduct(id) {
  const data = await db.read();
  const product = (data.products ?? []).find((item) => item.id === id);
  if (!product) throw notFound('Khong tim thay san pham');
  return product;
}

export async function createProduct(input) {
  return db.update((data) => {
    data.products = data.products ?? [];
    const maxOrder = data.products.reduce((max, item) => Math.max(max, item.order ?? 0), 0);
    const product = {
      id: uid('p'),
      createdAt: new Date().toISOString(),
      ...normalize({ order: maxOrder + 1, ...input }),
    };
    data.products.push(product);
    return product;
  });
}

export async function updateProduct(id, input) {
  return db.update((data) => {
    const index = (data.products ?? []).findIndex((item) => item.id === id);
    if (index === -1) throw notFound('Khong tim thay san pham');
    const updated = {
      ...data.products[index],
      ...normalize(input, data.products[index]),
      updatedAt: new Date().toISOString(),
    };
    data.products[index] = updated;
    return updated;
  });
}

export async function deleteProduct(id) {
  return db.update((data) => {
    const before = (data.products ?? []).length;
    data.products = (data.products ?? []).filter((item) => item.id !== id);
    if (data.products.length === before) throw notFound('Khong tim thay san pham');
    return { deleted: id };
  });
}

/** Sap xep lai san pham theo mang id gui len. */
export async function reorderProducts(orderedIds = []) {
  if (!Array.isArray(orderedIds)) throw badRequest('Danh sach thu tu khong hop le');
  return db.update((data) => {
    const rank = new Map(orderedIds.map((id, index) => [id, index + 1]));
    data.products = (data.products ?? []).map((item) => ({
      ...item,
      order: rank.get(item.id) ?? item.order ?? 999,
    }));
    return data.products.sort((a, b) => a.order - b.order);
  });
}
