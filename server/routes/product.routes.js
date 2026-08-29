import { Router } from 'express';
import { asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
} from '../services/product.service.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const isAdmin = Boolean(req.user);
    res.json(await listProducts({ includeDisabled: isAdmin }));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getProduct(req.params.id));
  }),
);

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.status(201).json(await createProduct(req.body ?? {}));
  }),
);

router.post(
  '/reorder',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await reorderProducts(req.body?.ids ?? []));
  }),
);

router.put(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await updateProduct(req.params.id, req.body ?? {}));
  }),
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await deleteProduct(req.params.id));
  }),
);

export default router;
