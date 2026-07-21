import { asyncHandler } from '../../utils/asyncHandler.js';
import { findWorkspaceOrThrow } from '../../services/workspace/workspace.helpers.js';
import { findProjectOrThrow } from '../../services/project/project.helpers.js';
import {
  ensureActorCanViewProjectMembers,
  findProjectMemberOrThrow,
} from '../../services/project-member/projectMember.helpers.js';

export const loadProjectContext = asyncHandler(async (req, _res, next) => {
  req.workspace = await findWorkspaceOrThrow(req.params.workspaceId);
  req.project = await findProjectOrThrow(
    req.params.projectId,
    req.workspace._id
  );
  next();
});

export const requireProjectMemberView = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanViewProjectMembers(
    req.workspace,
    req.project._id,
    req.user._id
  );
  next();
});

export const loadProjectMember = asyncHandler(async (req, _res, next) => {
  req.projectMember = await findProjectMemberOrThrow(
    req.params.memberId,
    req.project._id
  );
  next();
});
