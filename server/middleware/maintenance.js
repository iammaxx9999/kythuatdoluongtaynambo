/**
 * maintenance.js - che do bao tri.
 *
 * Bat trong CMS thi MOI khach vao trang web deu thay trang bao tri, ke ca chu
 * website. Chan o SERVER chu khong phai o trinh duyet: neu chi an bang JavaScript
 * thi noi dung that van nam nguyen trong /api/site, ai xem ma nguon cung doc duoc.
 *
 * Ma tra ve la 503 chu khong phai 200. Voi 503 + Retry-After, Google hieu la
 * "tam thoi nghi, quay lai sau" va GIU nguyen thu hang. Neu tra 200 kem noi dung
 * "dang bao tri", Google se coi day la noi dung that cua trang va ha thu hang -
 * bao tri mot buoi co the mat hang thang de hoi phuc.
 *
 * DIEU QUAN TRONG NHAT: duong vao CMS phai luon mo. Chan ca CMS thi bat bao tri
 * xong khong con cach nao tat, phai vao SSH sua tay db.json.
 */

import config from '../config.js';
import { getPublicSite } from '../services/content.service.js';
import { renderMaintenancePage } from '../lib/maintenance-page.js';

/**
 * Nhung duong dan LUON di qua, du dang bao tri.
 *
 * - CMS: de con tat bao tri
 * - /api/auth: de con dang nhap vao CMS
 * - /healthz: monitoring khong duoc bao dong gia chi vi dang bao tri
 * - /assets, /uploads, favicon: trang bao tri con can logo
 * - /robots.txt: de bot doc duoc chi dan
 */
const isAlwaysAllowed = (req) => {
  const path = req.path;

  if (path === req.baseUrl + config.cmsPath || path.startsWith(`${config.cmsPath}/`) || path === config.cmsPath) {
    return true;
  }
  if (path.startsWith('/api/auth/')) return true;
  if (path === '/healthz' || path === '/robots.txt') return true;
  if (path.startsWith('/assets/') || path.startsWith('/uploads/')) return true;
  if (/^\/favicon\.\w+$/.test(path)) return true;

  return false;
};

export const maintenanceGuard = async (req, res, next) => {
  let site;
  try {
    site = await getPublicSite();
  } catch {
    return next(); // khong doc duoc du lieu thi cu phuc vu binh thuong
  }

  if (!site?.settings?.maintenance?.enabled) return next();
  if (isAlwaysAllowed(req)) return next();

  /**
   * API: nguoi da dang nhap van dung duoc binh thuong, khong thi CMS te liet -
   * khong sua duoc noi dung, khong tai duoc anh, khong tat duoc bao tri.
   * Nguoi la thi bi chan, nen noi dung that khong lo ra ngoai.
   *
   * req.user do optionalAuth dat, chay truoc middleware nay trong app.js.
   */
  if (req.path.startsWith('/api/')) {
    if (req.user) return next();
    return res
      .status(503)
      .set('Retry-After', '3600')
      .set('Cache-Control', 'no-store')
      .json({ error: 'Website đang được bảo trì, vui lòng quay lại sau.' });
  }

  /**
   * Cache-Control: no-store la BAT BUOC.
   * Thieu no thi trinh duyet (va CDN) cat trang bao tri lai; tat bao tri xong
   * khach van thay trang bao tri cho toi khi ho tu xoa cache - loi rat kho tra.
   */
  res
    .status(503)
    .set('Retry-After', '3600')
    .set('Cache-Control', 'no-store, no-cache, must-revalidate')
    .set('X-Robots-Tag', 'noindex, nofollow')
    .type('html')
    .send(renderMaintenancePage(site));
};

export default maintenanceGuard;
