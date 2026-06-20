import { Router } from 'express';
import authRoutes from './auth/auth.routes.js';
import workspaceRoutes from './workspace/workspace.routes.js';
import workspaceInvitationRoutes from './workspace-invitation/workspaceInvitation.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'NexTask API is running' });
});

router.use('/auth', authRoutes);
router.use('/workspaces/invitations', workspaceInvitationRoutes);
router.use('/workspaces', workspaceRoutes);

export default router;
