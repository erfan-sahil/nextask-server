import { Router } from 'express';
import authRoutes from './auth/auth.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'NexTask API is running' });
});

router.use('/auth', authRoutes);

export default router;
