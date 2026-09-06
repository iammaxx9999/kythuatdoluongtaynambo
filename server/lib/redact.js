/**
 * redact.js - luoi chan cuoi truoc khi du lieu ra API cong khai.
 *
 * `getPublicSite()` da chon TUNG nhanh duoc phep ra ngoai (danh sach cho phep),
 * nen hom nay khong co gi bi mat lot ra. Tep nay lo cho NGAY MAI: chi can ai
 * them mot o kieu "Khoa API Google Maps" hay "Mat khau SMTP" vao nhanh settings
 * la no se ra thang /api/site, ma khong co gi bao dong.
 *
 * Nen o day quet TEN KHOA: khoa nao nghe nhu bi mat thi bi bo khoi phan hoi
 * cong khai. Du lieu goc trong db.json khong doi - CMS van doc va sua binh
 * thuong qua /api/cms/site (da yeu cau dang nhap).
 *
 * Day la lop PHONG THU BO SUNG, khong phai lop chinh. Bi mat that thi dung de
 * trong db.json ngay tu dau: de trong bien moi truong hoac tep rieng.
 */

/**
 * Tu khoa cam. So khop theo TU, khong phai chuoi con - nen 'keywords' (tu khoa
 * SEO) khong bi ket vi no tach ra thanh mot tu duy nhat la 'keywords'.
 */
const FORBIDDEN_WORDS = new Set([
  'password',
  'passwd',
  'pwd',
  'passphrase',
  'secret',
  'secrets',
  'token',
  'tokens',
  'credential',
  'credentials',
  'signature',
  'bearer',
  'jwt',
  'otp',
  'hash',
]);

/**
 * 'key' MOT MINH khong phai bi mat.
 *
 * Bang thong so san pham dung dung cau truc { key: 'Tải trọng', value: '60kg' }.
 * Cam thang tu 'key' la xoa sach nhan thong so cua moi san pham tren trang -
 * loi nay da bi bat khi doi chieu bo loc voi du lieu that.
 *
 * Nen 'key' chi bi coi la bi mat khi co tu dinh tinh dung truoc: apiKey,
 * privateKey, accessKey, clientKey...
 */
const KEY_QUALIFIERS = new Set([
  'api',
  'secret',
  'private',
  'public',
  'access',
  'auth',
  'sign',
  'signing',
  'encryption',
  'crypt',
  'app',
  'client',
  'master',
  'service',
  'ssh',
  'pgp',
  'gpg',
  'license',
  'licence',
  'session',
]);

/**
 * Tach ten khoa thanh cac tu: 'apiKey' -> ['api','key'], 'api_key' -> ['api','key'].
 */
const wordsOf = (key) =>
  String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .map((word) => word.toLowerCase())
    .filter(Boolean);

/** Ten khoa nay co nghe nhu mot bi mat khong? */
export const isSecretKey = (key) => {
  const words = wordsOf(key);
  if (words.some((word) => FORBIDDEN_WORDS.has(word))) return true;

  // 'key' co tu dinh tinh dung truoc: apiKey, privateKey, accessKey...
  return words.some((word, i) => word === 'key' && i > 0 && KEY_QUALIFIERS.has(words[i - 1]));
};

/**
 * Tra ve BAN SAO da bo cac khoa nghe nhu bi mat. Khong sua du lieu goc.
 *
 * @param {*} node
 * @param {string[]} removed  danh sach duong dan bi bo (de log/kiem thu)
 */
export function redactSecrets(node, removed = [], trail = '', depth = 0) {
  if (depth > 12) return node; // du lieu long sau bat thuong -> dung lai
  if (Array.isArray(node)) return node.map((item, i) => redactSecrets(item, removed, `${trail}[${i}]`, depth + 1));
  if (!node || typeof node !== 'object') return node;

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    const path = trail ? `${trail}.${key}` : key;
    if (isSecretKey(key)) {
      removed.push(path);
      continue;
    }
    out[key] = redactSecrets(value, removed, path, depth + 1);
  }
  return out;
}

export default redactSecrets;
