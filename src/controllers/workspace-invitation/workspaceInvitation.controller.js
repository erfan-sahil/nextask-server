import { workspaceInvitationService } from '../../services/workspace-invitation/workspaceInvitation.service.js';
import { WORKSPACE_INVITATION_MESSAGES } from '../../constants/workspaceInvitationMessages.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const previewWorkspaceInvitation = asyncHandler(async (req, res) => {
  const result = await workspaceInvitationService.preview(req.query.token);

  res.json(ApiResponse.ok(result, WORKSPACE_INVITATION_MESSAGES.PREVIEWED));
});

export const acceptWorkspaceInvitation = asyncHandler(async (req, res) => {
  const result = await workspaceInvitationService.accept(req.body.token, req.user);

  res.json(ApiResponse.ok(result, WORKSPACE_INVITATION_MESSAGES.ACCEPTED));
});
