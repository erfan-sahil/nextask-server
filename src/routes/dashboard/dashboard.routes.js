import { Router } from 'express';
import { getDashboardOverview } from '../../controllers/dashboard/dashboard.controller.js';
import { authenticate } from '../../middlewares/auth/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', getDashboardOverview);

export default router;
