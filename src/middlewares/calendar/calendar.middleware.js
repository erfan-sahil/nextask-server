import { asyncHandler } from '../../utils/asyncHandler.js';
import { findActorMembershipOrThrow } from '../../services/workspace-member/workspaceMember.helpers.js';
import { ensureCanCreateMeeting } from '../../services/workspace-member/memberPermission.helpers.js';
import { loadWorkspaceByWorkspaceId } from '../workspace-member/workspaceMember.middleware.js';

export { loadWorkspaceByWorkspaceId };

export const requireCalendarAccess = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await findActorMembershipOrThrow(req.workspace._id, req.user._id);
  next();
});

export const requireMeetingCreate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await findActorMembershipOrThrow(req.workspace._id, req.user._id);
  ensureCanCreateMeeting(req.actorMembership);
  next();
});
