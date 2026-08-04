import { Router } from 'express';
import {
  previewWorkspaceInvitation,
  acceptWorkspaceInvitation,
} from '../../controllers/workspace-invitation/workspaceInvitation.controller.js';
import { authenticate } from '../../middlewares/auth/auth.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  acceptWorkspaceInvitationSchema,
  previewWorkspaceInvitationSchema,
} from '../../validations/workspace-invitation/workspaceInvitation.validation.js';

const router = Router();

router.get('/preview', validate(previewWorkspaceInvitationSchema), previewWorkspaceInvitation);

router.post(
  '/accept',
  authenticate,
  validate(acceptWorkspaceInvitationSchema),
  acceptWorkspaceInvitation
);

export default router;
