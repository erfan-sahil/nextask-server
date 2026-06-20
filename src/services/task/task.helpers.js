import { Task } from '../../models/task/task.model.js';
import { Column } from '../../models/column/column.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { TASK_MESSAGES } from '../../constants/taskMessages.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  ensureCanCreateTask,
  ensureCanViewTask,
  ensureCanUpdateTask,
  ensureCanDeleteTask,
  ensureCanAssignTask,
  ensureCanMoveTask,
  ensureCanChangeTaskPriority,
  ensureCanChangeTaskStatus,
} from '../workspace-member/memberPermission.helpers.js';
import { findActorMembershipOrThrow } from '../workspace-member/workspaceMember.helpers.js';

export const populateTask = (query) =>
  query
    .populate('assignees', USER_POPULATE_FIELDS)
    .populate('reporterId', USER_POPULATE_FIELDS)
    .populate('createdBy', USER_POPULATE_FIELDS)
    .populate('updatedBy', USER_POPULATE_FIELDS)
    .populate('columnId', 'name position isCompletedColumn color')
    .populate('boardId', 'name')
    .populate('projectId', 'name status')
    .populate('workspaceId', 'name slug');

export const findTaskOrThrow = async (taskId, boardId, workspaceId) => {
  const task = await Task.findOne({ _id: taskId, boardId, workspaceId });

  if (!task) {
    throw ApiError.notFound(TASK_MESSAGES.NOT_FOUND);
  }

  return task;
};

export const findPopulatedTaskOrThrow = async (taskId, boardId, workspaceId) => {
  const task = await populateTask(
    Task.findOne({ _id: taskId, boardId, workspaceId })
  );

  if (!task) {
    throw ApiError.notFound(TASK_MESSAGES.NOT_FOUND);
  }

  return task;
};

export const ensureColumnBelongsToBoard = async (columnId, boardId) => {
  const column = await Column.findOne({ _id: columnId, boardId }).select(
    '_id isCompletedColumn'
  );

  if (!column) {
    throw ApiError.badRequest(TASK_MESSAGES.INVALID_COLUMN);
  }

  return column;
};

export const ensureAssigneesAreMembers = async (workspaceId, assigneeIds) => {
  if (!assigneeIds?.length) {
    return;
  }

  const uniqueIds = [...new Set(assigneeIds.map((id) => id.toString()))];
  const memberCount = await WorkspaceMember.countDocuments({
    workspaceId,
    userId: { $in: uniqueIds },
  });

  if (memberCount !== uniqueIds.length) {
    throw ApiError.badRequest(TASK_MESSAGES.INVALID_ASSIGNEE);
  }
};

export const ensureReporterIsMember = async (workspaceId, reporterId) => {
  const membership = await WorkspaceMember.findOne({
    workspaceId,
    userId: reporterId,
  }).select('_id');

  if (!membership) {
    throw ApiError.badRequest(TASK_MESSAGES.INVALID_REPORTER);
  }
};

export const assertTaskUpdatePermissions = (membership, data, task) => {
  const generalFields = ['title', 'description', 'dueDate', 'labels', 'reporterId'];
  const hasGeneralUpdates = generalFields.some((field) => {
    if (data[field] === undefined) {
      return false;
    }

    if (field === 'reporterId') {
      return data.reporterId.toString() !== task.reporterId.toString();
    }

    if (field === 'labels') {
      return (
        JSON.stringify(data.labels ?? []) !== JSON.stringify(task.labels ?? [])
      );
    }

    if (field === 'dueDate') {
      const currentDueDate = task.dueDate?.toISOString() ?? null;
      const nextDueDate =
        data.dueDate instanceof Date
          ? data.dueDate.toISOString()
          : data.dueDate;

      return currentDueDate !== nextDueDate;
    }

    return data[field] !== task[field];
  });

  if (hasGeneralUpdates) {
    ensureCanUpdateTask(membership);
  }

  if (
    data.columnId !== undefined &&
    data.columnId.toString() !== task.columnId.toString()
  ) {
    ensureCanMoveTask(membership);
  }

  if (data.priority !== undefined && data.priority !== task.priority) {
    ensureCanChangeTaskPriority(membership);
  }

  if (data.assignees !== undefined) {
    const currentAssignees = (task.assignees ?? []).map((id) => id.toString());
    const nextAssignees = data.assignees.map((id) => id.toString());

    if (
      currentAssignees.length !== nextAssignees.length ||
      !currentAssignees.every((id) => nextAssignees.includes(id))
    ) {
      ensureCanAssignTask(membership);
    }
  }

  if (data.completedAt !== undefined) {
    const currentCompletedAt = task.completedAt?.toISOString() ?? null;
    const nextCompletedAt =
      data.completedAt instanceof Date
        ? data.completedAt.toISOString()
        : data.completedAt;

    if (currentCompletedAt !== nextCompletedAt) {
      ensureCanChangeTaskStatus(membership);
    }
  }
};

export const resolveCompletedAtForColumn = (column, existingCompletedAt) => {
  if (column.isCompletedColumn) {
    return existingCompletedAt ?? new Date();
  }

  return null;
};

export const ensureActorCanViewTasks = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanViewTask(membership);
  return membership;
};

export const ensureActorCanCreateTask = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanCreateTask(membership);
  return membership;
};

export const ensureActorCanDeleteTask = async (workspace, userId) => {
  const membership = await findActorMembershipOrThrow(workspace._id, userId);
  ensureCanDeleteTask(membership);
  return membership;
};
