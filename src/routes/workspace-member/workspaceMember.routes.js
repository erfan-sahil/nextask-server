import { Router } from 'express';
import {
  inviteWorkspaceMember,
  listWorkspaceMembers,
  getWorkspaceMember,
  updateWorkspaceMember,
  deleteWorkspaceMember,
} from '../../controllers/workspace-member/workspaceMember.controller.js';
import {
  loadWorkspaceByWorkspaceId,
  requireWorkspaceMemberView,
  loadWorkspaceMember,
  loadActorMembership,
} from '../../middlewares/workspace-member/workspaceMember.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  inviteWorkspaceMemberSchema,
  updateWorkspaceMemberSchema,
  workspaceMemberIdSchema,
  listWorkspaceMembersSchema,
} from '../../validations/workspace-member/workspaceMember.validation.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);

router.post('/', validate(inviteWorkspaceMemberSchema), inviteWorkspaceMember);

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
  loadActorMembership,
  loadWorkspaceMember,
  updateWorkspaceMember
);

router.delete(
  '/:memberId',
  validate(workspaceMemberIdSchema),
  loadActorMembership,
  loadWorkspaceMember,
  deleteWorkspaceMember
);

export default router;
