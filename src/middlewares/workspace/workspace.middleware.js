import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  findWorkspaceOrThrow,
  ensureWorkspaceAccess,
  ensureWorkspaceOwner,
  ensureWorkspaceOwnerForDelete,
} from '../../services/workspace/workspace.helpers.js';

export const loadWorkspace = asyncHandler(async (req, _res, next) => {
  req.workspace = await findWorkspaceOrThrow(req.params.id);
  next();
});

export const requireWorkspaceAccess = asyncHandler(async (req, _res, next) => {
  ensureWorkspaceAccess(req.workspace, req.user._id);
  next();
});

export const requireWorkspaceOwner = asyncHandler(async (req, _res, next) => {
  ensureWorkspaceOwner(req.workspace, req.user._id);
  next();
});

export const requireWorkspaceOwnerForDelete = asyncHandler(
  async (req, _res, next) => {
    ensureWorkspaceOwnerForDelete(req.workspace, req.user._id);
    next();
  }
);
