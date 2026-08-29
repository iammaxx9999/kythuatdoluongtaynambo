import fs from 'node:fs/promises';
import path from 'node:path';
import db from '../lib/db.js';
import config, { UPLOAD_DIR } from '../config.js';
import { uid } from '../lib/helpers.js';
import { notFound } from '../lib/errors.js';

/** Đoán kiểu MIME từ đuôi tệp — chỉ dùng khi quét lại thư mục uploads. */
const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

/**
 * Quét thư mục public/uploads, thêm vào bộ sưu tập những tệp có trên ổ đĩa
 * nhưng chưa có trong danh sách.
 *
 * Dùng để: khôi phục sau khi db.json bị mất/đặt lại, hoặc khi bạn chép tay
 * một loạt ảnh vào thư mục uploads thay vì tải qua CMS.
 */
export async function syncFromDisk() {
  let files = [];
  try {
    files = await fs.readdir(UPLOAD_DIR);
  } catch {
    return []; // chưa có thư mục uploads
  }

  const data = await db.read();
  const known = new Set((data.media ?? []).map((item) => item.filename));
  const recovered = [];

  for (const filename of files) {
    if (filename.startsWith('.') || known.has(filename)) continue;

    const ext = path.extname(filename).toLowerCase();
    const mimetype = MIME_BY_EXT[ext];
    if (!mimetype) continue; // bỏ qua tệp lạ

    let stat;
    try {
      stat = await fs.stat(path.join(UPLOAD_DIR, filename));
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;

    recovered.push({
      id: uid('m'),
      filename,
      originalName: filename,
      url: `${config.upload.publicPath}/${filename}`,
      mimetype,
      kind: mimetype.startsWith('video/') ? 'video' : 'image',
      size: stat.size,
      uploadedBy: 'quét thư mục',
      createdAt: stat.mtime.toISOString(),
    });
  }

  if (recovered.length) {
    await db.update((current) => {
      current.media = [...(current.media ?? []), ...recovered];
      return current.media;
    });
  }

  return recovered;
}

export async function listMedia() {
  const data = await db.read();
  return [...(data.media ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function saveUploads(files = [], uploadedBy = 'system') {
  const records = files.map((file) => ({
    id: uid('m'),
    filename: file.filename,
    originalName: file.originalname,
    url: `${config.upload.publicPath}/${file.filename}`,
    mimetype: file.mimetype,
    kind: file.mimetype.startsWith('video/') ? 'video' : 'image',
    size: file.size,
    uploadedBy,
    createdAt: new Date().toISOString(),
  }));

  await db.update((data) => {
    data.media = [...(data.media ?? []), ...records];
    return data.media;
  });

  return records;
}

export async function deleteMedia(id) {
  const record = await db.update((data) => {
    const index = (data.media ?? []).findIndex((item) => item.id === id);
    if (index === -1) throw notFound('Khong tim thay tep');
    const [removed] = data.media.splice(index, 1);
    return removed;
  });

  // Xoa file vat ly - loi khong chan luong chinh
  try {
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(record.filename)));
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('[media] khong xoa duoc file:', error.message);
  }

  return { deleted: id };
}
