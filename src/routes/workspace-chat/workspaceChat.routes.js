import { Router } from 'express';
import {
  createWorkspaceChatMessage,
  listWorkspaceChatParticipants,
  listWorkspaceChatMessages,
} from '../../controllers/workspace-chat/workspaceChat.controller.js';
import {
  loadWorkspace,
  requireWorkspaceAccess,
} from '../../middlewares/workspace/workspace.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import { z } from 'zod';
import { objectIdSchema, paginationQuerySchema } from '../../validations/common/common.validation.js';
import {
  ensureCanSendMessage,
  ensureCanViewChat,
} from '../../services/workspace-member/memberPermission.helpers.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router({ mergeParams: true });
const workspaceParams = z.object({ workspaceId: objectIdSchema });

router.use(validate(z.object({ params: workspaceParams })), loadWorkspace, requireWorkspaceAccess);
router.get(
  '/members',
  asyncHandler(async (req, _res, next) => {
    if (!req.membership.isProjectScoped) ensureCanViewChat(req.membership);
    next();
  }),
  listWorkspaceChatParticipants,
);
router.get(
  '/',
  validate(z.object({ params: workspaceParams, query: z.object(paginationQuerySchema) })),
  asyncHandler(async (req, _res, next) => {
    if (req.membership.isProjectScoped) {
      next();
      return;
    }
    ensureCanViewChat(req.membership);
    next();
  }),
  listWorkspaceChatMessages,
);
router.post(
  '/',
  validate(z.object({
    params: workspaceParams,
    body: z.object({ content: z.string().trim().min(1).max(5000) }),
  })),
  asyncHandler(async (req, _res, next) => {
    if (req.membership.isProjectScoped) {
      next();
      return;
    }
    ensureCanSendMessage(req.membership);
    next();
  }),
  createWorkspaceChatMessage,
);

export default router;
