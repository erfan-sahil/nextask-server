import { TaskComment } from '../../models/task-comment/taskComment.model.js';
import { Project } from '../../models/project/project.model.js';
import { Workspace } from '../../models/workspace/workspace.model.js';
import {
  findPopulatedTaskCommentOrThrow,
  populateTaskComment,
} from './taskComment.helpers.js';

const touchActivity = async (workspaceId, projectId) => {
  const now = new Date();

  await Promise.all([
    Project.findByIdAndUpdate(projectId, { lastActivityAt: now }),
    Workspace.findByIdAndUpdate(workspaceId, { lastActivityAt: now }),
  ]);
};

export const taskCommentService = {
  async create(workspace, project, board, task, content, userId) {
    const comment = await TaskComment.create({
      workspaceId: workspace._id,
      projectId: project._id,
      boardId: board._id,
      taskId: task._id,
      content,
      createdBy: userId,
      updatedBy: userId,
    });

    await touchActivity(workspace._id, project._id);

    return findPopulatedTaskCommentOrThrow(comment._id, task._id);
  },

  async list(task, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const filter = { taskId: task._id };

    const [comments, total] = await Promise.all([
      populateTaskComment(
        TaskComment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      ),
      TaskComment.countDocuments(filter),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getById(task, commentId) {
    return findPopulatedTaskCommentOrThrow(commentId, task._id);
  },

  async update(workspace, project, task, comment, content, userId) {
    comment.content = content;
    comment.updatedBy = userId;
    await comment.save();

    await touchActivity(workspace._id, project._id);

    return findPopulatedTaskCommentOrThrow(comment._id, task._id);
  },

  async delete(workspace, project, comment) {
    await comment.deleteOne();
    await touchActivity(workspace._id, project._id);
  },

  async deleteByTask(taskId, session = null) {
    await TaskComment.deleteMany({ taskId }).session(session);
  },

  async deleteByBoard(boardId, session = null) {
    await TaskComment.deleteMany({ boardId }).session(session);
  },

  async deleteByProject(projectId, session = null) {
    await TaskComment.deleteMany({ projectId }).session(session);
  },

  async deleteByWorkspace(workspaceId, session = null) {
    await TaskComment.deleteMany({ workspaceId }).session(session);
  },
};
