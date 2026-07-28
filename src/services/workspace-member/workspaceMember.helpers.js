import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { User } from '../../models/user/user.model.js';
import { WORKSPACE_MEMBER_MESSAGES } from '../../constants/workspaceMemberMessages.js';
import { USER_POPULATE_FIELDS, findUserMembership } from '../workspace/workspace.helpers.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  ensureCanViewMembers,
  ensureCanInviteMembers,
  ensureCanDeleteWorkspace,
} from './memberPermission.helpers.js';

export const populateWorkspaceMember = (query) =>
  query
    .populate('userId', USER_POPULATE_FIELDS)
    .populate('invitedBy', USER_POPULATE_FIELDS)
    .populate('workspaceId', 'name slug');

export const findMemberByWorkspaceAndUser = (workspaceId, userId) =>
  findUserMembership(workspaceId, userId);

export const findActorMembershipOrThrow = async (workspaceId, userId) => {
  const membership = await findMemberByWorkspaceAndUser(workspaceId, userId);

  if (!membership) {
    throw ApiError.forbidden(WORKSPACE_MEMBER_MESSAGES.NOT_A_MEMBER);
  }

  return membership;
};

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

export const ensureActorCanViewMembers = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanViewMembers(membership);
  return membership;
};

export const ensureActorCanInviteMembers = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanInviteMembers(membership);
  return membership;
};

export const ensureActorCanDeleteWorkspace = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanDeleteWorkspace(membership);
  return membership;
};

export {
  ensureCanViewMembers,
  ensureCanInviteMembers,
  ensureCanChangeMemberRole,
  ensureCanRemoveMembers,
  ensureCanDeleteWorkspace,
  ensureCanUpdateWorkspace,
  ensureCanArchiveWorkspace,
  ensureCanViewWorkspace,
  ensureCanManageTargetMember,
  ensureCanRemoveTargetMember,
  ensureNotOwnerRoleAssignment,
  ensureMemberNotOwner,
  ensureMemberCanBeRemoved,
  ensureNotSelfRoleUpdate,
  ensureHasPermission,
} from './memberPermission.helpers.js';
