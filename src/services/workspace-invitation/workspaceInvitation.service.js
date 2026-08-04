import { User } from '../../models/user/user.model.js';
import { WorkspaceInvitation } from '../../models/workspace-invitation/workspaceInvitation.model.js';
import { WORKSPACE_INVITATION } from '../../constants/workspaceInvitation.js';
import { WORKSPACE_INVITATION_STATUS } from '../../constants/workspaceInvitationStatus.js';
import { WORKSPACE_INVITATION_MESSAGES } from '../../constants/workspaceInvitationMessages.js';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import { generateInvitationToken, hashInvitationToken } from '../../utils/invitationToken.js';
import { emailService } from '../email/email.service.js';
import { buildInvitationAcceptUrl } from '../email/templates/workspaceInvitation.template.js';
import {
  findMemberByWorkspaceAndUser,
  ensureActorCanInviteMembers,
  ensureNotOwnerRoleAssignment,
} from '../workspace-member/workspaceMember.helpers.js';
import { workspaceMemberService } from '../workspace-member/workspaceMember.service.js';
import {
  assertInvitationPending,
  findInvitationByToken,
  findPopulatedInvitationByToken,
  findPopulatedInvitationOrThrow,
  populateWorkspaceInvitation,
} from './workspaceInvitation.helpers.js';

const normalizeEmail = (email) => email.trim().toLowerCase();

const buildInviterName = (user) => `${user.firstName} ${user.lastName}`.trim() || user.email;

const sendInvitationEmail = async ({ invitation, workspace, inviter, token }) => {
  try {
    await emailService.sendWorkspaceInvitationEmail({
      to: invitation.email,
      workspaceName: workspace.name,
      role: invitation.role,
      invitedByName: buildInviterName(inviter),
      acceptUrl: buildInvitationAcceptUrl(token),
    });
    return true;
  } catch (error) {
    logger.error('Workspace invitation email failed', {
      invitationId: invitation._id,
      email: invitation.email,
      cause: error.message,
    });
    return false;
  }
};

export const workspaceInvitationService = {
  async deleteByWorkspace(workspaceId, session = null) {
    await WorkspaceInvitation.deleteMany({ workspaceId }).session(session);
  },

  async invite(workspace, { email, role }, actorUserId) {
    await ensureActorCanInviteMembers(workspace, actorUserId);

    const normalizedEmail = normalizeEmail(email);

    if (role) {
      ensureNotOwnerRoleAssignment(role);
    }

    const actor = await User.findById(actorUserId).select('firstName lastName email');

    if (actor.email.toLowerCase() === normalizedEmail) {
      throw ApiError.badRequest(WORKSPACE_INVITATION_MESSAGES.SELF_INVITE);
    }

    const invitedUser = await User.findOne({ email: normalizedEmail }).select('_id email');

    if (invitedUser) {
      const existingMember = await findMemberByWorkspaceAndUser(workspace._id, invitedUser._id);

      if (existingMember) {
        throw ApiError.conflict(WORKSPACE_INVITATION_MESSAGES.ALREADY_MEMBER);
      }
    }

    const existingInvitation = await WorkspaceInvitation.findOne({
      workspaceId: workspace._id,
      email: normalizedEmail,
    }).select('+token');

    if (
      existingInvitation?.status === WORKSPACE_INVITATION_STATUS.PENDING &&
      existingInvitation.expiresAt > new Date()
    ) {
      throw ApiError.conflict(WORKSPACE_INVITATION_MESSAGES.ALREADY_PENDING);
    }

    const token = generateInvitationToken();
    const invitationData = {
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
      invitation = await WorkspaceInvitation.findByIdAndUpdate(
        existingInvitation._id,
        invitationData,
        { new: true }
      );
    } else {
      invitation = await WorkspaceInvitation.create(invitationData);
    }

    const invitationEmailSent = await sendInvitationEmail({
      invitation,
      workspace,
      inviter: actor,
      token,
    });

    const populatedInvitation = await findPopulatedInvitationOrThrow(invitation._id);

    return {
      invitation: populatedInvitation,
      invitationEmailSent,
    };
  },

  async preview(token) {
    const invitation = await findPopulatedInvitationByToken(token);

    if (!invitation) {
      throw ApiError.notFound(WORKSPACE_INVITATION_MESSAGES.NOT_FOUND);
    }

    await assertInvitationPending(invitation);

    return {
      invitation: {
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        workspace: invitation.workspaceId,
        invitedBy: invitation.invitedBy,
      },
    };
  },

  async accept(token, user) {
    const invitation = await findInvitationByToken(token);

    if (!invitation) {
      throw ApiError.notFound(WORKSPACE_INVITATION_MESSAGES.NOT_FOUND);
    }

    await assertInvitationPending(invitation);

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw ApiError.forbidden(WORKSPACE_INVITATION_MESSAGES.EMAIL_MISMATCH);
    }

    const existingMember = await findMemberByWorkspaceAndUser(invitation.workspaceId, user._id);

    if (existingMember) {
      throw ApiError.conflict(WORKSPACE_INVITATION_MESSAGES.ALREADY_MEMBER);
    }

    const member = await workspaceMemberService.addFromInvitation({
      workspaceId: invitation.workspaceId,
      userId: user._id,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
    });

    invitation.status = WORKSPACE_INVITATION_STATUS.ACCEPTED;
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = user._id;
    await invitation.save();

    const populatedInvitation = await populateWorkspaceInvitation(
      WorkspaceInvitation.findById(invitation._id)
    );

    return {
      member,
      invitation: populatedInvitation,
    };
  },
};
