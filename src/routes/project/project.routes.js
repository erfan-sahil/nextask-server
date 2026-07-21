import { Router } from 'express';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../../controllers/project/project.controller.js';
import {
  loadWorkspaceByWorkspaceId,
  requireProjectList,
  requireProjectView,
  requireProjectCreate,
  requireProjectUpdate,
  requireProjectDelete,
  loadProject,
} from '../../middlewares/project/project.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  listProjectsSchema,
} from '../../validations/project/project.validation.js';
import boardRoutes from '../board/board.routes.js';
import projectMemberRoutes from '../project-member/projectMember.routes.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);

router.post(
  '/',
  validate(createProjectSchema),
  requireProjectCreate,
  createProject
);

router.get('/', validate(listProjectsSchema), requireProjectList, listProjects);

router.use('/:projectId/members', projectMemberRoutes);
router.use('/:projectId/boards', boardRoutes);

router.get(
  '/:projectId',
  validate(projectIdSchema),
  requireProjectView,
  getProject
);

router.patch(
  '/:projectId',
  validate(updateProjectSchema),
  requireProjectUpdate,
  loadProject,
  updateProject
);

router.delete(
  '/:projectId',
  validate(projectIdSchema),
  requireProjectDelete,
  loadProject,
  deleteProject
);

export default router;
