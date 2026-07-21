import mongoose from 'mongoose';
import { Board } from '../../models/board/board.model.js';
import { Column } from '../../models/column/column.model.js';
import { Task } from '../../models/task/task.model.js';
import { TaskComment } from '../../models/task-comment/taskComment.model.js';
import { Project } from '../../models/project/project.model.js';
import { Workspace } from '../../models/workspace/workspace.model.js';
import { DEFAULT_BOARD_COLUMNS } from '../../constants/defaultBoardColumns.js';
import {
  populateBoard,
  findPopulatedBoardOrThrow,
} from './board.helpers.js';

const touchProjectAndWorkspaceActivity = async (workspaceId, projectId) => {
  const now = new Date();

  await Promise.all([
    Project.findByIdAndUpdate(projectId, { lastActivityAt: now }),
    Workspace.findByIdAndUpdate(workspaceId, { lastActivityAt: now }),
  ]);
};

const syncTaskCounts = async (workspaceId, projectId, session) => {
  const [projectTaskCount, workspaceTaskCount] = await Promise.all([
    Task.countDocuments({ workspaceId, projectId }).session(session),
    Task.countDocuments({ workspaceId }).session(session),
  ]);

  await Promise.all([
    Project.findByIdAndUpdate(
      projectId,
      { taskCount: projectTaskCount },
      { session }
    ),
    Workspace.findByIdAndUpdate(
      workspaceId,
      { taskCount: workspaceTaskCount },
      { session }
    ),
  ]);
};

export const boardService = {
  async create(workspace, project, data, userId) {
    const session = await mongoose.startSession();
    let board;

    try {
      session.startTransaction();

      [board] = await Board.create(
        [
          {
            workspaceId: workspace._id,
            projectId: project._id,
            name: data.name,
            description: data.description ?? '',
            createdBy: userId,
            updatedBy: userId,
          },
        ],
        { session }
      );

      await Column.create(
        DEFAULT_BOARD_COLUMNS.map((column) => ({
          ...column,
          boardId: board._id,
          createdBy: userId,
        })),
        { session }
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    await touchProjectAndWorkspaceActivity(workspace._id, project._id);

    return findPopulatedBoardOrThrow(
      board._id,
      project._id,
      workspace._id
    );
  },

  async list(project, { page = 1, limit = 10, search }) {
    const filter = { projectId: project._id, workspaceId: project.workspaceId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [boards, total] = await Promise.all([
      populateBoard(
        Board.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ),
      Board.countDocuments(filter),
    ]);

    return {
      boards,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getById(workspace, project, boardId) {
    return findPopulatedBoardOrThrow(
      boardId,
      project._id,
      workspace._id
    );
  },

  async update(workspace, project, board, data, userId) {
    if (data.name !== undefined) {
      board.name = data.name;
    }

    if (data.description !== undefined) {
      board.description = data.description;
    }

    board.updatedBy = userId;

    await board.save();
    await touchProjectAndWorkspaceActivity(workspace._id, project._id);

    return findPopulatedBoardOrThrow(
      board._id,
      project._id,
      workspace._id
    );
  },

  async delete(workspace, project, board) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      await TaskComment.deleteMany({ boardId: board._id }).session(session);
      await Task.deleteMany({ boardId: board._id }).session(session);
      await Column.deleteMany({ boardId: board._id }).session(session);
      await board.deleteOne({ session });
      await syncTaskCounts(workspace._id, project._id, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    await touchProjectAndWorkspaceActivity(workspace._id, project._id);
  },
};
