import mongoose from 'mongoose';
import { Project } from '../../models/project/project.model.js';
import { ProjectMember } from '../../models/project-member/projectMember.model.js';
import { Task } from '../../models/task/task.model.js';
import { Column } from '../../models/column/column.model.js';
import { REPORT_PERIOD } from '../../validations/report/report.validation.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcMonths = (date, months) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));

const resolveDateRange = ({ period, from, to, toIsDateOnly }) => {
  const now = new Date();
  const end = to ? new Date(to) : now;
  const rangeEnd = toIsDateOnly ? new Date(end.getTime() + DAY_IN_MS) : end;
  const rangeStart = from
    ? startOfUtcDay(from)
    : (() => {
        const start = startOfUtcDay(now);
        const monthsByPeriod = {
          [REPORT_PERIOD.LAST_MONTH]: -1,
          [REPORT_PERIOD.LAST_THREE_MONTHS]: -3,
          [REPORT_PERIOD.LAST_SIX_MONTHS]: -6,
          [REPORT_PERIOD.LAST_YEAR]: -12,
        };

        if (period === REPORT_PERIOD.LAST_WEEK || !period) {
          return new Date(start.getTime() - 7 * DAY_IN_MS);
        }

        return addUtcMonths(start, monthsByPeriod[period] ?? -1);
      })();

  return { start: rangeStart, end: rangeEnd, now };
};

const buildTimeline = (start, end, created, completed) => {
  const rowsByDate = new Map();

  for (
    let cursor = new Date(start);
    cursor < end;
    cursor = new Date(cursor.getTime() + DAY_IN_MS)
  ) {
    const date = cursor.toISOString().slice(0, 10);
    rowsByDate.set(date, { date, created: 0, completed: 0 });
  }

  for (const item of created) {
    rowsByDate.get(item._id).created = item.count;
  }

  for (const item of completed) {
    rowsByDate.get(item._id).completed = item.count;
  }

  return [...rowsByDate.values()];
};

const getDateBuckets = (field, taskMatch, start, end) =>
  Task.aggregate([
    { $match: { ...taskMatch, [field]: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: {
          $dateToString: { date: `$${field}`, format: '%Y-%m-%d', timezone: 'UTC' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

export const reportService = {
  async getWorkspaceReport(workspaceId, filters) {
    const { start, end, now } = resolveDateRange(filters);
    const requestedProjectIds = (filters.projectIds ?? []).map(
      (projectId) => new mongoose.Types.ObjectId(projectId)
    );
    const projectFilter = {
      workspaceId,
      ...(requestedProjectIds.length ? { _id: { $in: requestedProjectIds } } : {}),
    };
    const projects = await Project.find(projectFilter)
      .select('name status startDate endDate')
      .lean();
    const projectIds = projects.map((project) => project._id);
    const taskMatch = { workspaceId, projectId: { $in: projectIds } };

    if (projectIds.length === 0) {
      return {
        filters: {
          projectIds: [],
          period: filters.period ?? REPORT_PERIOD.LAST_WEEK,
          from: start,
          to: end,
        },
        overview: {
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
          openTasks: 0,
          overdueTasks: 0,
          createdInPeriod: 0,
          completedInPeriod: 0,
          completedOnTimeInPeriod: 0,
          onTimeCompletionRate: 0,
        },
        projectStatus: [],
        projectProgress: [],
        taskTimeline: [],
        memberActivity: [],
      };
    }

    // Some tasks created before completion tracking existed can be in a completed
    // column without a completedAt value. Repair that invariant before calculating
    // metrics so the column status remains the source of truth.
    const completedColumnIds = await Column.distinct('_id', {
      isCompletedColumn: true,
    });

    if (completedColumnIds.length) {
      await Task.updateMany(
        {
          ...taskMatch,
          columnId: { $in: completedColumnIds },
          completedAt: null,
        },
        [{ $set: { completedAt: '$updatedAt' } }],
        { timestamps: false }
      );
    }

    const [
      overview,
      projectProgress,
      projectMembers,
      createdBuckets,
      completedBuckets,
      memberActivity,
    ] = await Promise.all([
      Task.aggregate([
        { $match: taskMatch },
        {
          $group: {
            _id: null,
            totalTasks: { $sum: 1 },
            completedTasks: {
              $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] },
            },
            openTasks: {
              $sum: { $cond: [{ $eq: ['$completedAt', null] }, 1, 0] },
            },
            overdueTasks: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$completedAt', null] },
                      { $ne: ['$dueDate', null] },
                      { $lt: ['$dueDate', now] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            createdInPeriod: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$createdAt', start] }, { $lt: ['$createdAt', end] }] },
                  1,
                  0,
                ],
              },
            },
            completedInPeriod: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$completedAt', null] },
                      { $gte: ['$completedAt', start] },
                      { $lt: ['$completedAt', end] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            completedOnTimeInPeriod: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$completedAt', null] },
                      { $ne: ['$dueDate', null] },
                      { $gte: ['$completedAt', start] },
                      { $lt: ['$completedAt', end] },
                      { $lte: ['$completedAt', '$dueDate'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            completedWithDueDateInPeriod: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$completedAt', null] },
                      { $ne: ['$dueDate', null] },
                      { $gte: ['$completedAt', start] },
                      { $lt: ['$completedAt', end] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Task.aggregate([
        { $match: taskMatch },
        {
          $group: {
            _id: '$projectId',
            totalTasks: { $sum: 1 },
            completedTasks: { $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] } },
            openTasks: { $sum: { $cond: [{ $eq: ['$completedAt', null] }, 1, 0] } },
            completedInPeriod: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$completedAt', start] }, { $lt: ['$completedAt', end] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      ProjectMember.find({ workspaceId, projectId: { $in: projectIds } })
        .populate('userId', 'firstName lastName username avatar')
        .lean(),
      getDateBuckets('createdAt', taskMatch, start, end),
      getDateBuckets('completedAt', taskMatch, start, end),
      Task.aggregate([
        { $match: taskMatch },
        { $unwind: '$assignees' },
        {
          $group: {
            _id: '$assignees',
            assignedTasks: { $sum: 1 },
            openTasks: { $sum: { $cond: [{ $eq: ['$completedAt', null] }, 1, 0] } },
            completedInPeriod: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$completedAt', start] }, { $lt: ['$completedAt', end] }] },
                  1,
                  0,
                ],
              },
            },
            completedOnTimeInPeriod: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$dueDate', null] },
                      { $gte: ['$completedAt', start] },
                      { $lt: ['$completedAt', end] },
                      { $lte: ['$completedAt', '$dueDate'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            completedWithDueDateInPeriod: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$dueDate', null] },
                      { $gte: ['$completedAt', start] },
                      { $lt: ['$completedAt', end] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const overviewStats = overview[0] ?? {};
    const progressByProjectId = new Map(
      projectProgress.map((progress) => [String(progress._id), progress])
    );
    const activityByUserId = new Map(
      memberActivity.map((activity) => [String(activity._id), activity])
    );
    const uniqueMembers = new Map(
      projectMembers
        .filter((member) => member.userId)
        .map((member) => [String(member.userId._id), member.userId])
    );
    const totalTasks = overviewStats.totalTasks ?? 0;
    const completedTasks = overviewStats.completedTasks ?? 0;
    const completedWithDueDate = overviewStats.completedWithDueDateInPeriod ?? 0;

    return {
      filters: {
        projectIds: projectIds.map(String),
        period: filters.period ?? REPORT_PERIOD.LAST_WEEK,
        from: start,
        to: end,
      },
      overview: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
        openTasks: overviewStats.openTasks ?? 0,
        overdueTasks: overviewStats.overdueTasks ?? 0,
        createdInPeriod: overviewStats.createdInPeriod ?? 0,
        completedInPeriod: overviewStats.completedInPeriod ?? 0,
        completedOnTimeInPeriod: overviewStats.completedOnTimeInPeriod ?? 0,
        onTimeCompletionRate: completedWithDueDate
          ? Math.round(((overviewStats.completedOnTimeInPeriod ?? 0) / completedWithDueDate) * 100)
          : 0,
      },
      projectStatus: Object.values(
        projects.reduce((result, project) => {
          result[project.status] = (result[project.status] ?? 0) + 1;
          return result;
        }, {})
      ).length
        ? Object.entries(
            projects.reduce((result, project) => {
              result[project.status] = (result[project.status] ?? 0) + 1;
              return result;
            }, {})
          ).map(([status, count]) => ({ status, count }))
        : [],
      projectProgress: projects.map((project) => {
        const progress = progressByProjectId.get(String(project._id));
        const projectTotalTasks = progress?.totalTasks ?? 0;
        const projectCompletedTasks = progress?.completedTasks ?? 0;

        return {
          project: {
            _id: project._id,
            name: project.name,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
          },
          totalTasks: projectTotalTasks,
          completedTasks: projectCompletedTasks,
          openTasks: progress?.openTasks ?? 0,
          completedInPeriod: progress?.completedInPeriod ?? 0,
          completionRate: projectTotalTasks
            ? Math.round((projectCompletedTasks / projectTotalTasks) * 100)
            : 0,
        };
      }),
      taskTimeline: buildTimeline(start, end, createdBuckets, completedBuckets),
      memberActivity: [...uniqueMembers.entries()].map(([userId, user]) => {
        const activity = activityByUserId.get(userId);
        const dueDateCompletions = activity?.completedWithDueDateInPeriod ?? 0;

        return {
          member: user,
          assignedTasks: activity?.assignedTasks ?? 0,
          openTasks: activity?.openTasks ?? 0,
          completedInPeriod: activity?.completedInPeriod ?? 0,
          completedOnTimeInPeriod: activity?.completedOnTimeInPeriod ?? 0,
          onTimeCompletionRate: dueDateCompletions
            ? Math.round(((activity?.completedOnTimeInPeriod ?? 0) / dueDateCompletions) * 100)
            : 0,
        };
      }),
    };
  },
};
