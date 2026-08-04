import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  findWorkspaceOrThrow,
  ensureWorkspaceAccess,
  ensureCanUpdateWorkspaceAccess,
  ensureWorkspaceOwnerForDelete,
} from '../../services/workspace/workspace.helpers.js';

export const loadWorkspace = asyncHandler(async (req, _res, next) => {
  req.workspace = await findWorkspaceOrThrow(req.params.id ?? req.params.workspaceId);
  next();
});

export const requireWorkspaceAccess = asyncHandler(async (req, _res, next) => {
  req.membership = await ensureWorkspaceAccess(req.workspace, req.user._id);
  next();
});

export const requireWorkspaceUpdate = asyncHandler(async (req, _res, next) => {
  req.membership = await ensureCanUpdateWorkspaceAccess(req.workspace, req.user._id);
  next();
});

export const requireWorkspaceOwnerForDelete = asyncHandler(async (req, _res, next) => {
  req.membership = await ensureWorkspaceOwnerForDelete(req.workspace, req.user._id);
  next();
});
