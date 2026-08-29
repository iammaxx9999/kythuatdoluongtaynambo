import jwt from 'jsonwebtoken';
import config from '../config.js';
import { resolveJwtSecret } from '../lib/secret.js';
import { getCredentials } from '../lib/credentials.js';
import { unauthorized } from '../lib/errors.js';

const SECRET = resolveJwtSecret();

/**
 * Thu hoi token cu: moi token ky TRUOC lan doi mat khau gan nhat deu bi tu choi.
 * Nho vay, neu ai do lay duoc cookie phien, chi can doi mat khau la phien do het hieu luc
 * (khong phai doi den khi token het han).
 */
const isRevoked = (payload) => {
  const changedAt = getCredentials()?.updatedAt;
  if (!changedAt || !payload) return false;
  const changedAtMs = new Date(changedAt).getTime();

  // Chuẩn JWT chỉ có `iat` theo giây (làm tròn xuống) nên so sánh sẽ lệch tới một giây:
  // hoặc bỏ lọt token cũ, hoặc từ chối oan token vừa cấp. Ta tự thêm `ms` để so chính xác.
  if (typeof payload.ms === 'number') return payload.ms < changedAtMs;

  // Token đời cũ không có `ms`: làm tròn lên, thà bắt đăng nhập lại còn hơn bỏ lọt.
  if (!payload.iat) return false;
  return payload.iat < Math.ceil(changedAtMs / 1000);
};

const decode = (token) => {
  const payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
  if (isRevoked(payload)) throw new Error('token da bi thu hoi');
  return payload;
};

const readToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.[config.auth.cookieName] || null;
};

/**
 * Phien "Ghi nho toi" tu gia han: moi khi token da di qua nua doi,
 * cap lai cookie moi. Nguoi dung con vao CMS deu dan thi khong bao gio
 * bi da ra giua chung, ma phien bo hoang van tu het han dung han.
 */
const renewIfStale = (req, res) => {
  const payload = req.user;
  if (!payload?.rmb || !payload.iat || !payload.exp) return;

  const now = Math.floor(Date.now() / 1000);
  const lifetime = payload.exp - payload.iat;
  if (now - payload.iat < lifetime / 2) return; // con moi, khong can lam gi

  setAuthCookie(
    res,
    signToken({ id: payload.sub, username: payload.username, role: payload.role, displayName: payload.name }, true),
    true,
  );
};

/** Bat buoc dang nhap. Gan req.user neu hop le. */
export const requireAuth = (req, res, next) => {
  const token = readToken(req);
  if (!token) return next(unauthorized());

  try {
    req.user = decode(token);
    renewIfStale(req, res);
    return next();
  } catch {
    return next(unauthorized('Phiên đăng nhập đã hết hạn'));
  }
};

/** Khong bat buoc - chi gan req.user neu co token hop le. */
export const optionalAuth = (req, _res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      req.user = decode(token);
    } catch {
      /* bo qua token hong hoac da bi thu hoi */
    }
  }
  next();
};

/**
 * @param {object} user
 * @param {boolean} remember  true = phien dai ngay (nguoi dung tick "Ghi nho toi")
 */
export const signToken = (user, remember = false) =>
  jwt.sign(
    // rmb: danh dau phien co "Ghi nho toi" -> dung de tu gia han ve sau
    // ms : thoi diem ky theo mili giay -> so chinh xac khi kiem tra thu hoi phien
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      name: user.displayName,
      rmb: remember,
      ms: Date.now(),
    },
    SECRET,
    {
      expiresIn: remember ? config.auth.rememberExpiresIn : config.auth.expiresIn,
      algorithm: 'HS256',
    },
  );

export const setAuthCookie = (res, token, remember = false) => {
  res.cookie(config.auth.cookieName, token, {
    httpOnly: true, // JavaScript trong trinh duyet khong doc duoc
    sameSite: 'strict', // khong gui kem khi den tu trang khac -> chan CSRF
    secure: config.isProduction, // chi gui qua HTTPS khi chay that
    // Khong ghi nho -> cookie phien: tu mat khi dong trinh duyet.
    // Co ghi nho -> song 30 ngay.
    ...(remember ? { maxAge: config.auth.rememberMaxAgeMs } : {}),
    path: '/',
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(config.auth.cookieName, {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.isProduction,
    path: '/',
  });
};
