import { asyncHandler } from '../../utils/asyncHandler.js';
import { findTaskOrThrow } from '../../services/task/task.helpers.js';
import {
  findTaskCommentOrThrow,
  ensureActorCanCreateTaskComment,
  ensureActorCanUpdateTaskComment,
  ensureActorCanDeleteTaskComment,
} from '../../services/task-comment/taskComment.helpers.js';

export const loadCommentTask = asyncHandler(async (req, _res, next) => {
  req.task = await findTaskOrThrow(req.params.taskId, req.board._id, req.workspace._id);
  next();
});

export const requireTaskCommentCreate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanCreateTaskComment(
    req.workspace,
    req.project._id,
    req.user._id
  );
  next();
});

export const loadTaskComment = asyncHandler(async (req, _res, next) => {
  req.comment = await findTaskCommentOrThrow(req.params.commentId, req.task._id);
  next();
});

export const requireTaskCommentUpdate = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanUpdateTaskComment(
    req.workspace,
    req.project._id,
    req.comment,
    req.user._id
  );
  next();
});

export const requireTaskCommentDelete = asyncHandler(async (req, _res, next) => {
  req.actorMembership = await ensureActorCanDeleteTaskComment(
    req.workspace,
    req.project._id,
    req.comment,
    req.user._id
  );
  next();
});
