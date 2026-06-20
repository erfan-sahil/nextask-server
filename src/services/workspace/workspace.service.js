import mongoose from 'mongoose';
import { Workspace } from '../../models/workspace/workspace.model.js';
import { WORKSPACE_VISIBILITY } from '../../constants/workspaceVisibility.js';
import { WORKSPACE_STATUS } from '../../constants/workspaceStatus.js';
import { WORKSPACE_MESSAGES } from '../../constants/workspaceMessages.js';
import { ApiError } from '../../utils/ApiError.js';
import { workspaceMemberService } from '../workspace-member/workspaceMember.service.js';
import { workspaceInvitationService } from '../workspace-invitation/workspaceInvitation.service.js';
import {
  populateWorkspace,
  slugify,
  generateUniqueSlug,
  assertWorkspaceUpdatePermissions,
  findPopulatedWorkspaceOrThrow,
  getUserWorkspaceMemberships,
  findUserMembership,
  ensureOwnerExists,
  ensureWorkspaceOwnerForDelete,
} from './workspace.helpers.js';

const attachMembershipToWorkspaces = (workspaces, memberships) => {
  const membershipByWorkspaceId = new Map(
    memberships.map((membership) => [
      membership.workspaceId.toString(),
      membership,
    ])
  );

  return workspaces.map((workspace) => {
    const membership = membershipByWorkspaceId.get(workspace._id.toString());
    const workspaceJson = workspace.toJSON();

    return {
      ...workspaceJson,
      membershipRole: membership?.role ?? null,
      joinedAt: membership?.joinedAt ?? null,
    };
  });
};

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

    const session = await mongoose.startSession();
    let workspace;

    try {
      session.startTransaction();

      [workspace] = await Workspace.create(
        [
          {
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
          },
        ],
        { session }
      );

      await workspaceMemberService.createOwnerMember(
        workspace._id,
        ownerId,
        session
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    const populatedWorkspace = await findPopulatedWorkspaceOrThrow(workspace._id);
    const ownerMembership = await findUserMembership(workspace._id, ownerId);

    return {
      ...populatedWorkspace.toJSON(),
      membershipRole: ownerMembership?.role ?? null,
      joinedAt: ownerMembership?.joinedAt ?? null,
    };
  },

  async list({ page = 1, limit = 10, status, visibility, search }, userId) {
    const memberships = await getUserWorkspaceMemberships(userId);

    if (memberships.length === 0) {
      return {
        workspaces: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
        },
      };
    }

    const workspaceIds = memberships.map((membership) => membership.workspaceId);
    const filter = { _id: { $in: workspaceIds } };

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
      workspaces: attachMembershipToWorkspaces(workspaces, memberships),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getPopulated(workspaceId, userId) {
    const workspace = await findPopulatedWorkspaceOrThrow(workspaceId);
    const memberships = await getUserWorkspaceMemberships(userId);
    const membership = memberships.find(
      (item) => item.workspaceId.toString() === workspaceId.toString()
    );

    return {
      ...workspace.toJSON(),
      membershipRole: membership?.role ?? null,
      joinedAt: membership?.joinedAt ?? null,
    };
  },

  async update(workspace, data, userId) {
    await assertWorkspaceUpdatePermissions(workspace, userId, data);

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

    return this.getPopulated(workspace._id, userId);
  },

  async delete(workspace, userId) {
    await ensureWorkspaceOwnerForDelete(workspace, userId);

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await workspaceMemberService.deleteByWorkspace(workspace._id, session);
      await workspaceInvitationService.deleteByWorkspace(workspace._id, session);
      await workspace.deleteOne({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
};
