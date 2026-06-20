import { taskService } from '../../services/task/task.service.js';
import { TASK_MESSAGES } from '../../constants/taskMessages.js';
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

  res.status(201).json(ApiResponse.created({ task }, TASK_MESSAGES.CREATED));
});

export const listTasks = asyncHandler(async (req, res) => {
  const result = await taskService.list(req.board, req.query);

  res.json(ApiResponse.ok(result, TASK_MESSAGES.LIST_FETCHED));
});

export const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getById(
    req.workspace,
    req.board,
    req.params.taskId
  );

  res.json(ApiResponse.ok({ task }, TASK_MESSAGES.FETCHED));
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.update(
    req.workspace,
    req.project,
    req.board,
    req.task,
    req.body,
    req.user._id,
    req.actorMembership
  );

  res.json(ApiResponse.ok({ task }, TASK_MESSAGES.UPDATED));
});

export const deleteTask = asyncHandler(async (req, res) => {
  await taskService.delete(req.workspace, req.project, req.board, req.task);

  res.json(ApiResponse.ok(null, TASK_MESSAGES.DELETED));
});
