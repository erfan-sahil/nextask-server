import { asyncHandler } from '../../utils/asyncHandler.js';
import { findActorMembershipOrThrow } from '../../services/workspace-member/workspaceMember.helpers.js';
import { loadWorkspaceByWorkspaceId } from '../workspace-member/workspaceMember.middleware.js';

export { loadWorkspaceByWorkspaceId };

export const requireCalendarAccess = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await findActorMembershipOrThrow(req.workspace._id, req.user._id);
  next();
});
