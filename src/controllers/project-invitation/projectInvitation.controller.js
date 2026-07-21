import { projectInvitationService } from '../../services/project-invitation/projectInvitation.service.js';
import { PROJECT_INVITATION_MESSAGES } from '../../constants/projectInvitationMessages.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const previewProjectInvitation = asyncHandler(async (req, res) => {
  const result = await projectInvitationService.preview(req.query.token);

  res.json(ApiResponse.ok(result, PROJECT_INVITATION_MESSAGES.PREVIEWED));
});

export const acceptProjectInvitation = asyncHandler(async (req, res) => {
  const result = await projectInvitationService.accept(
    req.body.token,
    req.user
  );

  res.json(ApiResponse.ok(result, PROJECT_INVITATION_MESSAGES.ACCEPTED));
});
