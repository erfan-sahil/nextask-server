import { Router } from 'express';
import {
  createWorkspaceMember,
  listWorkspaceMembers,
  getWorkspaceMember,
  updateWorkspaceMember,
  deleteWorkspaceMember,
} from '../../controllers/workspace-member/workspaceMember.controller.js';
import {
  loadWorkspaceByWorkspaceId,
  requireWorkspaceMemberView,
  loadWorkspaceMember,
} from '../../middlewares/workspace-member/workspaceMember.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
  workspaceMemberIdSchema,
  listWorkspaceMembersSchema,
} from '../../validations/workspace-member/workspaceMember.validation.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);

router.post('/', validate(createWorkspaceMemberSchema), createWorkspaceMember);

router.get(
  '/',
  validate(listWorkspaceMembersSchema),
  requireWorkspaceMemberView,
  listWorkspaceMembers
);

router.get(
  '/:memberId',
  validate(workspaceMemberIdSchema),
  requireWorkspaceMemberView,
  getWorkspaceMember
);

router.patch(
  '/:memberId',
  validate(updateWorkspaceMemberSchema),
  loadWorkspaceMember,
  updateWorkspaceMember
);

router.delete(
  '/:memberId',
  validate(workspaceMemberIdSchema),
  loadWorkspaceMember,
  deleteWorkspaceMember
);

export default router;
