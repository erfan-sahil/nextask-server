import { ProjectMember } from '../../models/project-member/projectMember.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import {
  WORKSPACE_PERMISSION,
  ROLE_RANK,
  hasPermission,
  canManageTargetRole,
} from '../../constants/rolePermissions.js';
import { PROJECT_MEMBER_MESSAGES } from '../../constants/projectMemberMessages.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import { ApiError } from '../../utils/ApiError.js';

export const populateProjectMember = (query) =>
  query
    .populate('userId', USER_POPULATE_FIELDS)
    .populate('invitedBy', USER_POPULATE_FIELDS)
    .populate('projectId', 'name status')
    .populate('workspaceId', 'name slug');

export const findProjectMemberByUser = (projectId, userId) =>
  ProjectMember.findOne({ projectId, userId });

export const findProjectMemberOrThrow = async (memberId, projectId) => {
  const member = await ProjectMember.findOne({ _id: memberId, projectId });

  if (!member) {
    throw ApiError.notFound(PROJECT_MEMBER_MESSAGES.NOT_FOUND);
  }

  return member;
};

export const findPopulatedProjectMemberOrThrow = async (memberId, projectId) => {
  const member = await populateProjectMember(
    ProjectMember.findOne({ _id: memberId, projectId })
  );

  if (!member) {
    throw ApiError.notFound(PROJECT_MEMBER_MESSAGES.NOT_FOUND);
  }

  return member;
};

/**
 * Resolves the role a user effectively has on a project.
 *
 * Workspace members inherit access to every project in the workspace, while
 * project members only have access to the project they were invited to. When a
 * user has both, the higher-ranked role wins.
 */
export const resolveEffectiveProjectMembership = async (
  workspaceId,
  projectId,
  userId
) => {
  const [workspaceMembership, projectMembership] = await Promise.all([
    WorkspaceMember.findOne({ workspaceId, userId }),
    ProjectMember.findOne({ projectId, userId }),
  ]);

  const candidates = [workspaceMembership, projectMembership].filter(Boolean);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, current) =>
    ROLE_RANK[current.role] > ROLE_RANK[best.role] ? current : best
  );
};

export const findEffectiveProjectMembershipOrThrow = async (
  workspaceId,
  projectId,
  userId
) => {
  const membership = await resolveEffectiveProjectMembership(
    workspaceId,
    projectId,
    userId
  );

  if (!membership) {
    throw ApiError.forbidden(PROJECT_MEMBER_MESSAGES.NOT_A_MEMBER);
  }

  return membership;
};

const ensureEffectivePermission = (membership, permission) => {
  if (!membership || !hasPermission(membership.role, permission)) {
    throw ApiError.forbidden(PROJECT_MEMBER_MESSAGES.PERMISSION_DENIED);
  }
};

export const ensureActorCanViewProjectMembers = async (
  workspace,
  projectId,
  userId
) => {
  const membership = await findEffectiveProjectMembershipOrThrow(
    workspace._id,
    projectId,
    userId
  );
  ensureEffectivePermission(membership, WORKSPACE_PERMISSION.VIEW_MEMBERS);
  return membership;
};

export const ensureActorCanInviteProjectMembers = async (
  workspace,
  projectId,
  userId
) => {
  const membership = await findEffectiveProjectMembershipOrThrow(
    workspace._id,
    projectId,
    userId
  );
  ensureEffectivePermission(membership, WORKSPACE_PERMISSION.INVITE_MEMBERS);
  return membership;
};

export const ensureNotOwnerRoleAssignment = (role) => {
  if (role === WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.badRequest(PROJECT_MEMBER_MESSAGES.OWNER_ROLE_ASSIGN);
  }
};

export const ensureCanManageTargetProjectMember = (actorMembership, targetMember) => {
  ensureEffectivePermission(
    actorMembership,
    WORKSPACE_PERMISSION.CHANGE_MEMBER_ROLE
  );

  if (targetMember.role === WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.badRequest(PROJECT_MEMBER_MESSAGES.OWNER_ROLE_UPDATE);
  }

  if (!canManageTargetRole(actorMembership.role, targetMember.role)) {
    throw ApiError.forbidden(PROJECT_MEMBER_MESSAGES.TARGET_MANAGE_DENIED);
  }
};

export const ensureCanRemoveTargetProjectMember = (actorMembership, targetMember) => {
  ensureEffectivePermission(
    actorMembership,
    WORKSPACE_PERMISSION.REMOVE_MEMBERS
  );

  if (targetMember.role === WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.badRequest(PROJECT_MEMBER_MESSAGES.OWNER_REMOVE);
  }

  if (!canManageTargetRole(actorMembership.role, targetMember.role)) {
    throw ApiError.forbidden(PROJECT_MEMBER_MESSAGES.TARGET_MANAGE_DENIED);
  }
};
