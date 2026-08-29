import { Router } from 'express';
import { asyncHandler } from '../lib/errors.js';
import { requireAuth, signToken, setAuthCookie, clearAuthCookie } from '../middleware/auth.js';
import { loginRateLimit, recordLoginFailure, clearLoginFailures } from '../middleware/security.js';
import { verifyCredentials, changePassword, currentProfile } from '../services/user.service.js';

const router = Router();

router.post(
  '/login',
  loginRateLimit,
  asyncHandler(async (req, res) => {
    try {
      const user = await verifyCredentials(req.body?.username, req.body?.password);
      clearLoginFailures(req);

      // "Ghi nho toi" chi keo dai tuoi tho phien - KHONG luu mat khau o bat cu dau
      const remember = req.body?.remember === true;
      setAuthCookie(res, signToken(user, remember), remember);

      res.json({ user, remember });
    } catch (error) {
      recordLoginFailure(req);
      throw error;
    }
  }),
);

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (_req, res) => {
  res.json({ user: currentProfile() });
});

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    await changePassword(req.body?.currentPassword, req.body?.newPassword);
    // Doi mat khau -> huy phien hien tai, bat dang nhap lai
    clearAuthCookie(res);
    res.json({ ok: true, reauth: true });
  }),
);

export default router;
