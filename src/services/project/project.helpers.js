import { Project } from '../../models/project/project.model.js';
import { ProjectMember } from '../../models/project-member/projectMember.model.js';
import { PROJECT_MESSAGES } from '../../constants/projectMessages.js';
import { WORKSPACE_MEMBER_MESSAGES } from '../../constants/workspaceMemberMessages.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  ensureCanCreateProject,
  ensureCanViewProject,
  ensureCanUpdateProject,
  ensureCanDeleteProject,
} from '../workspace-member/memberPermission.helpers.js';
import {
  findActorMembershipOrThrow,
  findMemberByWorkspaceAndUser,
} from '../workspace-member/workspaceMember.helpers.js';
import {
  findEffectiveProjectMembershipOrThrow,
  resolveEffectiveProjectMembership,
} from '../project-member/projectMember.helpers.js';

export const populateProject = (query) =>
  query
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

// Creating a project is a workspace-level action, so it requires an actual
// workspace membership with the CREATE_PROJECT permission.
export const ensureActorCanCreateProject = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanCreateProject(membership);
  return membership;
};

// Listing projects is allowed for workspace members (they see every project)
// and for project-scoped members (they see only the projects they belong to).
export const ensureActorCanListProjects = async (workspace, userId) => {
  const workspaceMembership = await findMemberByWorkspaceAndUser(
    workspace._id,
    userId
  );

  if (workspaceMembership) {
    ensureCanViewProject(workspaceMembership);
    return { isWorkspaceMember: true };
  }

  const hasProjectAccess = await ProjectMember.exists({
    workspaceId: workspace._id,
    userId,
  });

  if (!hasProjectAccess) {
    throw ApiError.forbidden(WORKSPACE_MEMBER_MESSAGES.NOT_A_MEMBER);
  }

  return { isWorkspaceMember: false };
};

export const ensureActorCanViewProject = async (workspace, projectId, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(
    workspace._id,
    projectId,
    userId
  );
  ensureCanViewProject(membership);
  return membership;
};

export const ensureActorCanUpdateProject = async (
  workspace,
  projectId,
  userId
) => {
  const membership = await findEffectiveProjectMembershipOrThrow(
    workspace._id,
    projectId,
    userId
  );
  ensureCanUpdateProject(membership);
  return membership;
};

export const ensureActorCanDeleteProject = async (
  workspace,
  projectId,
  userId
) => {
  const membership = await findEffectiveProjectMembershipOrThrow(
    workspace._id,
    projectId,
    userId
  );
  ensureCanDeleteProject(membership);
  return membership;
};

export { resolveEffectiveProjectMembership };
