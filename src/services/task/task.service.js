import mongoose from 'mongoose';
import { Task } from '../../models/task/task.model.js';
import { Project } from '../../models/project/project.model.js';
import { Workspace } from '../../models/workspace/workspace.model.js';
import { TASK_PRIORITY } from '../../constants/taskPriority.js';
import {
  populateTask,
  findPopulatedTaskOrThrow,
  ensureColumnBelongsToBoard,
  ensureAssigneesAreMembers,
  ensureReporterIsMember,
  assertTaskUpdatePermissions,
  resolveCompletedAtForColumn,
} from './task.helpers.js';

const syncTaskCounts = async (workspaceId, projectId, session = null) => {
  const [projectCount, workspaceCount] = await Promise.all([
    Task.countDocuments({ workspaceId, projectId }).session(session),
    Task.countDocuments({ workspaceId }).session(session),
  ]);

  const now = new Date();

  await Promise.all([
    Project.findByIdAndUpdate(
      projectId,
      { taskCount: projectCount, lastActivityAt: now },
      { session }
    ),
    Workspace.findByIdAndUpdate(
      workspaceId,
      { taskCount: workspaceCount, lastActivityAt: now },
      { session }
    ),
  ]);
};

const touchActivity = async (workspaceId, projectId) => {
  const now = new Date();

  await Promise.all([
    Project.findByIdAndUpdate(projectId, { lastActivityAt: now }),
    Workspace.findByIdAndUpdate(workspaceId, { lastActivityAt: now }),
  ]);
};

export const taskService = {
  async create(workspace, project, board, data, userId) {
    const column = await ensureColumnBelongsToBoard(data.columnId, board._id);
    const reporterId = data.reporterId ?? userId;

    await ensureReporterIsMember(workspace._id, project._id, reporterId);

    if (data.assignees?.length) {
      await ensureAssigneesAreMembers(
        workspace._id,
        project._id,
        data.assignees
      );
    }

    const session = await mongoose.startSession();
    let task;

    try {
      session.startTransaction();

      [task] = await Task.create(
        [
          {
            workspaceId: workspace._id,
            projectId: project._id,
            boardId: board._id,
            columnId: data.columnId,
            title: data.title,
            description: data.description ?? '',
            priority: data.priority ?? TASK_PRIORITY.MEDIUM,
            assignees: data.assignees ?? [],
            reporterId,
            dueDate: data.dueDate ?? null,
            labels: data.labels ?? [],
            createdBy: userId,
            updatedBy: userId,
            completedAt: resolveCompletedAtForColumn(column, null),
            lastActivityAt: new Date(),
          },
        ],
        { session }
      );

      await syncTaskCounts(workspace._id, project._id, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return findPopulatedTaskOrThrow(task._id, board._id, workspace._id);
  },

  async list(
    board,
    { page = 1, limit = 20, columnId, priority, assignee, search }
  ) {
    const filter = { boardId: board._id, workspaceId: board.workspaceId };

    if (columnId) {
      filter.columnId = columnId;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignee) {
      filter.assignees = assignee;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      populateTask(
        Task.find(filter)
          .sort({ lastActivityAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Task.countDocuments(filter),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getById(workspace, board, taskId) {
    return findPopulatedTaskOrThrow(taskId, board._id, workspace._id);
  },

  async update(workspace, project, board, task, data, userId, membership) {
    assertTaskUpdatePermissions(membership, data, task);

    let targetColumn = null;

    if (data.columnId !== undefined) {
      targetColumn = await ensureColumnBelongsToBoard(data.columnId, board._id);
    }

    if (data.reporterId !== undefined) {
      await ensureReporterIsMember(workspace._id, project._id, data.reporterId);
    }

    if (data.assignees !== undefined) {
      await ensureAssigneesAreMembers(
        workspace._id,
        project._id,
        data.assignees
      );
    }

    if (data.title !== undefined) {
      task.title = data.title;
    }

    if (data.description !== undefined) {
      task.description = data.description;
    }

    if (data.priority !== undefined) {
      task.priority = data.priority;
    }

    if (data.assignees !== undefined) {
      task.assignees = data.assignees;
    }

    if (data.reporterId !== undefined) {
      task.reporterId = data.reporterId;
    }

    if (data.dueDate !== undefined) {
      task.dueDate = data.dueDate;
    }

    if (data.labels !== undefined) {
      task.labels = data.labels;
    }

    if (data.columnId !== undefined) {
      task.columnId = data.columnId;

      if (data.completedAt === undefined) {
        task.completedAt = resolveCompletedAtForColumn(
          targetColumn,
          task.completedAt
        );
      }
    }

    if (data.completedAt !== undefined) {
      task.completedAt = data.completedAt;
    }

    task.updatedBy = userId;
    task.lastActivityAt = new Date();

    await task.save();
    await touchActivity(workspace._id, project._id);

    return findPopulatedTaskOrThrow(task._id, board._id, workspace._id);
  },

  async delete(workspace, project, board, task) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await task.deleteOne({ session });
      await syncTaskCounts(workspace._id, project._id, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
};
