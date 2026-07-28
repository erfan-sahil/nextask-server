import { taskCommentService } from '../../services/task-comment/taskComment.service.js';
import { TASK_COMMENT_MESSAGES } from '../../constants/taskCommentMessages.js';
import { NOTIFICATION_TYPE } from '../../models/notification/notification.model.js';
import { notificationService } from '../../services/notification/notification.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createTaskComment = asyncHandler(async (req, res) => {
  const comment = await taskCommentService.create(
    req.workspace,
    req.project,
    req.board,
    req.task,
    req.body.content,
    req.user._id
  );

  const mentionedUserIds = await notificationService.mentionedUserIds(
    req.workspace._id,
    comment.content
  );
  await Promise.all([
    notificationService.createMany({
      workspaceId: req.workspace._id,
      recipientIds: req.task.assignees,
      actorId: req.user._id,
      type: NOTIFICATION_TYPE.TASK_COMMENT,
      message: `${req.user.firstName} commented on “${req.task.title}”`,
      taskId: req.task._id,
      commentId: comment._id,
    }),
    notificationService.createMany({
      workspaceId: req.workspace._id,
      recipientIds: mentionedUserIds,
      actorId: req.user._id,
      type: NOTIFICATION_TYPE.MENTION,
      message: `${req.user.firstName} mentioned you in a comment on “${req.task.title}”`,
      taskId: req.task._id,
      commentId: comment._id,
    }),
  ]);
  res.status(201).json(ApiResponse.created({ comment }, TASK_COMMENT_MESSAGES.CREATED));
});

export const listTaskComments = asyncHandler(async (req, res) => {
  const result = await taskCommentService.list(req.task, req.query);

  res.json(ApiResponse.ok(result, TASK_COMMENT_MESSAGES.LIST_FETCHED));
});

export const getTaskComment = asyncHandler(async (req, res) => {
  const comment = await taskCommentService.getById(req.task, req.params.commentId);

  res.json(ApiResponse.ok({ comment }, TASK_COMMENT_MESSAGES.FETCHED));
});

export const updateTaskComment = asyncHandler(async (req, res) => {
  const comment = await taskCommentService.update(
    req.workspace,
    req.project,
    req.task,
    req.comment,
    req.body.content,
    req.user._id
  );

  res.json(ApiResponse.ok({ comment }, TASK_COMMENT_MESSAGES.UPDATED));
});

export const deleteTaskComment = asyncHandler(async (req, res) => {
  await taskCommentService.delete(req.workspace, req.project, req.comment);

  res.json(ApiResponse.ok(null, TASK_COMMENT_MESSAGES.DELETED));
});
