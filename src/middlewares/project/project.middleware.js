import { asyncHandler } from '../../utils/asyncHandler.js';
import { loadWorkspaceByWorkspaceId } from '../workspace-member/workspaceMember.middleware.js';
import {
  ensureActorCanListProjects,
  ensureActorCanViewProject,
  ensureActorCanCreateProject,
  ensureActorCanUpdateProject,
  ensureActorCanDeleteProject,
  findProjectOrThrow,
} from '../../services/project/project.helpers.js';

export { loadWorkspaceByWorkspaceId };

export const requireProjectList = asyncHandler(async (req, _res, next) => {
  req.projectListScope = await ensureActorCanListProjects(
    req.workspace,
    req.user._id
  );
  next();
});

export const requireProjectCreate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanCreateProject(
    req.workspace,
    req.user._id
  );
  next();
});

export const requireProjectView = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanViewProject(
    req.workspace,
    req.params.projectId,
    req.user._id
  );
  next();
});

export const requireProjectUpdate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanUpdateProject(
    req.workspace,
    req.params.projectId,
    req.user._id
  );
  next();
});

export const requireProjectDelete = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanDeleteProject(
    req.workspace,
    req.params.projectId,
    req.user._id
  );
  next();
});

export const loadProject = asyncHandler(async (req, _res, next) => {
  req.project = await findProjectOrThrow(
    req.params.projectId,
    req.workspace._id
  );
  next();
});
