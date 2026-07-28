import { projectService } from '../../services/project/project.service.js';
import { PROJECT_MESSAGES } from '../../constants/projectMessages.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.create(req.workspace, req.body, req.user._id);

  res.status(201).json(ApiResponse.created({ project }, PROJECT_MESSAGES.CREATED));
});

export const listProjects = asyncHandler(async (req, res) => {
  const result = await projectService.list(req.workspace, req.query, {
    userId: req.user._id,
    isWorkspaceMember: req.projectListScope?.isWorkspaceMember ?? true,
  });

  res.json(ApiResponse.ok(result, PROJECT_MESSAGES.LIST_FETCHED));
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getById(req.workspace, req.params.projectId);

  res.json(ApiResponse.ok({ project }, PROJECT_MESSAGES.FETCHED));
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.update(req.workspace, req.project, req.body, req.user._id);

  res.json(ApiResponse.ok({ project }, PROJECT_MESSAGES.UPDATED));
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.delete(req.workspace, req.project);

  res.json(ApiResponse.ok(null, PROJECT_MESSAGES.DELETED));
});
