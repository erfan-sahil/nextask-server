import mongoose from 'mongoose';
import { Project } from '../../models/project/project.model.js';
import { ProjectMember } from '../../models/project-member/projectMember.model.js';
import { Board } from '../../models/board/board.model.js';
import { Column } from '../../models/column/column.model.js';
import { Task } from '../../models/task/task.model.js';
import { TaskComment } from '../../models/task-comment/taskComment.model.js';
import { Workspace } from '../../models/workspace/workspace.model.js';
import { PROJECT_STATUS } from '../../constants/projectStatus.js';
import { projectMemberService } from '../project-member/projectMember.service.js';
import { projectInvitationService } from '../project-invitation/projectInvitation.service.js';
import {
  populateProject,
  findPopulatedProjectOrThrow,
  assertValidDateRange,
} from './project.helpers.js';

const syncWorkspaceProjectCount = async (workspaceId, session = null) => {
  const count = await Project.countDocuments({ workspaceId }).session(session);

  await Workspace.findByIdAndUpdate(
    workspaceId,
    { projectCount: count, lastActivityAt: new Date() },
    { session }
  );
};

const syncWorkspaceTaskCount = async (workspaceId, session = null) => {
  const taskCount = await Task.countDocuments({ workspaceId }).session(session);

  await Workspace.findByIdAndUpdate(workspaceId, { taskCount }, { session });
};

export const projectService = {
  async create(workspace, data, userId) {
    assertValidDateRange(data.startDate, data.endDate);

    const session = await mongoose.startSession();
    let project;

    try {
      session.startTransaction();

      [project] = await Project.create(
        [
          {
            workspaceId: workspace._id,
            name: data.name,
            description: data.description ?? '',
            icon: data.icon ?? null,
            status: data.status ?? PROJECT_STATUS.ACTIVE,
            startDate: data.startDate ?? null,
            endDate: data.endDate ?? null,
            taskCount: 0,
            createdBy: userId,
            updatedBy: userId,
            lastActivityAt: new Date(),
          },
        ],
        { session }
      );

      // The creator becomes the project OWNER.
      await projectMemberService.createOwnerMember(
        {
          projectId: project._id,
          workspaceId: workspace._id,
          userId,
        },
        session
      );

      await syncWorkspaceProjectCount(workspace._id, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return findPopulatedProjectOrThrow(project._id, workspace._id);
  },

  async list(workspace, { page = 1, limit = 10, status, search }, scope = {}) {
    const filter = { workspaceId: workspace._id };

    // Project-scoped members only see the projects they belong to.
    if (scope.isWorkspaceMember === false) {
      const memberships = await ProjectMember.find({
        workspaceId: workspace._id,
        userId: scope.userId,
      }).select('projectId');

      filter._id = { $in: memberships.map((item) => item.projectId) };
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      populateProject(
        Project.find(filter)
          .sort({ lastActivityAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Project.countDocuments(filter),
    ]);

    return {
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getById(workspace, projectId) {
    return findPopulatedProjectOrThrow(projectId, workspace._id);
  },

  async update(workspace, project, data, userId) {
    const startDate =
      data.startDate !== undefined ? data.startDate : project.startDate;
    const endDate =
      data.endDate !== undefined ? data.endDate : project.endDate;

    assertValidDateRange(startDate, endDate);

    if (data.name !== undefined) {
      project.name = data.name;
    }

    if (data.description !== undefined) {
      project.description = data.description;
    }

    if (data.icon !== undefined) {
      project.icon = data.icon;
    }

    if (data.status !== undefined) {
      project.status = data.status;
    }

    if (data.startDate !== undefined) {
      project.startDate = data.startDate;
    }

    if (data.endDate !== undefined) {
      project.endDate = data.endDate;
    }

    project.updatedBy = userId;
    project.lastActivityAt = new Date();

    await project.save();

    await Workspace.findByIdAndUpdate(workspace._id, {
      lastActivityAt: new Date(),
    });

    return findPopulatedProjectOrThrow(project._id, workspace._id);
  },

  async delete(workspace, project) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      const boardIds = await Board.distinct('_id', {
        projectId: project._id,
      }).session(session);

      await TaskComment.deleteMany({ projectId: project._id }).session(session);
      await Task.deleteMany({ projectId: project._id }).session(session);
      await Column.deleteMany({ boardId: { $in: boardIds } }).session(session);
      await Board.deleteMany({ projectId: project._id }).session(session);
      await project.deleteOne({ session });
      await projectMemberService.deleteByProject(project._id, session);
      await projectInvitationService.deleteByProject(project._id, session);
      await syncWorkspaceProjectCount(workspace._id, session);
      await syncWorkspaceTaskCount(workspace._id, session);

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
};
