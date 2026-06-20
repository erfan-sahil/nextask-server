import { Workspace } from '../../models/workspace/workspace.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { User } from '../../models/user/user.model.js';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { WORKSPACE_MESSAGES } from '../../constants/workspaceMessages.js';
import { ApiError } from '../../utils/ApiError.js';

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

  return membership;
};

export const ensureWorkspaceOwner = async (workspace, userId) => {
  const membership = await findUserMembership(workspace._id, userId);

  if (!membership || membership.role !== WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.forbidden(WORKSPACE_MESSAGES.OWNER_ONLY_UPDATE);
  }

  return membership;
};

export const ensureWorkspaceOwnerForDelete = async (workspace, userId) => {
  const membership = await findUserMembership(workspace._id, userId);

  if (!membership || membership.role !== WORKSPACE_MEMBER_ROLE.OWNER) {
    throw ApiError.forbidden(WORKSPACE_MESSAGES.OWNER_ONLY_DELETE);
  }

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
