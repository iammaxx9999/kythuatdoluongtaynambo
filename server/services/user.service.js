import { verifyPassword, updatePassword, getCredentials } from '../lib/credentials.js';
import { unauthorized, badRequest } from '../lib/errors.js';

/** Mat khau manh: >= 8 ky tu, co chu va so hoac ky tu dac biet. */
const isStrongEnough = (value = '') =>
  String(value).length >= 8 && /[A-Za-z]/.test(value) && /[^A-Za-z]/.test(value);

export async function verifyCredentials(username = '', password = '') {
  const user = verifyPassword(username, password);
  // Thong bao chung chung - khong tiet lo sai ten hay sai mat khau
  if (!user) throw unauthorized('Tên đăng nhập hoặc mật khẩu không đúng');
  return user;
}

export async function changePassword(currentPassword, newPassword) {
  const record = getCredentials();
  if (!record) throw unauthorized();

  if (!verifyPassword(record.username, currentPassword)) {
    throw badRequest('Mật khẩu hiện tại không đúng');
  }
  if (!isStrongEnough(newPassword)) {
    throw badRequest('Mật khẩu mới phải từ 8 ký tự và gồm cả chữ lẫn số/ký tự đặc biệt');
  }
  if (String(newPassword) === String(currentPassword)) {
    throw badRequest('Mật khẩu mới phải khác mật khẩu hiện tại');
  }

  await updatePassword(newPassword);
  return { ok: true };
}

export function currentProfile() {
  const record = getCredentials();
  if (!record) throw unauthorized();
  return { id: 'cms-admin', username: record.username, displayName: record.displayName, role: record.role };
}
