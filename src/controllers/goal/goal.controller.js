import { GOAL_MESSAGES } from '../../constants/goalMessages.js';
import { goalService } from '../../services/goal/goal.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const createGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.create(req.workspace, req.body, req.user._id);

  res.status(201).json(ApiResponse.created({ goal }, GOAL_MESSAGES.CREATED));
});

export const listGoals = asyncHandler(async (req, res) => {
  const result = await goalService.list(req.workspace, req.query);

  res.json(ApiResponse.ok(result, GOAL_MESSAGES.LIST_FETCHED));
});

export const getGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.getById(req.workspace, req.params.goalId);

  res.json(ApiResponse.ok({ goal }, GOAL_MESSAGES.FETCHED));
});

export const updateGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.update(req.workspace, req.goal, req.body);

  res.json(ApiResponse.ok({ goal }, GOAL_MESSAGES.UPDATED));
});

export const deleteGoal = asyncHandler(async (req, res) => {
  await goalService.delete(req.goal);

  res.json(ApiResponse.ok(null, GOAL_MESSAGES.DELETED));
});
