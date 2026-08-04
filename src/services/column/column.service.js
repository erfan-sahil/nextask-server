import mongoose from 'mongoose';
import { Column } from '../../models/column/column.model.js';
import { Task } from '../../models/task/task.model.js';
import { Project } from '../../models/project/project.model.js';
import { Workspace } from '../../models/workspace/workspace.model.js';
import {
  COLUMN_MESSAGES,
  DEFAULT_COLUMN_COLOR,
} from '../../constants/columnMessages.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  populateColumn,
  findPopulatedColumnOrThrow,
  ensureNoOtherCompletedColumn,
  shiftPositionsOnCreate,
  shiftPositionsOnUpdate,
  shiftPositionsOnDelete,
} from './column.helpers.js';

const touchProjectAndWorkspaceActivity = async (workspaceId, projectId) => {
  const now = new Date();

  await Promise.all([
    Project.findByIdAndUpdate(projectId, { lastActivityAt: now }),
    Workspace.findByIdAndUpdate(workspaceId, { lastActivityAt: now }),
  ]);
};

export const columnService = {
  async create(board, data, userId) {
    if (data.isCompletedColumn) {
      await ensureNoOtherCompletedColumn(board._id);
    }

    const session = await mongoose.startSession();
    let column;

    try {
      session.startTransaction();

      await shiftPositionsOnCreate(board._id, data.position, session);

      [column] = await Column.create(
        [
          {
            boardId: board._id,
            name: data.name,
            position: data.position,
            color: data.color ?? DEFAULT_COLUMN_COLOR,
            isCompletedColumn: data.isCompletedColumn ?? false,
            createdBy: userId,
          },
        ],
        { session }
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    await touchProjectAndWorkspaceActivity(board.workspaceId, board.projectId);

    return findPopulatedColumnOrThrow(column._id, board._id);
  },

  async list(board) {
    const columns = await populateColumn(Column.find({ boardId: board._id }).sort({ position: 1 }));

    return { columns };
  },

  async getById(board, columnId) {
    return findPopulatedColumnOrThrow(columnId, board._id);
  },

  async update(board, column, data) {
    if (data.isCompletedColumn === true) {
      await ensureNoOtherCompletedColumn(board._id, column._id);
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      if (data.position !== undefined && data.position !== column.position) {
        await shiftPositionsOnUpdate(
          board._id,
          column._id,
          column.position,
          data.position,
          session
        );
        column.position = data.position;
      }

      if (data.name !== undefined) {
        column.name = data.name;
      }

      if (data.color !== undefined) {
        column.color = data.color;
      }

      if (data.isCompletedColumn !== undefined) {
        column.isCompletedColumn = data.isCompletedColumn;
      }

      await column.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    await touchProjectAndWorkspaceActivity(board.workspaceId, board.projectId);

    return findPopulatedColumnOrThrow(column._id, board._id);
  },

  async delete(board, column) {
    const hasTasks = await Task.exists({ columnId: column._id });

    if (hasTasks) {
      throw ApiError.badRequest(COLUMN_MESSAGES.HAS_TASKS);
    }

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await column.deleteOne({ session });
      await shiftPositionsOnDelete(board._id, column.position, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    await touchProjectAndWorkspaceActivity(board.workspaceId, board.projectId);
  },
};
