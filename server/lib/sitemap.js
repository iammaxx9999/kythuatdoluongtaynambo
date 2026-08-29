/**
 * sitemap.js - sinh sitemap.xml va xac dinh dia chi goc that cua website.
 *
 * Thu tu uu tien khi tim dia chi goc:
 *   1. O "Dia chi website" trong CMS (settings.siteUrl) - de doi nhat, khong
 *      can vao SSH sua .env roi khoi dong lai.
 *   2. Bien SITE_URL trong .env - dung khi chua kip vao CMS dat.
 *   3. Host cua chinh request - chay duoc ngay, nhung sau proxy thi phai bat
 *      TRUST_PROXY moi lay dung, va Google se thay nhieu dia chi cho mot trang.
 */

import config from '../config.js';
import { getPublicSite } from '../services/content.service.js';
import { normalizeSiteUrl } from './helpers.js';

/** Dia chi goc suy ra tu chinh request (phuong an cuoi). */
const urlFromRequest = (req) => {
  const host = req.get('host');
  if (!host) return '';
  // req.protocol da tinh X-Forwarded-Proto neu trust proxy duoc bat
  return normalizeSiteUrl(`${req.protocol}://${host}`);
};

/**
 * @param {import('express').Request} req
 * @returns {Promise<string>} vi du "https://candientutaynambo.com" (khong co / o cuoi)
 */
export async function resolveSiteUrl(req) {
  let fromCms = '';
  try {
    const site = await getPublicSite();
    fromCms = normalizeSiteUrl(site?.settings?.siteUrl);
  } catch {
    /* khong doc duoc du lieu thi bo qua, con hai phuong an duoi */
  }

  return fromCms || config.siteUrl || urlFromRequest(req);
}

const escapeXml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/**
 * Trang nay la ONE-PAGE: moi khu vuc la mot neo tren cung mot trang.
 * Google khong coi "#neo" la trang rieng nen sitemap chi liet ke trang goc.
 * San pham cung khong co URL rieng (mo bang cua so chi tiet) nen khong liet ke
 * - khai bao URL khong ton tai chi lam Search Console bao loi 404.
 */
export async function buildSitemap(req) {
  const base = await resolveSiteUrl(req);
  const today = new Date().toISOString().slice(0, 10);

  const urls = [{ loc: base || '/', changefreq: 'weekly', priority: '1.0', lastmod: today }];

  const body = urls
    .map(
      (url) =>
        `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n` +
        `    <lastmod>${url.lastmod}</lastmod>\n` +
        `    <changefreq>${url.changefreq}</changefreq>\n` +
        `    <priority>${url.priority}</priority>\n  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export const sitemapHandler = async (req, res, next) => {
  try {
    res.type('application/xml').send(await buildSitemap(req));
  } catch (error) {
    next(error);
  }
};
