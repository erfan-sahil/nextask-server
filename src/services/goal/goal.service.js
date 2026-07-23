import { Goal } from '../../models/goal/goal.model.js';
import { GOAL_PRIORITY } from '../../constants/goalPriority.js';
import { GOAL_STATUS } from '../../constants/goalStatus.js';
import { sanitizeRichText } from '../../utils/sanitizeRichText.js';
import {
  assertValidDateRange,
  findPopulatedGoalOrThrow,
  populateGoal,
} from './goal.helpers.js';

const resolveCompletedAt = (status, completedAt, existingCompletedAt = null) => {
  if (status === GOAL_STATUS.COMPLETED) {
    return completedAt ?? existingCompletedAt ?? new Date();
  }

  return completedAt ?? null;
};

export const goalService = {
  async create(workspace, data, userId) {
    assertValidDateRange(data.startDate, data.dueDate);

    const status = data.status ?? GOAL_STATUS.PLANNING;
    const goal = await Goal.create({
      workspaceId: workspace._id,
      title: data.title,
      details: sanitizeRichText(data.details),
      status,
      startDate: data.startDate ?? null,
      dueDate: data.dueDate ?? null,
      priority: data.priority ?? GOAL_PRIORITY.MEDIUM,
      createdBy: userId,
      completedAt: resolveCompletedAt(status, data.completedAt),
    });

    return findPopulatedGoalOrThrow(goal._id, workspace._id);
  },

  async list(workspace, { page = 1, limit = 20, status, priority, search }) {
    const filter = { workspaceId: workspace._id };

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [goals, total] = await Promise.all([
      populateGoal(
        Goal.find(filter)
          .sort({ dueDate: 1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Goal.countDocuments(filter),
    ]);

    return {
      goals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getById(workspace, goalId) {
    return findPopulatedGoalOrThrow(goalId, workspace._id);
  },

  async update(workspace, goal, data) {
    const startDate =
      data.startDate !== undefined ? data.startDate : goal.startDate;
    const dueDate = data.dueDate !== undefined ? data.dueDate : goal.dueDate;

    assertValidDateRange(startDate, dueDate);

    if (data.title !== undefined) {
      goal.title = data.title;
    }

    if (data.details !== undefined) {
      goal.details = sanitizeRichText(data.details);
    }

    if (data.status !== undefined) {
      goal.status = data.status;
    }

    if (data.startDate !== undefined) {
      goal.startDate = data.startDate;
    }

    if (data.dueDate !== undefined) {
      goal.dueDate = data.dueDate;
    }

    if (data.priority !== undefined) {
      goal.priority = data.priority;
    }

    const nextStatus = data.status ?? goal.status;
    if (data.status !== undefined || data.completedAt !== undefined) {
      goal.completedAt = resolveCompletedAt(
        nextStatus,
        data.completedAt,
        goal.completedAt
      );
    }

    await goal.save();

    return findPopulatedGoalOrThrow(goal._id, workspace._id);
  },

  async delete(goal) {
    await goal.deleteOne();
  },
};
