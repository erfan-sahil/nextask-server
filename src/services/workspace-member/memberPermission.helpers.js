import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import {
  WORKSPACE_PERMISSION,
  hasPermission,
  canManageTargetRole,
} from '../../constants/rolePermissions.js';
import { WORKSPACE_MEMBER_MESSAGES } from '../../constants/workspaceMemberMessages.js';
import { ApiError } from '../../utils/ApiError.js';

export const ensureHasPermission = (membership, permission) => {
  if (!membership || !hasPermission(membership.role, permission)) {
    throw ApiError.forbidden(WORKSPACE_MEMBER_MESSAGES.PERMISSION_DENIED);
  }
};

export const ensureCanViewMembers = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.VIEW_MEMBERS);
};

export const ensureCanInviteMembers = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.INVITE_MEMBERS);
};

export const ensureCanChangeMemberRole = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.CHANGE_MEMBER_ROLE);
};

export const ensureCanRemoveMembers = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.REMOVE_MEMBERS);
};

export const ensureCanDeleteWorkspace = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.DELETE_WORKSPACE);
};

export const ensureCanUpdateWorkspace = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.UPDATE_WORKSPACE);
};

export const ensureCanArchiveWorkspace = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.ARCHIVE_WORKSPACE);
};

export const ensureCanViewWorkspace = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.VIEW_WORKSPACE);
};

export const ensureCanCreateProject = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.CREATE_PROJECT);
};

export const ensureCanViewProject = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.VIEW_PROJECT);
};

export const ensureCanUpdateProject = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.UPDATE_PROJECT);
};

export const ensureCanDeleteProject = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.DELETE_PROJECT);
};

export const ensureCanCreateBoard = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.CREATE_BOARD);
};

export const ensureCanUpdateBoard = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.UPDATE_BOARD);
};

export const ensureCanDeleteBoard = (membership) => {
  ensureHasPermission(membership, WORKSPACE_PERMISSION.DELETE_BOARD);
};

export const ensureCanManageTargetMember = (actorMembership, targetMember) => {
  ensureCanChangeMemberRole(actorMembership);

  if (targetMember.role === WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.badRequest(WORKSPACE_MEMBER_MESSAGES.OWNER_ROLE_UPDATE);
  }

  if (!canManageTargetRole(actorMembership.role, targetMember.role)) {
    throw ApiError.forbidden(WORKSPACE_MEMBER_MESSAGES.TARGET_MANAGE_DENIED);
  }
};

export const ensureCanRemoveTargetMember = (actorMembership, targetMember) => {
  ensureCanRemoveMembers(actorMembership);

  if (targetMember.role === WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.badRequest(WORKSPACE_MEMBER_MESSAGES.OWNER_REMOVE);
  }

  if (!canManageTargetRole(actorMembership.role, targetMember.role)) {
    throw ApiError.forbidden(WORKSPACE_MEMBER_MESSAGES.TARGET_MANAGE_DENIED);
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

export const ensureNotSelfRoleUpdate = (actorMembership, targetMember) => {
  if (actorMembership.userId.toString() === targetMember.userId.toString()) {
    throw ApiError.badRequest(WORKSPACE_MEMBER_MESSAGES.SELF_ROLE_UPDATE);
  }
};
