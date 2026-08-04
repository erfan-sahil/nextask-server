import { Router } from 'express';
import {
  createWorkspace,
  listWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../../controllers/workspace/workspace.controller.js';
import { authenticate } from '../../middlewares/auth/auth.middleware.js';
import {
  loadWorkspace,
  requireWorkspaceAccess,
  requireWorkspaceUpdate,
  requireWorkspaceOwnerForDelete,
} from '../../middlewares/workspace/workspace.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  workspaceIdSchema,
  listWorkspacesSchema,
} from '../../validations/workspace/workspace.validation.js';
import workspaceMemberRoutes from '../workspace-member/workspaceMember.routes.js';
import projectRoutes from '../project/project.routes.js';
import goalRoutes from '../goal/goal.routes.js';
import calendarRoutes from '../calendar/calendar.routes.js';
import workspaceChatRoutes from '../workspace-chat/workspaceChat.routes.js';
import reportRoutes from '../report/report.routes.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createWorkspaceSchema), createWorkspace);
router.get('/', validate(listWorkspacesSchema), listWorkspaces);

router.use('/:workspaceId/members', workspaceMemberRoutes);
router.use('/:workspaceId/projects', projectRoutes);
router.use('/:workspaceId/goals', goalRoutes);
router.use('/:workspaceId/calendar', calendarRoutes);
router.use('/:workspaceId/chat', workspaceChatRoutes);
router.use('/:workspaceId/reports', reportRoutes);

router.get(
  '/:id',
  validate(workspaceIdSchema),
  loadWorkspace,
  requireWorkspaceAccess,
  getWorkspace
);

router.patch(
  '/:id',
  validate(updateWorkspaceSchema),
  loadWorkspace,
  requireWorkspaceUpdate,
  updateWorkspace
);

router.delete(
  '/:id',
  validate(workspaceIdSchema),
  loadWorkspace,
  requireWorkspaceOwnerForDelete,
  deleteWorkspace
);

export default router;
