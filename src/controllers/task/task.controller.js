import { taskService } from '../../services/task/task.service.js';
import { TASK_MESSAGES } from '../../constants/taskMessages.js';
import { NOTIFICATION_TYPE } from '../../models/notification/notification.model.js';
import { notificationService } from '../../services/notification/notification.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.create(
    req.workspace,
    req.project,
    req.board,
    req.body,
    req.user._id
  );

  await notificationService.createMany({
    workspaceId: req.workspace._id,
    recipientIds: task.assignees.map(({ _id }) => _id),
    actorId: req.user._id,
    type: NOTIFICATION_TYPE.TASK_ASSIGNED,
    message: `${req.user.firstName} assigned you to “${task.title}”`,
    taskId: task._id,
  });
  res.status(201).json(ApiResponse.created({ task }, TASK_MESSAGES.CREATED));
});

export const listTasks = asyncHandler(async (req, res) => {
  const result = await taskService.list(req.board, req.query);

  res.json(ApiResponse.ok(result, TASK_MESSAGES.LIST_FETCHED));
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getById(req.workspace, req.board, req.params.taskId);

  res.json(ApiResponse.ok({ task }, TASK_MESSAGES.FETCHED));
});

export const updateTask = asyncHandler(async (req, res) => {
  const previousAssigneeIds = req.task.assignees.map((assignee) => assignee.toString());
  const task = await taskService.update(
    req.workspace,
    req.project,
    req.board,
    req.task,
    req.body,
    req.user._id,
    req.actorMembership
  );

  const assigneeIds = task.assignees.map(({ _id }) => _id);
  let newAssigneeIds = [];
  if (req.body.assignees !== undefined) {
    newAssigneeIds = assigneeIds.filter(
      (assigneeId) => !previousAssigneeIds.includes(assigneeId.toString())
    );
    await notificationService.createMany({
      workspaceId: req.workspace._id,
      recipientIds: newAssigneeIds,
      actorId: req.user._id,
      type: NOTIFICATION_TYPE.TASK_ASSIGNED,
      message: `${req.user.firstName} assigned you to “${task.title}”`,
      taskId: task._id,
    });
  }
  const newAssigneeIdSet = new Set(newAssigneeIds.map((assigneeId) => assigneeId.toString()));
  await notificationService.createMany({
    workspaceId: req.workspace._id,
    recipientIds: assigneeIds.filter((assigneeId) => !newAssigneeIdSet.has(assigneeId.toString())),
    actorId: req.user._id,
    type: NOTIFICATION_TYPE.TASK_UPDATED,
    message: `${req.user.firstName} updated “${task.title}”`,
    taskId: task._id,
  });
  res.json(ApiResponse.ok({ task }, TASK_MESSAGES.UPDATED));
});

export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.delete(req.workspace, req.project, req.board, req.task);

  res.json(ApiResponse.ok(null, TASK_MESSAGES.DELETED));
});
