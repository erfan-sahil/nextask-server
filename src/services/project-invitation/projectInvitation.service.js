import { User } from '../../models/user/user.model.js';
import { ProjectInvitation } from '../../models/project-invitation/projectInvitation.model.js';
import { WORKSPACE_INVITATION } from '../../constants/workspaceInvitation.js';
import { WORKSPACE_INVITATION_STATUS } from '../../constants/workspaceInvitationStatus.js';
import { PROJECT_INVITATION_MESSAGES } from '../../constants/projectInvitationMessages.js';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import {
  generateInvitationToken,
  hashInvitationToken,
} from '../../utils/invitationToken.js';
import { emailService } from '../email/email.service.js';
import { buildProjectInvitationAcceptUrl } from '../email/templates/projectInvitation.template.js';
import {
  resolveEffectiveProjectMembership,
  ensureActorCanInviteProjectMembers,
  ensureNotOwnerRoleAssignment,
} from '../project-member/projectMember.helpers.js';
import { projectMemberService } from '../project-member/projectMember.service.js';
import { findProjectOrThrow } from '../project/project.helpers.js';
import {
  assertInvitationPending,
  findInvitationByToken,
  findPopulatedInvitationByToken,
  findPopulatedInvitationOrThrow,
  populateProjectInvitation,
} from './projectInvitation.helpers.js';

const normalizeEmail = (email) => email.trim().toLowerCase();

const buildInviterName = (user) =>
  `${user.firstName} ${user.lastName}`.trim() || user.email;

const sendInvitationEmail = async ({ invitation, project, workspace, inviter, token }) => {
  try {
    await emailService.sendProjectInvitationEmail({
      to: invitation.email,
      projectName: project.name,
      workspaceName: workspace.name,
      role: invitation.role,
      invitedByName: buildInviterName(inviter),
      acceptUrl: buildProjectInvitationAcceptUrl(token),
    });
    return true;
  } catch (error) {
    logger.error('Project invitation email failed', {
      invitationId: invitation._id,
      email: invitation.email,
      cause: error.message,
    });
    return false;
  }
};

export const projectInvitationService = {
  async deleteByProject(projectId, session = null) {
    await ProjectInvitation.deleteMany({ projectId }).session(session);
  },

  async deleteByWorkspace(workspaceId, session = null) {
    await ProjectInvitation.deleteMany({ workspaceId }).session(session);
  },

  async invite(workspace, project, { email, role }, actorUserId) {
    await ensureActorCanInviteProjectMembers(workspace, project._id, actorUserId);

    const normalizedEmail = normalizeEmail(email);

    if (role) {
      ensureNotOwnerRoleAssignment(role);
    }

    const actor = await User.findById(actorUserId).select(
      'firstName lastName email'
    );

    if (actor.email.toLowerCase() === normalizedEmail) {
      throw ApiError.badRequest(PROJECT_INVITATION_MESSAGES.SELF_INVITE);
    }

    const invitedUser = await User.findOne({ email: normalizedEmail }).select(
      '_id email'
    );

    if (invitedUser) {
      const existingAccess = await resolveEffectiveProjectMembership(
        workspace._id,
        project._id,
        invitedUser._id
      );

      if (existingAccess) {
        throw ApiError.conflict(PROJECT_INVITATION_MESSAGES.ALREADY_MEMBER);
      }
    }

    const existingInvitation = await ProjectInvitation.findOne({
      projectId: project._id,
      email: normalizedEmail,
    }).select('+token');

    if (
      existingInvitation?.status === WORKSPACE_INVITATION_STATUS.PENDING &&
      existingInvitation.expiresAt > new Date()
    ) {
      throw ApiError.conflict(PROJECT_INVITATION_MESSAGES.ALREADY_PENDING);
    }

    const token = generateInvitationToken();
    const invitationData = {
      projectId: project._id,
      workspaceId: workspace._id,
      email: normalizedEmail,
      role: role ?? WORKSPACE_MEMBER_ROLE.MEMBER,
      invitedBy: actorUserId,
      token: hashInvitationToken(token),
      status: WORKSPACE_INVITATION_STATUS.PENDING,
      expiresAt: new Date(Date.now() + WORKSPACE_INVITATION.EXPIRY_MS),
      acceptedAt: null,
      acceptedBy: null,
    };

    let invitation;

    if (existingInvitation) {
      invitation = await ProjectInvitation.findByIdAndUpdate(
        existingInvitation._id,
        invitationData,
        { new: true }
      );
    } else {
      invitation = await ProjectInvitation.create(invitationData);
    }

    const invitationEmailSent = await sendInvitationEmail({
      invitation,
      project,
      workspace,
      inviter: actor,
      token,
    });

    const populatedInvitation = await findPopulatedInvitationOrThrow(
      invitation._id
    );

    return {
      invitation: populatedInvitation,
      invitationEmailSent,
    };
  },

  async preview(token) {
    const invitation = await findPopulatedInvitationByToken(token);

    if (!invitation) {
      throw ApiError.notFound(PROJECT_INVITATION_MESSAGES.NOT_FOUND);
    }

    await assertInvitationPending(invitation);

    return {
      invitation: {
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        project: invitation.projectId,
        workspace: invitation.workspaceId,
        invitedBy: invitation.invitedBy,
      },
    };
  },

  async accept(token, user) {
    const invitation = await findInvitationByToken(token);

    if (!invitation) {
      throw ApiError.notFound(PROJECT_INVITATION_MESSAGES.NOT_FOUND);
    }

    await assertInvitationPending(invitation);

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw ApiError.forbidden(PROJECT_INVITATION_MESSAGES.EMAIL_MISMATCH);
    }

    // Ensure the project still exists before granting access.
    await findProjectOrThrow(invitation.projectId, invitation.workspaceId);

    const existingAccess = await resolveEffectiveProjectMembership(
      invitation.workspaceId,
      invitation.projectId,
      user._id
    );

    if (existingAccess) {
      throw ApiError.conflict(PROJECT_INVITATION_MESSAGES.ALREADY_MEMBER);
    }

    const member = await projectMemberService.addFromInvitation({
      projectId: invitation.projectId,
      workspaceId: invitation.workspaceId,
      userId: user._id,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    });

    invitation.status = WORKSPACE_INVITATION_STATUS.ACCEPTED;
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user._id;
    await invitation.save();

    const populatedInvitation = await populateProjectInvitation(
      ProjectInvitation.findById(invitation._id)
    );

    return {
      member,
      invitation: populatedInvitation,
    };
  },
};
