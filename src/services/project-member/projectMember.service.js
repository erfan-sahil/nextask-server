import { ProjectMember } from '../../models/project-member/projectMember.model.js';
import { User } from '../../models/user/user.model.js';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { canManageTargetRole } from '../../constants/rolePermissions.js';
import { PROJECT_MEMBER_MESSAGES } from '../../constants/projectMemberMessages.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  populateProjectMember,
  findPopulatedProjectMemberOrThrow,
  findEffectiveProjectMembershipOrThrow,
  ensureCanManageTargetProjectMember,
  ensureCanRemoveTargetProjectMember,
  ensureNotOwnerRoleAssignment,
} from './projectMember.helpers.js';

export const projectMemberService = {
  async createOwnerMember({ projectId, workspaceId, userId }, session = null) {
    const [member] = await ProjectMember.create(
      [
        {
          projectId,
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

  async deleteByProject(projectId, session = null) {
    await ProjectMember.deleteMany({ projectId }).session(session);
  },

  async deleteByWorkspace(workspaceId, session = null) {
    await ProjectMember.deleteMany({ workspaceId }).session(session);
  },

  async addFromInvitation({ projectId, workspaceId, userId, role, invitedBy }) {
    const member = await ProjectMember.create({
      projectId,
      workspaceId,
      userId,
      role,
      invitedBy,
      joinedAt: new Date(),
    });

    return findPopulatedProjectMemberOrThrow(member._id, projectId);
  },

  async list(project, { page = 1, limit = 10, role, search }) {
    const filter = { projectId: project._id };

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
      populateProjectMember(
        ProjectMember.find(filter).sort({ joinedAt: -1 }).skip(skip).limit(limit)
      ),
      ProjectMember.countDocuments(filter),
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

  async getById(project, memberId) {
    return findPopulatedProjectMemberOrThrow(memberId, project._id);
  },

  async update(workspace, project, member, data, actorUserId) {
    const actorMembership = await findEffectiveProjectMembershipOrThrow(
      workspace._id,
      project._id,
      actorUserId
    );

    if (member.userId.toString() === actorUserId.toString()) {
      throw ApiError.badRequest(PROJECT_MEMBER_MESSAGES.SELF_ROLE_UPDATE);
    }

    ensureCanManageTargetProjectMember(actorMembership, member);

    if (data.role !== undefined) {
      ensureNotOwnerRoleAssignment(data.role);

      if (!canManageTargetRole(actorMembership.role, data.role)) {
        throw ApiError.forbidden(PROJECT_MEMBER_MESSAGES.TARGET_MANAGE_DENIED);
      }

      member.role = data.role;
    }

    await member.save();

    return findPopulatedProjectMemberOrThrow(member._id, project._id);
  },

  async remove(workspace, project, member, actorUserId) {
    const actorMembership = await findEffectiveProjectMembershipOrThrow(
      workspace._id,
      project._id,
      actorUserId
    );

    const isSelf = member.userId.toString() === actorUserId.toString();

    if (isSelf) {
      if (member.role === WORKSPACE_MEMBER_ROLE.OWNER) {
        throw ApiError.badRequest(PROJECT_MEMBER_MESSAGES.SELF_OWNER_LEAVE);
      }
    } else {
      ensureCanRemoveTargetProjectMember(actorMembership, member);
    }

    await member.deleteOne();
  },
};
