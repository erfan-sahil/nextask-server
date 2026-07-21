import { Router } from 'express';
import {
  previewProjectInvitation,
  acceptProjectInvitation,
} from '../../controllers/project-invitation/projectInvitation.controller.js';
import { authenticate } from '../../middlewares/auth/auth.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  acceptProjectInvitationSchema,
  previewProjectInvitationSchema,
} from '../../validations/project-invitation/projectInvitation.validation.js';

const router = Router();

router.get(
  '/preview',
  validate(previewProjectInvitationSchema),
  previewProjectInvitation
);

router.post(
  '/accept',
  authenticate,
  validate(acceptProjectInvitationSchema),
  acceptProjectInvitation
);

export default router;
