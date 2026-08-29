import config from '../config.js';
import { forbidden, AppError } from '../lib/errors.js';

/**
 * Cac lop bao ve o tang HTTP:
 *  1. securityHeaders  - CSP + cac header chong clickjacking / sniffing
 *  2. originGuard      - chong CSRF bang cach doi chieu Origin/Referer
 *  3. rateLimit        - chong do mat khau (brute force)
 *  4. uploadHeaders    - vo hieu hoa script trong tep tai len (vi du SVG doc hai)
 */

/* ------------------------- 1. Header bao mat ------------------------- */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  // Anh co the den tu chinh server hoac dang data/blob (xem truoc khi tai len)
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  // 'unsafe-inline' chi cho CSS: giao dien dung nhieu thuoc tinh style=""
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Script chi tu chinh server - khong co inline script nao trong du an
  "script-src 'self'",
  "connect-src 'self'",
  // Ban do Google Maps nhung qua iframe
  'frame-src https://www.google.com https://maps.google.com',
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
];

export const securityHeaders = (req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP.join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  if (config.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Khu vuc quan tri: khong cho nhung trong iframe, khong cho bot lap chi muc
  if (req.path.startsWith(config.cmsPath)) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('Cache-Control', 'no-store');
  }

  /**
   * API tra ve noi dung dong - TUYET DOI khong duoc cache.
   * Neu thieu header nay, phan hoi khong co ETag/Last-Modified/Cache-Control
   * se bi trinh duyet tu quyet dinh thoi gian song (heuristic caching),
   * khien noi dung vua sua trong CMS khong hien ra trang web.
   */
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Vary', 'Cookie');
  }

  next();
};

/* --------------------- 2. Chong CSRF theo Origin --------------------- */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const allowedOrigins = (req) => {
  const list = new Set(config.trustedOrigins);
  const host = req.get('host');
  if (host) {
    list.add(`${req.protocol}://${host}`);
    list.add(`https://${host}`);
    list.add(`http://${host}`);
  }
  return list;
};

/**
 * Cookie phien da dung SameSite=Strict; day la lop chan thu hai.
 * Moi request thay doi du lieu phai den tu chinh trang web.
 */
/** Lay origin tu header Origin, neu khong co thi suy ra tu Referer. */
const requestOrigin = (req) => {
  const origin = req.get('origin');
  if (origin && origin !== 'null') return origin;

  const referer = req.get('referer');
  if (!referer) return '';
  try {
    return new URL(referer).origin;
  } catch {
    return 'invalid'; // Referer hong -> coi nhu nguon la, khong lam sap server
  }
};

export const originGuard = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = requestOrigin(req);

  // Khong co Origin/Referer: chi chap nhan neu khong kem cookie phien
  // (vi du goi tu curl/Postman kem Bearer token - khong the bi CSRF).
  if (!origin) {
    if (req.cookies?.[config.auth.cookieName]) {
      return next(forbidden('Yeu cau bi tu choi: thieu Origin'));
    }
    return next();
  }

  if (!allowedOrigins(req).has(origin)) {
    return next(forbidden('Yeu cau tu nguon khong hop le'));
  }

  return next();
};

/* ----------------------- 3. Gioi han dang nhap ----------------------- */
const attempts = new Map(); // key -> { count, firstAt, blockedUntil }

const keyOf = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  return `${ip}|${username}`;
};

/** Don cac ban ghi qua han moi 10 phut de Map khong phinh to. */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, item] of attempts) {
      const expired = now - item.firstAt > config.auth.loginWindowMs;
      const unblocked = !item.blockedUntil || item.blockedUntil < now;
      if (expired && unblocked) attempts.delete(key);
    }
  },
  10 * 60 * 1000,
).unref?.();

export const loginRateLimit = (req, _res, next) => {
  const key = keyOf(req);
  const now = Date.now();
  const item = attempts.get(key);

  if (item?.blockedUntil && item.blockedUntil > now) {
    const minutes = Math.ceil((item.blockedUntil - now) / 60000);
    return next(
      new AppError(429, `Sai quá nhiều lần. Vui lòng thử lại sau ${minutes} phút.`),
    );
  }

  if (item && now - item.firstAt > config.auth.loginWindowMs) attempts.delete(key);

  next();
};

export const recordLoginFailure = (req) => {
  const key = keyOf(req);
  const now = Date.now();
  const item = attempts.get(key) ?? { count: 0, firstAt: now };

  item.count += 1;
  if (item.count >= config.auth.maxLoginAttempts) {
    item.blockedUntil = now + config.auth.lockoutMs;
    item.count = 0;
    item.firstAt = now;
  }

  attempts.set(key, item);
};

export const clearLoginFailures = (req) => attempts.delete(keyOf(req));

/* ---------------- 3a. Gioi han tan suat chung cho /api ---------------- */
const apiHits = new Map(); // ip -> { count, resetAt }
const API_WINDOW_MS = 60 * 1000;
const API_MAX = 240; // ~4 request/giay, du thoai mai cho nguoi dung that

setInterval(() => {
  const now = Date.now();
  for (const [ip, item] of apiHits) if (item.resetAt < now) apiHits.delete(ip);
}, API_WINDOW_MS).unref?.();

/** Chan viec doi hoi API lien tuc (do endpoint, vet can du lieu, DoS nhe). */
export const apiRateLimit = (req, _res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const item = apiHits.get(ip);

  if (!item || item.resetAt < now) {
    apiHits.set(ip, { count: 1, resetAt: now + API_WINDOW_MS });
    return next();
  }

  item.count += 1;
  if (item.count > API_MAX) {
    return next(new AppError(429, 'Quá nhiều yêu cầu. Vui lòng chậm lại.'));
  }
  return next();
};

/* ------------- 3b. Gioi han gui form cong khai (chong spam) ------------- */
const formHits = new Map(); // ip -> { count, firstAt }
const FORM_WINDOW_MS = 10 * 60 * 1000;
const FORM_MAX = 5;

setInterval(() => {
  const now = Date.now();
  for (const [ip, item] of formHits) {
    if (now - item.firstAt > FORM_WINDOW_MS) formHits.delete(ip);
  }
}, FORM_WINDOW_MS).unref?.();

export const publicFormRateLimit = (req, _res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const item = formHits.get(ip);

  if (!item || now - item.firstAt > FORM_WINDOW_MS) {
    formHits.set(ip, { count: 1, firstAt: now });
    return next();
  }

  item.count += 1;
  if (item.count > FORM_MAX) {
    return next(new AppError(429, 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.'));
  }

  return next();
};

/* --------------------- 4. Header cho tep tai len --------------------- */
/**
 * Tep do nguoi dung tai len (nhat la SVG) co the chua script.
 * Sandbox + CSP rong khien tep khong the chay script hay goi mang khi mo truc tiep.
 */
export const uploadHeaders = (_req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};
