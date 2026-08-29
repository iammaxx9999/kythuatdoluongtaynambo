import { Router } from 'express';
import { asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { publicFormRateLimit } from '../middleware/security.js';
import { listMessages, createMessage, markRead, deleteMessage } from '../services/message.service.js';

const router = Router();

/** Cong khai: form lien he tren trang chu (co gioi han so lan gui de chong spam). */
router.post(
  '/',
  publicFormRateLimit,
  asyncHandler(async (req, res) => {
    const message = await createMessage(req.body ?? {});
    res.status(201).json({ ok: true, id: message.id });
  }),
);

router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json(await listMessages());
  }),
);

router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await markRead(req.params.id, req.body?.read !== false));
  }),
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await deleteMessage(req.params.id));
  }),
);

export default router;
