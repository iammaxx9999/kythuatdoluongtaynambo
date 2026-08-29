import { Router } from 'express';
import { asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import {
  getPublicSite,
  getAdminSite,
  getSection,
  patchSection,
  replaceSection,
  CONTENT_SECTIONS,
} from '../services/content.service.js';

const router = Router();

/** Cong khai: toan bo du lieu de render trang chu trong 1 request. */
router.get(
  '/site',
  asyncHandler(async (_req, res) => {
    res.json(await getPublicSite());
  }),
);

/* --- Tu day tro xuong: bat buoc dang nhap --- */

/** CMS: du lieu day du (gom ca muc dang tat). */
router.get(
  '/cms/site',
  requireAuth,
  asyncHandler(async (_req, res) => {
    res.json(await getAdminSite());
  }),
);

router.get('/content', requireAuth, (_req, res) => res.json({ sections: CONTENT_SECTIONS }));

router.get(
  '/content/:section',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await getSection(req.params.section));
  }),
);

router.patch(
  '/content/:section',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await patchSection(req.params.section, req.body));
  }),
);

router.put(
  '/content/:section',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await replaceSection(req.params.section, req.body));
  }),
);

export default router;
