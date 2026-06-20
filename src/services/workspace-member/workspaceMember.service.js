import { Workspace } from '../../models/workspace/workspace.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { User } from '../../models/user/user.model.js';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { WORKSPACE_MEMBER_MESSAGES } from '../../constants/workspaceMemberMessages.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  populateWorkspaceMember,
  findMemberByWorkspaceAndUser,
  findPopulatedMemberOrThrow,
  ensureCanManageMembers,
  ensureNotOwnerRoleAssignment,
  ensureMemberNotOwner,
  ensureMemberCanBeRemoved,
  isWorkspaceOwner,
} from './workspaceMember.helpers.js';

const syncWorkspaceMemberCount = async (workspaceId, session = null) => {
  const count = await WorkspaceMember.countDocuments({ workspaceId }).session(
    session
  );

  await Workspace.findByIdAndUpdate(
    workspaceId,
    { memberCount: count, lastActivityAt: new Date() },
    { session }
  );
};

export const workspaceMemberService = {
  async createOwnerMember(workspaceId, userId, session = null) {
    const [member] = await WorkspaceMember.create(
      [
        {
          workspaceId,
          userId,
          role: WORKSPACE_MEMBER_ROLE.OWNER,
          invitedBy: null,
          joinedAt: new Date(),
        },
      ],
      { session }
    );

    return member;
  },

  async deleteByWorkspace(workspaceId, session = null) {
    await WorkspaceMember.deleteMany({ workspaceId }).session(session);
  },

  async addFromInvitation({ workspaceId, userId, role, invitedBy }) {
    const member = await WorkspaceMember.create({
      workspaceId,
      userId,
      role,
      invitedBy,
      joinedAt: new Date(),
    });

    await syncWorkspaceMemberCount(workspaceId);

    return findPopulatedMemberOrThrow(member._id, workspaceId);
  },

  async list(workspace, { page = 1, limit = 10, role, search }) {
    const filter = { workspaceId: workspace._id };

    if (role) {
      filter.role = role;
    }

    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      filter.userId = { $in: users.map((user) => user._id) };
    }

    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      populateWorkspaceMember(
        WorkspaceMember.find(filter)
          .sort({ joinedAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      WorkspaceMember.countDocuments(filter),
    ]);

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getById(workspace, memberId) {
    return findPopulatedMemberOrThrow(memberId, workspace._id);
  },

  async update(workspace, member, data, actorUserId) {
    await ensureCanManageMembers(workspace, actorUserId);
    ensureMemberNotOwner(member);

    if (data.role !== undefined) {
      ensureNotOwnerRoleAssignment(data.role);
      member.role = data.role;
    }

    await member.save();

    await Workspace.findByIdAndUpdate(workspace._id, {
      lastActivityAt: new Date(),
    });

    return findPopulatedMemberOrThrow(member._id, workspace._id);
  },

  async remove(workspace, member, actorUserId) {
    const isSelf = member.userId.toString() === actorUserId.toString();

    if (isSelf) {
      if (member.role === WORKSPACE_MEMBER_ROLE.OWNER) {
        throw ApiError.badRequest(WORKSPACE_MEMBER_MESSAGES.SELF_OWNER_LEAVE);
      }
    } else {
      await ensureCanManageMembers(workspace, actorUserId);
      ensureMemberCanBeRemoved(member);

      const actorIsOwner = await isWorkspaceOwner(workspace, actorUserId);

      if (!actorIsOwner && member.role === WORKSPACE_MEMBER_ROLE.ADMIN) {
        const actorMembership = await findMemberByWorkspaceAndUser(
          workspace._id,
          actorUserId
        );

        if (actorMembership?.role === WORKSPACE_MEMBER_ROLE.ADMIN) {
          throw ApiError.forbidden(WORKSPACE_MEMBER_MESSAGES.MANAGE_DENIED);
        }
      }
    }

    await member.deleteOne();
    await syncWorkspaceMemberCount(workspace._id);
  },
};
