import { Task } from '../../models/task/task.model.js';
import { Column } from '../../models/column/column.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { ProjectMember } from '../../models/project-member/projectMember.model.js';
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
import { findEffectiveProjectMembershipOrThrow } from '../project-member/projectMember.helpers.js';

// Resolves the set of user ids (from the given candidates) that have access to
// the project, either as workspace members or as project-scoped members.
const resolveProjectMemberIds = async (workspaceId, projectId, userIds) => {
  const uniqueIds = [...new Set(userIds.map((id) => id.toString()))];

  const [workspaceMembers, projectMembers] = await Promise.all([
    WorkspaceMember.find({
      workspaceId,
      userId: { $in: uniqueIds },
    }).select('userId'),
    ProjectMember.find({
      projectId,
      userId: { $in: uniqueIds },
    }).select('userId'),
  ]);

  const allowed = new Set([
    ...workspaceMembers.map((member) => member.userId.toString()),
    ...projectMembers.map((member) => member.userId.toString()),
  ]);

  return { uniqueIds, allowed };
};

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
  const task = await populateTask(Task.findOne({ _id: taskId, boardId, workspaceId }));

  if (!task) {
    throw ApiError.notFound(TASK_MESSAGES.NOT_FOUND);
  }

  return task;
};

export const ensureColumnBelongsToBoard = async (columnId, boardId) => {
  const column = await Column.findOne({ _id: columnId, boardId }).select('_id isCompletedColumn');

  if (!column) {
    throw ApiError.badRequest(TASK_MESSAGES.INVALID_COLUMN);
  }

  return column;
};

export const ensureAssigneesAreMembers = async (workspaceId, projectId, assigneeIds) => {
  if (!assigneeIds?.length) {
    return;
  }

  const { uniqueIds, allowed } = await resolveProjectMemberIds(workspaceId, projectId, assigneeIds);

  if (uniqueIds.some((id) => !allowed.has(id))) {
    throw ApiError.badRequest(TASK_MESSAGES.INVALID_ASSIGNEE);
  }
};

export const ensureReporterIsMember = async (workspaceId, projectId, reporterId) => {
  const { allowed } = await resolveProjectMemberIds(workspaceId, projectId, [reporterId]);

  if (!allowed.has(reporterId.toString())) {
    throw ApiError.badRequest(TASK_MESSAGES.INVALID_REPORTER);
  }
};

export const assertTaskUpdatePermissions = (membership, data, task) => {
  const generalFields = ['title', 'details', 'dueDate', 'labels', 'reporterId'];
  const hasGeneralUpdates = generalFields.some((field) => {
    if (data[field] === undefined) {
      return false;
    }

    if (field === 'reporterId') {
      return data.reporterId.toString() !== task.reporterId.toString();
    }

    if (field === 'labels') {
      return JSON.stringify(data.labels ?? []) !== JSON.stringify(task.labels ?? []);
    }

    if (field === 'dueDate') {
      const currentDueDate = task.dueDate?.toISOString() ?? null;
      const nextDueDate = data.dueDate instanceof Date ? data.dueDate.toISOString() : data.dueDate;

      return currentDueDate !== nextDueDate;
    }

    return data[field] !== task[field];
  });

  if (hasGeneralUpdates) {
    ensureCanUpdateTask(membership);
  }

  if (
    (data.columnId !== undefined && data.columnId.toString() !== task.columnId.toString()) ||
    (data.position !== undefined && data.position !== task.position)
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
      data.completedAt instanceof Date ? data.completedAt.toISOString() : data.completedAt;

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

export const ensureActorCanViewTasks = async (workspace, projectId, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(workspace._id, projectId, userId);
  ensureCanViewTask(membership);
  return membership;
};

export const ensureActorCanCreateTask = async (workspace, projectId, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(workspace._id, projectId, userId);
  ensureCanCreateTask(membership);
  return membership;
};

export const ensureActorCanDeleteTask = async (workspace, projectId, userId) => {
  const membership = await findEffectiveProjectMembershipOrThrow(workspace._id, projectId, userId);
  ensureCanDeleteTask(membership);
  return membership;
};

export const findActorProjectMembershipOrThrow = (workspace, projectId, userId) =>
  findEffectiveProjectMembershipOrThrow(workspace._id, projectId, userId);
