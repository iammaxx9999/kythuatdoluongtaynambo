import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import config, { UPLOAD_DIR } from '../config.js';
import { slugify } from '../lib/helpers.js';
import { badRequest } from '../lib/errors.js';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),

  // Ten tep hoan toan do server sinh: khong lay ky tu nao tu nguoi dung
  // ngoai phan slug da lam sach -> khong the vuot thu muc (path traversal).
  filename: (_req, file, cb) => {
    const allowedExts = config.upload.allowed[file.mimetype] ?? [];
    const ext = allowedExts[0] ?? '';
    const base = slugify(path.basename(file.originalname, path.extname(file.originalname))) || 'tep';
    const stamp = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `${base}-${stamp}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedExts = config.upload.allowed[file.mimetype];
  if (!allowedExts) {
    return cb(badRequest(`Định dạng không được hỗ trợ: ${file.mimetype}`));
  }

  // Duoi tep phai khop voi kieu MIME khai bao
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext && !allowedExts.includes(ext)) {
    return cb(badRequest(`Đuôi tệp "${ext}" không khớp với định dạng ${file.mimetype}`));
  }

  return cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxBytes,
    files: 20,
    fields: 10,
    parts: 30,
  },
});

export default upload;
