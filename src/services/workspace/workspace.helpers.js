import { Workspace } from '../../models/workspace/workspace.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { User } from '../../models/user/user.model.js';
import { WORKSPACE_STATUS } from '../../constants/workspaceStatus.js';
import { WORKSPACE_MESSAGES } from '../../constants/workspaceMessages.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  ensureCanViewWorkspace,
  ensureCanUpdateWorkspace,
  ensureCanArchiveWorkspace,
  ensureCanDeleteWorkspace,
} from '../workspace-member/memberPermission.helpers.js';

export const USER_POPULATE_FIELDS = 'firstName lastName username email avatar';

export const populateWorkspace = (query) =>
  query
    .populate('ownerId', USER_POPULATE_FIELDS)
    .populate('createdBy', USER_POPULATE_FIELDS)
    .populate('updatedBy', USER_POPULATE_FIELDS);

export const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const generateUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let suffix = 0;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Workspace.findOne(query).select('_id');
    if (!existing) {
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
};

export const findUserMembership = (workspaceId, userId) =>
  WorkspaceMember.findOne({ workspaceId, userId });

export const getUserWorkspaceMemberships = (userId) =>
  WorkspaceMember.find({ userId }).select('workspaceId role joinedAt');

export const ensureWorkspaceAccess = async (workspace, userId) => {
  const membership = await findUserMembership(workspace._id, userId);

  if (!membership) {
    throw ApiError.forbidden(WORKSPACE_MESSAGES.ACCESS_DENIED);
  }

  ensureCanViewWorkspace(membership);

  return membership;
};

export const ensureCanUpdateWorkspaceAccess = async (workspace, userId) => {
  const membership = await findUserMembership(workspace._id, userId);

  if (!membership) {
    throw ApiError.forbidden(WORKSPACE_MESSAGES.ACCESS_DENIED);
  }

  ensureCanUpdateWorkspace(membership);

  return membership;
};

export const ensureCanArchiveWorkspaceAccess = async (workspace, userId) => {
  const membership = await findUserMembership(workspace._id, userId);

  if (!membership) {
    throw ApiError.forbidden(WORKSPACE_MESSAGES.ACCESS_DENIED);
  }

  ensureCanArchiveWorkspace(membership);

  return membership;
};

export const ensureWorkspaceOwnerForDelete = async (workspace, userId) => {
  const membership = await findUserMembership(workspace._id, userId);

  if (!membership) {
    throw ApiError.forbidden(WORKSPACE_MESSAGES.ACCESS_DENIED);
  }

  ensureCanDeleteWorkspace(membership);

  return membership;
};

export const findWorkspaceOrThrow = async (id) => {
  const workspace = await Workspace.findById(id);

  if (!workspace) {
    throw ApiError.notFound(WORKSPACE_MESSAGES.NOT_FOUND);
  }

  return workspace;
};

export const ensureOwnerExists = async (ownerId) => {
  const owner = await User.findById(ownerId).select('_id');

  if (!owner) {
    throw ApiError.badRequest(WORKSPACE_MESSAGES.INVALID_OWNER);
  }
};

export const findPopulatedWorkspaceOrThrow = async (id) => {
  const workspace = await populateWorkspace(Workspace.findById(id));

  if (!workspace) {
    throw ApiError.notFound(WORKSPACE_MESSAGES.NOT_FOUND);
  }

  return workspace;
};

export const assertWorkspaceUpdatePermissions = async (
  workspace,
  userId,
  data
) => {
  if (data.status === WORKSPACE_STATUS.ARCHIVED) {
    await ensureCanArchiveWorkspaceAccess(workspace, userId);
  }

  const hasGeneralUpdates = Object.keys(data).some(
    (key) => key !== 'status' || data.status !== WORKSPACE_STATUS.ARCHIVED
  );

  if (hasGeneralUpdates) {
    await ensureCanUpdateWorkspaceAccess(workspace, userId);
  }
};
