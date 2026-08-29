import multer from 'multer';
import config from '../config.js';

export const notFoundHandler = (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Khong tim thay endpoint' });
  }
  return next();
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, _next) => {
  let status = error.status || 500;
  let message = error.expose ? error.message : 'Loi he thong, vui long thu lai';

  if (error instanceof multer.MulterError) {
    status = 400;
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `File vuot qua gioi han ${Math.round(config.upload.maxBytes / 1024 / 1024)}MB`
        : `Loi tai file: ${error.code}`;
  }

  if (status >= 500) {
    console.error('[error]', req.method, req.originalUrl, error);
  }

  res.status(status).json({
    error: message,
    ...(error.details ? { details: error.details } : {}),
  });
};
