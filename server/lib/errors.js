/**
 * Loi co chu dich (operational error) - duoc tra ve client kem status code.
 */
export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.details = details;
    this.expose = true;
  }
}

export const badRequest = (message, details) => new AppError(400, message, details);
export const unauthorized = (message = 'Ban chua dang nhap') => new AppError(401, message);
export const forbidden = (message = 'Khong co quyen thuc hien') => new AppError(403, message);
export const notFound = (message = 'Khong tim thay du lieu') => new AppError(404, message);

/**
 * Bao boc handler async de khong phai try/catch trong tung route.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
