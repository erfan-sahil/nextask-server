import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  loadWorkspaceByWorkspaceId,
  loadProjectByProjectId,
  loadBoard,
} from '../board/board.middleware.js';
import {
  ensureActorCanViewTasks,
  ensureActorCanCreateTask,
  ensureActorCanDeleteTask,
  findActorProjectMembershipOrThrow,
  findTaskOrThrow,
} from '../../services/task/task.helpers.js';

export { loadWorkspaceByWorkspaceId, loadProjectByProjectId, loadBoard };

export const loadActorMembership = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await findActorProjectMembershipOrThrow(
    req.workspace,
    req.project._id,
    req.user._id
  );
  next();
});

export const requireTaskView = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanViewTasks(req.workspace, req.project._id, req.user._id);
  next();
});

export const requireTaskCreate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanCreateTask(
    req.workspace,
    req.project._id,
    req.user._id
  );
  next();
});

export const requireTaskDelete = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanDeleteTask(
    req.workspace,
    req.project._id,
    req.user._id
  );
  next();
});

export const loadTask = asyncHandler(async (req, _res, next) => {
  req.task = await findTaskOrThrow(req.params.taskId, req.board._id, req.workspace._id);
  next();
});
