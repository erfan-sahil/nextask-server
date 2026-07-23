import { Router } from 'express';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../controllers/notification/notification.controller.js';
import { authenticate } from '../../middlewares/auth/auth.middleware.js';

const router = Router();

router.use(authenticate);
router.get('/', listNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:notificationId/read', markNotificationRead);

export default router;
