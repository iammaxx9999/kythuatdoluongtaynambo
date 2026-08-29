import { Router } from 'express';
import { asyncHandler, badRequest } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { listMedia, saveUploads, deleteMedia } from '../services/media.service.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await listMedia());
  }),
);

router.post(
  '/',
  upload.array('files', 20),
  asyncHandler(async (req, res) => {
    if (!req.files?.length) throw badRequest('Chua chon tep nao');
    res.status(201).json(await saveUploads(req.files, req.user.username));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await deleteMedia(req.params.id));
  }),
);

export default router;
