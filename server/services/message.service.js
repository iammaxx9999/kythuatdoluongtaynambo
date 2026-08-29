import db from '../lib/db.js';
import { uid, clampText, isBlank } from '../lib/helpers.js';
import { badRequest, notFound } from '../lib/errors.js';

const PHONE_RE = /^[0-9+()\s.-]{8,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function listMessages() {
  const data = await db.read();
  return [...(data.messages ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function createMessage(input = {}) {
  const name = clampText(input.name, 120);
  const phone = clampText(input.phone, 30);
  const email = clampText(input.email, 160);
  const subject = clampText(input.subject, 120);
  const company = clampText(input.company, 160);
  const content = clampText(input.content, 4000);

  const errors = {};
  if (isBlank(name)) errors.name = 'Vui lòng nhập họ tên';
  if (isBlank(phone) && isBlank(email)) errors.phone = 'Cần ít nhất số điện thoại hoặc email';
  if (!isBlank(phone) && !PHONE_RE.test(phone)) errors.phone = 'Số điện thoại không hợp lệ';
  if (!isBlank(email) && !EMAIL_RE.test(email)) errors.email = 'Email không hợp lệ';
  if (isBlank(content)) errors.content = 'Vui lòng nhập nội dung cần tư vấn';

  if (Object.keys(errors).length > 0) throw badRequest('Dữ liệu chưa hợp lệ', errors);

  return db.update((data) => {
    const message = {
      id: uid('msg'),
      name,
      phone,
      email,
      company,
      subject: subject || 'Khác',
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };
    data.messages = [message, ...(data.messages ?? [])].slice(0, 1000);
    return message;
  });
}

export async function markRead(id, read = true) {
  return db.update((data) => {
    const message = (data.messages ?? []).find((item) => item.id === id);
    if (!message) throw notFound('Khong tim thay tin nhan');
    message.read = Boolean(read);
    return message;
  });
}

export async function deleteMessage(id) {
  return db.update((data) => {
    const before = (data.messages ?? []).length;
    data.messages = (data.messages ?? []).filter((item) => item.id !== id);
    if (data.messages.length === before) throw notFound('Khong tim thay tin nhan');
    return { deleted: id };
  });
}
