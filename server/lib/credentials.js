import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { CREDENTIALS_FILE, DATA_DIR } from '../config.js';

/**
 * Tai khoan CMS duoc luu trong MOT tep rieng: server/data/credentials.json
 * (tach khoi db.json de sao luu noi dung ma khong keo theo thong tin dang nhap).
 *
 * Quy uoc:
 *  - Tep co the chua { "username": "...", "password": "mat khau thuong" }
 *    -> ngay khi server khoi dong, mat khau duoc bam bcrypt va tep bi ghi de,
 *       chuoi thuong bien mat khoi o dia.
 *  - Trang thai on dinh: { "username": "...", "passwordHash": "$2a$...", "updatedAt": "..." }
 *  - Muon dat lai mat khau: sua tep, them lai khoa "password", khoi dong lai server.
 *
 * Tep nam trong .gitignore -> khong bao gio bi day len git.
 */

const BCRYPT_ROUNDS = 12;

// Hash gia de so sanh khi khong tim thay tai khoan -> thoi gian phan hoi deu nhau,
// tranh do ten dang nhap qua do tre.
const DUMMY_HASH = bcrypt.hashSync('khong-bao-gio-trung-khop', 10);

let cache = null;

const writeFileSecure = async (file, content) => {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, content, { encoding: 'utf8', mode: 0o600 });
  try {
    await fsp.chmod(file, 0o600); // khong hieu luc tren Windows, bo qua loi
  } catch {
    /* bo qua */
  }
};

const readFileSafe = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error(`Tep tai khoan hong hoac sai dinh dang JSON: ${file}`);
  }
};

/**
 * Doc tep tai khoan, bam mat khau dang thuong (neu co) va ghi de lai tep.
 * Goi mot lan luc khoi dong server.
 */
export async function initCredentials({ defaultUsername, defaultPassword } = {}) {
  let record = readFileSafe(CREDENTIALS_FILE);
  let mustWrite = false;

  if (!record) {
    if (!defaultPassword) {
      throw new Error(
        `Chua co tep tai khoan ${CREDENTIALS_FILE}. Tao tep voi noi dung {"username":"...","password":"..."} roi chay lai.`,
      );
    }
    record = { username: defaultUsername || 'admin', password: defaultPassword };
    mustWrite = true;
  }

  // Chuyen mat khau dang thuong -> bam
  if (record.password) {
    if (String(record.password).length < 8) {
      throw new Error('Mat khau CMS phai tu 8 ky tu tro len. Sua lai server/data/credentials.json.');
    }
    record = {
      username: String(record.username || 'admin').trim(),
      displayName: record.displayName || 'Quản trị viên',
      passwordHash: bcrypt.hashSync(String(record.password), BCRYPT_ROUNDS),
      role: 'admin',
      updatedAt: new Date().toISOString(),
    };
    mustWrite = true;
  }

  if (!record.passwordHash) {
    throw new Error(`Tep ${CREDENTIALS_FILE} thieu "passwordHash" hoac "password".`);
  }

  record.username = String(record.username || 'admin').trim();
  record.displayName = record.displayName || 'Quản trị viên';
  record.role = 'admin';

  if (mustWrite) await writeFileSecure(CREDENTIALS_FILE, JSON.stringify(record, null, 2));

  cache = record;
  return { username: record.username, rehashed: mustWrite };
}

export const getCredentials = () => {
  if (!cache) cache = readFileSafe(CREDENTIALS_FILE);
  return cache;
};

/** So sanh mat khau. Luon chay bcrypt de thoi gian phan hoi khong to lo tai khoan. */
export function verifyPassword(username, password) {
  const record = getCredentials();
  const matchUser =
    !!record && String(username).trim().toLowerCase() === String(record.username).toLowerCase();
  const matchPass = bcrypt.compareSync(String(password ?? ''), matchUser ? record.passwordHash : DUMMY_HASH);

  if (!matchUser || !matchPass) return null;
  return {
    id: 'cms-admin',
    username: record.username,
    displayName: record.displayName,
    role: record.role || 'admin',
  };
}

export async function updatePassword(newPassword) {
  const record = getCredentials();
  const next = {
    ...record,
    passwordHash: bcrypt.hashSync(String(newPassword), BCRYPT_ROUNDS),
    updatedAt: new Date().toISOString(),
  };
  delete next.password;
  await writeFileSecure(CREDENTIALS_FILE, JSON.stringify(next, null, 2));
  cache = next;
  return true;
}

export { DATA_DIR };
