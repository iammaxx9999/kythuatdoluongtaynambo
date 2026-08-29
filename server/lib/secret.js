import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import config, { SECRET_FILE } from '../config.js';

/**
 * Khoa ky JWT.
 * - Uu tien bien moi truong JWT_SECRET.
 * - Neu khong co: tu sinh 64 byte ngau nhien va luu vao server/data/.jwt-secret
 *   (nam trong .gitignore, quyen 600). Nho vay phien dang nhap khong mat sau khi
 *   khoi dong lai, va khong co chuoi bi mat nao nam trong ma nguon.
 */
export function resolveJwtSecret() {
  if (config.auth.secret && config.auth.secret.length >= 32) return config.auth.secret;

  if (config.auth.secret) {
    console.warn('[bao mat] JWT_SECRET qua ngan (<32 ky tu) - bo qua va dung khoa tu sinh.');
  }

  try {
    const existing = fs.readFileSync(SECRET_FILE, 'utf8').trim();
    if (existing.length >= 32) return existing;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const generated = crypto.randomBytes(48).toString('base64url');
  fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
  fs.writeFileSync(SECRET_FILE, generated, { encoding: 'utf8', mode: 0o600 });

  if (config.isProduction) {
    console.warn(
      '[bao mat] Chua dat JWT_SECRET trong .env - da tu sinh khoa va luu tai server/data/.jwt-secret. ' +
        'Nen dat JWT_SECRET rieng khi chay nhieu tien trinh (PM2 cluster).',
    );
  }

  return generated;
}

export default resolveJwtSecret;
