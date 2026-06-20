import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { User } from '../../models/user/user.model.js';
import {
  WORKSPACE_MEMBER_ROLE,
  WORKSPACE_MEMBER_MANAGE_ROLES,
} from '../../constants/workspaceMemberRole.js';
import { WORKSPACE_MEMBER_MESSAGES } from '../../constants/workspaceMemberMessages.js';
import {
  USER_POPULATE_FIELDS,
  findUserMembership,
} from '../workspace/workspace.helpers.js';
import { ApiError } from '../../utils/ApiError.js';

export const populateWorkspaceMember = (query) =>
  query
    .populate('userId', USER_POPULATE_FIELDS)
    .populate('invitedBy', USER_POPULATE_FIELDS)
    .populate('workspaceId', 'name slug');

export const findMemberByWorkspaceAndUser = (workspaceId, userId) =>
  findUserMembership(workspaceId, userId);

export const findMemberOrThrow = async (memberId, workspaceId) => {
  const member = await WorkspaceMember.findOne({ _id: memberId, workspaceId });

  if (!member) {
    throw ApiError.notFound(WORKSPACE_MEMBER_MESSAGES.NOT_FOUND);
  }

  return member;
};

export const findPopulatedMemberOrThrow = async (memberId, workspaceId) => {
  const member = await populateWorkspaceMember(
    WorkspaceMember.findOne({ _id: memberId, workspaceId })
  );

  if (!member) {
    throw ApiError.notFound(WORKSPACE_MEMBER_MESSAGES.NOT_FOUND);
  }

  return member;
};

export const ensureUserExists = async (userId) => {
  const user = await User.findById(userId).select('_id');

  if (!user) {
    throw ApiError.badRequest(WORKSPACE_MEMBER_MESSAGES.INVALID_USER);
  }
};

export const isWorkspaceOwner = async (workspace, userId) => {
  const membership = await findMemberByWorkspaceAndUser(workspace._id, userId);
  return membership?.role === WORKSPACE_MEMBER_ROLE.OWNER;
};

export const canViewMembers = async (workspace, userId) => {
  const membership = await findMemberByWorkspaceAndUser(workspace._id, userId);
  return Boolean(membership);
};

export const canManageMembers = async (workspace, userId) => {
  const membership = await findMemberByWorkspaceAndUser(workspace._id, userId);

  return (
    membership && WORKSPACE_MEMBER_MANAGE_ROLES.includes(membership.role)
  );
};

export const ensureCanViewMembers = async (workspace, userId) => {
  if (!(await canViewMembers(workspace, userId))) {
    throw ApiError.forbidden(WORKSPACE_MEMBER_MESSAGES.VIEW_DENIED);
  }
};

export const ensureCanManageMembers = async (workspace, userId) => {
  if (!(await canManageMembers(workspace, userId))) {
    throw ApiError.forbidden(WORKSPACE_MEMBER_MESSAGES.MANAGE_DENIED);
  }
};

export const ensureNotOwnerRoleAssignment = (role) => {
  if (role === WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.badRequest(WORKSPACE_MEMBER_MESSAGES.OWNER_ROLE_ASSIGN);
  }
};

export const ensureMemberNotOwner = (member) => {
  if (member.role === WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.badRequest(WORKSPACE_MEMBER_MESSAGES.OWNER_ROLE_UPDATE);
  }
};

export const ensureMemberCanBeRemoved = (member) => {
  if (member.role === WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.badRequest(WORKSPACE_MEMBER_MESSAGES.OWNER_REMOVE);
  }
};
