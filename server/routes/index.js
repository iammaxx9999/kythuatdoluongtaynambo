import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import authRoutes from './auth.routes.js';
import contentRoutes from './content.routes.js';
import productRoutes from './product.routes.js';
import mediaRoutes from './media.routes.js';
import messageRoutes from './message.routes.js';

const router = Router();

router.use(optionalAuth);

router.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/media', mediaRoutes);
router.use('/messages', messageRoutes);
router.use('/', contentRoutes);

export default router;
