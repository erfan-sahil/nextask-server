import { WORKSPACE_PERMISSION } from '../../constants/rolePermissions.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureHasPermission } from '../../services/workspace-member/memberPermission.helpers.js';
import { findActorMembershipOrThrow } from '../../services/workspace-member/workspaceMember.helpers.js';

export const requireAnalyticsView = asyncHandler(async (req, _res, next) => {
  const membership = await findActorMembershipOrThrow(req.workspace._id, req.user._id);

  ensureHasPermission(membership, WORKSPACE_PERMISSION.VIEW_ANALYTICS);
  req.actorMembership = membership;
  next();
});
