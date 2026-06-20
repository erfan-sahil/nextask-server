import { WorkspaceInvitation } from '../../models/workspace-invitation/workspaceInvitation.model.js';
import { WORKSPACE_INVITATION_STATUS } from '../../constants/workspaceInvitationStatus.js';
import { WORKSPACE_INVITATION_MESSAGES } from '../../constants/workspaceInvitationMessages.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import { hashInvitationToken } from '../../utils/invitationToken.js';
import { ApiError } from '../../utils/ApiError.js';

export const populateWorkspaceInvitation = (query) =>
  query
    .populate('workspaceId', 'name slug logo')
    .populate('invitedBy', USER_POPULATE_FIELDS)
    .populate('acceptedBy', USER_POPULATE_FIELDS);

export const findInvitationByToken = (token) =>
  WorkspaceInvitation.findOne({ token: hashInvitationToken(token) }).select(
    '+token'
  );

export const findPopulatedInvitationByToken = (token) =>
  populateWorkspaceInvitation(
    WorkspaceInvitation.findOne({ token: hashInvitationToken(token) }).select(
      '+token'
    )
  );

export const assertInvitationPending = async (invitation) => {
  if (invitation.status === WORKSPACE_INVITATION_STATUS.ACCEPTED) {
    throw ApiError.conflict(WORKSPACE_INVITATION_MESSAGES.ALREADY_ACCEPTED);
  }

  if (invitation.status === WORKSPACE_INVITATION_STATUS.REVOKED) {
    throw ApiError.badRequest(WORKSPACE_INVITATION_MESSAGES.REVOKED);
  }

  if (
    invitation.status === WORKSPACE_INVITATION_STATUS.EXPIRED ||
    invitation.expiresAt <= new Date()
  ) {
    if (
      invitation.status === WORKSPACE_INVITATION_STATUS.PENDING &&
      invitation.expiresAt <= new Date()
    ) {
      invitation.status = WORKSPACE_INVITATION_STATUS.EXPIRED;
      await invitation.save();
    }

    throw ApiError.badRequest(WORKSPACE_INVITATION_MESSAGES.EXPIRED);
  }
};

export const findPopulatedInvitationOrThrow = async (invitationId) => {
  const invitation = await populateWorkspaceInvitation(
    WorkspaceInvitation.findById(invitationId)
  );

  if (!invitation) {
    throw ApiError.notFound(WORKSPACE_INVITATION_MESSAGES.NOT_FOUND);
  }

  return invitation;
};
