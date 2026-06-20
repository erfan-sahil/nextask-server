import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  loadWorkspaceByWorkspaceId,
  loadProjectByProjectId,
  loadBoard,
} from '../board/board.middleware.js';
import { findActorMembershipOrThrow } from '../../services/workspace-member/workspaceMember.helpers.js';
import {
  ensureActorCanViewTasks,
  ensureActorCanCreateTask,
  ensureActorCanDeleteTask,
  findTaskOrThrow,
} from '../../services/task/task.helpers.js';

export { loadWorkspaceByWorkspaceId, loadProjectByProjectId, loadBoard };

export const loadActorMembership = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await findActorMembershipOrThrow(
    req.workspace._id,
    req.user._id
  );
  next();
});

export const requireTaskView = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanViewTasks(
    req.workspace,
    req.user._id
  );
  next();
});

export const requireTaskCreate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanCreateTask(
    req.workspace,
    req.user._id
  );
  next();
});

export const requireTaskDelete = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanDeleteTask(
    req.workspace,
    req.user._id
  );
  next();
});

export const loadTask = asyncHandler(async (req, _res, next) => {
  req.task = await findTaskOrThrow(
    req.params.taskId,
    req.board._id,
    req.workspace._id
  );
  next();
});
