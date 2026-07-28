import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { GOAL_MESSAGES } from '../../constants/goalMessages.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { loadWorkspaceByWorkspaceId } from '../workspace-member/workspaceMember.middleware.js';
import { findActorMembershipOrThrow } from '../../services/workspace-member/workspaceMember.helpers.js';
import { findGoalOrThrow } from '../../services/goal/goal.helpers.js';

export { loadWorkspaceByWorkspaceId };

export const requireGoalView = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await findActorMembershipOrThrow(req.workspace._id, req.user._id);
  next();
});

export const requireGoalManagement = asyncHandler(async (req, _res, next) => {
  const membership = await findActorMembershipOrThrow(req.workspace._id, req.user._id);

  if (
    membership.role !== WORKSPACE_MEMBER_ROLE.OWNER &&
    membership.role !== WORKSPACE_MEMBER_ROLE.ADMIN
  ) {
    throw ApiError.forbidden(GOAL_MESSAGES.MANAGEMENT_DENIED);
  }

  req.actorMembership = membership;
  next();
});

export const loadGoal = asyncHandler(async (req, _res, next) => {
  req.goal = await findGoalOrThrow(req.params.goalId, req.workspace._id);
  next();
});
