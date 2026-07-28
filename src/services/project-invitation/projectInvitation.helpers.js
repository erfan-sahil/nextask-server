import { ProjectInvitation } from '../../models/project-invitation/projectInvitation.model.js';
import { WORKSPACE_INVITATION_STATUS } from '../../constants/workspaceInvitationStatus.js';
import { PROJECT_INVITATION_MESSAGES } from '../../constants/projectInvitationMessages.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import { hashInvitationToken } from '../../utils/invitationToken.js';
import { ApiError } from '../../utils/ApiError.js';

export const populateProjectInvitation = (query) =>
  query
    .populate('projectId', 'name status')
    .populate('workspaceId', 'name slug logo')
    .populate('invitedBy', USER_POPULATE_FIELDS)
    .populate('acceptedBy', USER_POPULATE_FIELDS);

export const findInvitationByToken = (token) =>
  ProjectInvitation.findOne({ token: hashInvitationToken(token) }).select('+token');

export const findPopulatedInvitationByToken = (token) =>
  populateProjectInvitation(
    ProjectInvitation.findOne({ token: hashInvitationToken(token) }).select('+token')
  );

export const assertInvitationPending = async (invitation) => {
  if (invitation.status === WORKSPACE_INVITATION_STATUS.ACCEPTED) {
    throw ApiError.conflict(PROJECT_INVITATION_MESSAGES.ALREADY_ACCEPTED);
  }

  if (invitation.status === WORKSPACE_INVITATION_STATUS.REVOKED) {
    throw ApiError.badRequest(PROJECT_INVITATION_MESSAGES.REVOKED);
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

    throw ApiError.badRequest(PROJECT_INVITATION_MESSAGES.EXPIRED);
  }
};

export const findPopulatedInvitationOrThrow = async (invitationId) => {
  const invitation = await populateProjectInvitation(ProjectInvitation.findById(invitationId));

  if (!invitation) {
    throw ApiError.notFound(PROJECT_INVITATION_MESSAGES.NOT_FOUND);
  }

  return invitation;
};
