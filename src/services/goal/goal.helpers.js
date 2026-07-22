import { Goal } from '../../models/goal/goal.model.js';
import { GOAL_MESSAGES } from '../../constants/goalMessages.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import { ApiError } from '../../utils/ApiError.js';

export const populateGoal = (query) =>
  query
    .populate('createdBy', USER_POPULATE_FIELDS)
    .populate('workspaceId', 'name slug');

export const findGoalOrThrow = async (goalId, workspaceId) => {
  const goal = await Goal.findOne({ _id: goalId, workspaceId });

  if (!goal) {
    throw ApiError.notFound(GOAL_MESSAGES.NOT_FOUND);
  }

  return goal;
};

export const findPopulatedGoalOrThrow = async (goalId, workspaceId) => {
  const goal = await populateGoal(
    Goal.findOne({ _id: goalId, workspaceId })
  );

  if (!goal) {
    throw ApiError.notFound(GOAL_MESSAGES.NOT_FOUND);
  }

  return goal;
};

export const assertValidDateRange = (startDate, dueDate) => {
  if (startDate && dueDate && dueDate < startDate) {
    throw ApiError.badRequest(GOAL_MESSAGES.INVALID_DATE_RANGE);
  }
};
