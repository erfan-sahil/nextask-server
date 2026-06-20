import { Project } from '../../models/project/project.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { PROJECT_MESSAGES } from '../../constants/projectMessages.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  ensureCanCreateProject,
  ensureCanViewProject,
  ensureCanUpdateProject,
  ensureCanDeleteProject,
} from '../workspace-member/memberPermission.helpers.js';
import { findActorMembershipOrThrow } from '../workspace-member/workspaceMember.helpers.js';

export const populateProject = (query) =>
  query
    .populate('projectManagers', USER_POPULATE_FIELDS)
    .populate('createdBy', USER_POPULATE_FIELDS)
    .populate('updatedBy', USER_POPULATE_FIELDS)
    .populate('workspaceId', 'name slug');

export const findProjectOrThrow = async (projectId, workspaceId) => {
  const project = await Project.findOne({ _id: projectId, workspaceId });

  if (!project) {
    throw ApiError.notFound(PROJECT_MESSAGES.NOT_FOUND);
  }

  return project;
};

export const findPopulatedProjectOrThrow = async (projectId, workspaceId) => {
  const project = await populateProject(
    Project.findOne({ _id: projectId, workspaceId })
  );

  if (!project) {
    throw ApiError.notFound(PROJECT_MESSAGES.NOT_FOUND);
  }

  return project;
};

export const assertValidDateRange = (startDate, endDate) => {
  if (startDate && endDate && endDate < startDate) {
    throw ApiError.badRequest(PROJECT_MESSAGES.INVALID_DATE_RANGE);
  }
};

export const ensureProjectManagersAreMembers = async (
  workspaceId,
  projectManagerIds
) => {
  if (!projectManagerIds?.length) {
    return;
  }

  const uniqueIds = [...new Set(projectManagerIds.map((id) => id.toString()))];
  const memberCount = await WorkspaceMember.countDocuments({
    workspaceId,
    userId: { $in: uniqueIds },
  });

  if (memberCount !== uniqueIds.length) {
    throw ApiError.badRequest(PROJECT_MESSAGES.INVALID_PROJECT_MANAGER);
  }
};

export const ensureActorCanViewProjects = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanViewProject(membership);
  return membership;
};

export const ensureActorCanCreateProject = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanCreateProject(membership);
  return membership;
};

export const ensureActorCanUpdateProject = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanUpdateProject(membership);
  return membership;
};

export const ensureActorCanDeleteProject = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanDeleteProject(membership);
  return membership;
};
