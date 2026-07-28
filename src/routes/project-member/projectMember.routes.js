import { Router } from 'express';
import {
  inviteProjectMember,
  listProjectMembers,
  getProjectMember,
  updateProjectMember,
  deleteProjectMember,
} from '../../controllers/project-member/projectMember.controller.js';
import {
  loadProjectContext,
  requireProjectMemberView,
  loadProjectMember,
} from '../../middlewares/project-member/projectMember.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  inviteProjectMemberSchema,
  updateProjectMemberSchema,
  projectMemberIdSchema,
  listProjectMembersSchema,
} from '../../validations/project-member/projectMember.validation.js';

const router = Router({ mergeParams: true });

router.use(loadProjectContext);

router.post('/', validate(inviteProjectMemberSchema), inviteProjectMember);

router.get('/', validate(listProjectMembersSchema), requireProjectMemberView, listProjectMembers);

router.get(
  '/:memberId',
  validate(projectMemberIdSchema),
  requireProjectMemberView,
  getProjectMember
);

router.patch(
  '/:memberId',
  validate(updateProjectMemberSchema),
  loadProjectMember,
  updateProjectMember
);

router.delete(
  '/:memberId',
  validate(projectMemberIdSchema),
  loadProjectMember,
  deleteProjectMember
);

export default router;
