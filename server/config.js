import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeSiteUrl } from './lib/helpers.js';

// Nap .env neu co. Khong bat buoc: thieu dotenv van chay bang bien moi truong he thong.
try {
  const { default: dotenv } = await import('dotenv');
  dotenv.config();
} catch {
  /* bo qua */
}

const here = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(here, '..');
export const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
export const CMS_DIR = path.join(ROOT_DIR, 'cms');
export const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
/**
 * Thu muc du lieu. Doi duoc qua DATA_DIR de:
 *  - tach du lieu ra o dia khac khi trien khai,
 *  - hoac cho bo kiem thu chay tren du lieu tam, khong dung vao du lieu that.
 */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(here, 'data');
export const DB_FILE = path.join(DATA_DIR, 'db.json');
export const CREDENTIALS_FILE = path.join(DATA_DIR, 'credentials.json');
export const SECRET_FILE = path.join(DATA_DIR, '.jwt-secret');

/**
 * Kiem tra quyen ghi NGAY khi nap cau hinh.
 *
 * Vi sao dat o day chu khong o index.js: db.js va upload.js goi mkdirSync ngay
 * luc import, tuc la TRUOC khi ham bootstrap() chay. De o index.js thi nguoi
 * trien khai nhan duoc mot vet stack "EACCES: mkdir" tho thay vi loi co huong
 * dan. config.js la module ai cung import dau tien nen chan dung cho.
 *
 * Chay app bang user khong co quyen ghi la loi trien khai pho bien nhat.
 */
for (const [dir, label] of [
  [DATA_DIR, 'thư mục dữ liệu (DATA_DIR)'],
  [UPLOAD_DIR, 'thư mục ảnh tải lên (public/uploads)'],
]) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
  } catch {
    console.error('');
    console.error(`  Không ghi được vào ${label}:`);
    console.error(`    ${dir}`);
    console.error('');
    console.error('  Cấp quyền cho user đang chạy app, ví dụ:');
    console.error(`    sudo chown -R $USER "${dir}"`);
    console.error('');
    process.exit(1);
  }
}

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * So tang proxy dang dat truoc ung dung.
 * QUAN TRONG: neu bat trust proxy trong khi KHONG co proxy that, ke tan cong
 * co the gia mao header X-Forwarded-For de vuot qua gioi han so lan dang nhap.
 * Vi vay mac dinh la false; chi bat khi that su chay sau Nginx/Cloudflare.
 */
const parseTrustProxy = (value) => {
  if (value === undefined || value === '' || value === 'false' || value === '0') return false;
  if (value === 'true') return 1;
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : value; // cho phep dat ten mang: 'loopback', '10.0.0.0/8'
};

/** Chuan hoa duong dan CMS: luon bat dau bang '/', khong ket thuc bang '/'. */
const normalizePath = (value, fallback) => {
  const raw = String(value || fallback).trim();
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, '') || fallback;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  isProduction: process.env.NODE_ENV === 'production',

  /** Duong dan truy cap CMS. Doi trong .env de an khoi cac bot do duong dan. */
  cmsPath: normalizePath(process.env.CMS_PATH, '/cms'),

  /**
   * Dia chi that cua website, vi du https://candientutaynambo.com
   *
   * Dung cho sitemap.xml, the canonical va dong log khi khoi dong.
   * Bo trong thi lay theo host cua tung request - chay duoc nhung Google se
   * thay nhieu dia chi cho cung mot trang. Nen dat khi chay that.
   *
   * O "Dia chi website" trong CMS uu tien cao hon bien nay.
   */
  siteUrl: normalizeSiteUrl(process.env.SITE_URL),

  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),

  auth: {
    /** Bo trong trong .env -> server tu sinh chuoi ngau nhien va luu vao SECRET_FILE. */
    secret: process.env.JWT_SECRET || '',
    /** Phiên thường: hết hạn sớm, cookie mất khi đóng trình duyệt. */
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
    /** Khi người dùng tick "Ghi nhớ tôi": phiên sống lâu hơn. */
    rememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
    rememberMaxAgeMs: toInt(process.env.REMEMBER_DAYS, 30) * 24 * 60 * 60 * 1000,
    // Tien to __Host- yeu cau HTTPS -> chi dung o production, dev dung ten thuong
    cookieName:
      process.env.SESSION_COOKIE ||
      (process.env.NODE_ENV === 'production' ? '__Host-cms_session' : 'cms_session'),
    cookieMaxAgeMs: 2 * 24 * 60 * 60 * 1000,
    /** Chong do mat khau: so lan sai toi da trong mot khung thoi gian. */
    maxLoginAttempts: toInt(process.env.MAX_LOGIN_ATTEMPTS, 6),
    loginWindowMs: toInt(process.env.LOGIN_WINDOW_MINUTES, 15) * 60 * 1000,
    lockoutMs: toInt(process.env.LOGIN_LOCKOUT_MINUTES, 15) * 60 * 1000,
  },

  upload: {
    maxBytes: toInt(process.env.UPLOAD_MAX_MB, 15) * 1024 * 1024,
    publicPath: '/uploads',
    /** mime -> duoi tep hop le. Chi chap nhan dung cap nay. */
    allowed: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      'image/avif': ['.avif'],
      'image/svg+xml': ['.svg'],
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
    },
  },

  /** Danh sach origin duoc phep goi API ghi du lieu (chong CSRF). */
  trustedOrigins: (process.env.TRUSTED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
};

export default config;
