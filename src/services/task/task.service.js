import mongoose from 'mongoose';
import { Task } from '../../models/task/task.model.js';
import { TaskComment } from '../../models/task-comment/taskComment.model.js';
import { Project } from '../../models/project/project.model.js';
import { Workspace } from '../../models/workspace/workspace.model.js';
import { TASK_PRIORITY } from '../../constants/taskPriority.js';
import { sanitizeRichText } from '../../utils/sanitizeRichText.js';
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

const moveTaskToPosition = async (task, boardId, data, session) => {
  const sourceColumnId = task.columnId.toString();
  const targetColumnId = data.columnId?.toString() ?? sourceColumnId;
  const isColumnChanging = targetColumnId !== sourceColumnId;

  if (!isColumnChanging && data.position === undefined) {
    return;
  }

  const destinationTaskCount = await Task.countDocuments({
    boardId,
    columnId: targetColumnId,
    _id: { $ne: task._id },
  }).session(session);
  const targetPosition = Math.min(
    Math.max(data.position ?? destinationTaskCount, 0),
    destinationTaskCount
  );
  const currentPosition = task.position ?? 0;

  if (!isColumnChanging) {
    if (targetPosition === currentPosition) {
      return;
    }

    await Task.updateMany(
      targetPosition < currentPosition
        ? {
            boardId,
            columnId: sourceColumnId,
            _id: { $ne: task._id },
            position: { $gte: targetPosition, $lt: currentPosition },
          }
        : {
            boardId,
            columnId: sourceColumnId,
            _id: { $ne: task._id },
            position: { $gt: currentPosition, $lte: targetPosition },
          },
      { $inc: { position: targetPosition < currentPosition ? 1 : -1 } },
      { session }
    );
  } else {
    await Promise.all([
      Task.updateMany(
        {
          boardId,
          columnId: sourceColumnId,
          position: { $gt: currentPosition },
        },
        { $inc: { position: -1 } },
        { session }
      ),
      Task.updateMany(
        {
          boardId,
          columnId: targetColumnId,
          position: { $gte: targetPosition },
        },
        { $inc: { position: 1 } },
        { session }
      ),
    ]);
  }

  task.columnId = targetColumnId;
  task.position = targetPosition;
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
      const lastTask = await Task.findOne({
        boardId: board._id,
        columnId: data.columnId,
      })
        .sort({ position: -1 })
        .select('position')
        .session(session);

      [task] = await Task.create(
        [
          {
            workspaceId: workspace._id,
            projectId: project._id,
            boardId: board._id,
            columnId: data.columnId,
            position: (lastTask?.position ?? -1) + 1,
            title: data.title,
            details: sanitizeRichText(data.details),
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
        { details: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      populateTask(
        Task.find(filter)
          .sort({ position: 1, createdAt: 1 })
          .skip(skip)
          .limit(limit)
      ),
      Task.countDocuments(filter),
    ]);
    const commentCounts = tasks.length
      ? await TaskComment.aggregate([
          { $match: { taskId: { $in: tasks.map((task) => task._id) } } },
          { $group: { _id: '$taskId', count: { $sum: 1 } } },
        ])
      : [];
    const commentCountByTaskId = new Map(
      commentCounts.map(({ _id, count }) => [_id.toString(), count]),
    );

    return {
      tasks: tasks.map((task) => ({
        ...task.toObject(),
        commentCount: commentCountByTaskId.get(task._id.toString()) ?? 0,
      })),
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

    if (data.details !== undefined) {
      task.details = sanitizeRichText(data.details);
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

    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      await moveTaskToPosition(task, board._id, data, session);
      await task.save({ session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    await touchActivity(workspace._id, project._id);

    return findPopulatedTaskOrThrow(task._id, board._id, workspace._id);
  },

  async delete(workspace, project, board, task) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await TaskComment.deleteMany({ taskId: task._id }).session(session);
      await task.deleteOne({ session });
      await Task.updateMany(
        {
          boardId: board._id,
          columnId: task.columnId,
          position: { $gt: task.position },
        },
        { $inc: { position: -1 } },
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
  },
};
