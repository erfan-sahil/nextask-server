import { workspaceService } from '../../services/workspace/workspace.service.js';
import { WORKSPACE_MESSAGES } from '../../constants/workspaceMessages.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.create(req.body, req.user._id);

  res.status(201).json(ApiResponse.created({ workspace }, WORKSPACE_MESSAGES.CREATED));
});

export const listWorkspaces = asyncHandler(async (req, res) => {
  const result = await workspaceService.list(req.query, req.user._id);

  res.json(ApiResponse.ok(result, WORKSPACE_MESSAGES.LIST_FETCHED));
});

export const getWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getPopulated(req.workspace._id, req.user._id);

  res.json(ApiResponse.ok({ workspace }, WORKSPACE_MESSAGES.FETCHED));
});

export const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.update(req.workspace, req.body, req.user._id);

  res.json(ApiResponse.ok({ workspace }, WORKSPACE_MESSAGES.UPDATED));
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  await workspaceService.delete(req.workspace, req.user._id);

  res.json(ApiResponse.ok(null, WORKSPACE_MESSAGES.DELETED));
});
