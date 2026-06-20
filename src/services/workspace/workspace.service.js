import { Workspace } from '../../models/workspace/workspace.model.js';
import { WORKSPACE_VISIBILITY } from '../../constants/workspaceVisibility.js';
import { WORKSPACE_STATUS } from '../../constants/workspaceStatus.js';
import { WORKSPACE_MESSAGES } from '../../constants/workspaceMessages.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  populateWorkspace,
  slugify,
  generateUniqueSlug,
  ensureWorkspaceOwner,
  ensureWorkspaceOwnerForDelete,
  ensureOwnerExists,
  findPopulatedWorkspaceOrThrow,
} from './workspace.helpers.js';

export const workspaceService = {
  async create(data, userId) {
    const baseSlug = data.slug ?? slugify(data.name);

    if (!baseSlug) {
      throw ApiError.badRequest(WORKSPACE_MESSAGES.INVALID_SLUG_FROM_NAME);
    }

    const ownerId = data.ownerId ?? userId;

    if (data.ownerId) {
      await ensureOwnerExists(ownerId);
    }

    const slug = await generateUniqueSlug(baseSlug);

    const workspace = await Workspace.create({
      name: data.name,
      slug,
      description: data.description ?? '',
      logo: data.logo ?? null,
      visibility: data.visibility ?? WORKSPACE_VISIBILITY.PRIVATE,
      ownerId,
      status: data.status ?? WORKSPACE_STATUS.ACTIVE,
      memberCount: 1,
      projectCount: 0,
      taskCount: 0,
      lastActivityAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    });

    return findPopulatedWorkspaceOrThrow(workspace._id);
  },

  async list({ page = 1, limit = 10, status, visibility, search }, userId) {
    const filter = { ownerId: userId };

    if (status) {
      filter.status = status;
    }

    if (visibility) {
      filter.visibility = visibility;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [workspaces, total] = await Promise.all([
      populateWorkspace(
        Workspace.find(filter)
          .sort({ lastActivityAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Workspace.countDocuments(filter),
    ]);

    return {
      workspaces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getPopulated(workspaceId) {
    return findPopulatedWorkspaceOrThrow(workspaceId);
  },

  async update(workspace, data, userId) {
    ensureWorkspaceOwner(workspace, userId);

    if (data.name !== undefined) {
      workspace.name = data.name;
    }

    if (data.slug !== undefined) {
      workspace.slug = await generateUniqueSlug(data.slug, workspace._id);
    }

    if (data.description !== undefined) {
      workspace.description = data.description;
    }

    if (data.logo !== undefined) {
      workspace.logo = data.logo;
    }

    if (data.visibility !== undefined) {
      workspace.visibility = data.visibility;
    }

    if (data.status !== undefined) {
      workspace.status = data.status;
    }

    workspace.updatedBy = userId;
    workspace.lastActivityAt = new Date();

    await workspace.save();

    return findPopulatedWorkspaceOrThrow(workspace._id);
  },

  async delete(workspace, userId) {
    ensureWorkspaceOwnerForDelete(workspace, userId);
    await workspace.deleteOne();
  },
};
