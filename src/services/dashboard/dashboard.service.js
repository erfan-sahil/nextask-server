import { Project } from '../../models/project/project.model.js';
import { ProjectMember } from '../../models/project-member/projectMember.model.js';
import { Task } from '../../models/task/task.model.js';
import { Column } from '../../models/column/column.model.js';
import { Meeting } from '../../models/meeting/meeting.model.js';
import { Workspace } from '../../models/workspace/workspace.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { Notification } from '../../models/notification/notification.model.js';
import { PROJECT_STATUS } from '../../constants/projectStatus.js';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { USER_POPULATE_FIELDS } from '../workspace/workspace.helpers.js';

const PRIVILEGED_ROLES = [
  WORKSPACE_MEMBER_ROLE.OWNER,
  WORKSPACE_MEMBER_ROLE.ADMIN,
];
const PROJECT_LIMIT = 12;
const MY_TASK_LIMIT = 8;
const ACTIVITY_LIMIT = 10;
const MEETING_LIMIT = 6;

const getDueDateRange = () => {
  const now = new Date();
  const dueThrough = new Date(now);
  dueThrough.setDate(dueThrough.getDate() + 7);
  dueThrough.setHours(23, 59, 59, 999);

  return { now, dueThrough };
};

const getTodayRange = (now) => {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  return { startOfToday, startOfTomorrow };
};

const getTaskStatistics = async (taskFilter, now, dueThrough) =>
  Task.aggregate([
    { $match: taskFilter },
    {
      $group: {
        _id: '$projectId',
        taskCount: { $sum: 1 },
        openTaskCount: {
          $sum: { $cond: [{ $eq: ['$completedAt', null] }, 1, 0] },
        },
        dueThisWeekCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$completedAt', null] },
                  { $gte: ['$dueDate', now] },
                  { $lte: ['$dueDate', dueThrough] },
                ],
              },
              1,
              0,
            ],
          },
        },
        completedTaskCount: {
          $sum: { $cond: [{ $ne: ['$completedAt', null] }, 1, 0] },
        },
      },
    },
  ]);

const populateDashboardTask = (query) =>
  query
    .populate('columnId', 'name isCompletedColumn')
    .populate('boardId', 'name')
    .populate('projectId', 'name')
    .populate('workspaceId', 'name slug');

const formatTask = (task) => ({
  _id: task._id,
  title: task.title,
  priority: task.priority,
  dueDate: task.dueDate,
  completedAt: task.completedAt,
  status: task.columnId
    ? {
        name: task.columnId.name,
        isCompleted: task.columnId.isCompletedColumn,
      }
    : null,
  board: task.boardId,
  project: task.projectId,
  workspace: task.workspaceId,
});

const getMyTasks = (userId, accessFilter, filter, sort) =>
  populateDashboardTask(
    Task.find({
      assignees: userId,
      completedAt: null,
      $and: [accessFilter, filter],
    })
      .sort(sort)
      .limit(MY_TASK_LIMIT)
  )
    .lean()
    .then((tasks) => tasks.map(formatTask));

const getRecentActivity = (userId) =>
  Notification.find({ recipientId: userId })
    .sort({ createdAt: -1 })
    .limit(ACTIVITY_LIMIT)
    .populate('actorId', USER_POPULATE_FIELDS)
    .populate({
      path: 'taskId',
      select: 'title workspaceId projectId boardId',
      populate: [
        { path: 'workspaceId', select: 'name slug' },
        { path: 'projectId', select: 'name' },
        { path: 'boardId', select: 'name' },
      ],
    })
    .lean()
    .then((notifications) =>
      notifications.map((notification) => ({
        _id: notification._id,
        type: notification.type,
        message: notification.message,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        actor: notification.actorId,
        task: notification.taskId,
      }))
    );

const getUpcomingMeetings = (filter) =>
  Meeting.find(filter)
    .sort({ startsAt: 1 })
    .limit(MEETING_LIMIT)
    .select('title startsAt location workspaceId attendees')
    .populate('workspaceId', 'name slug')
    .lean()
    .then((meetings) =>
      meetings.map((meeting) => ({
        _id: meeting._id,
        title: meeting.title,
        startsAt: meeting.startsAt,
        location: meeting.location,
        workspace: meeting.workspaceId,
        attendeeCount: meeting.attendees.length,
      }))
    );

export const dashboardService = {
  async getOverview(userId) {
    const [workspaceMemberships, projectMemberships] = await Promise.all([
      WorkspaceMember.find({ userId }).select('workspaceId role').lean(),
      ProjectMember.find({ userId }).select('workspaceId projectId role').lean(),
    ]);

    const privilegedWorkspaceIds = workspaceMemberships
      .filter((membership) => PRIVILEGED_ROLES.includes(membership.role))
      .map((membership) => membership.workspaceId);
    const memberWorkspaceIds = workspaceMemberships
      .filter((membership) => !PRIVILEGED_ROLES.includes(membership.role))
      .map((membership) => membership.workspaceId);
    const privilegedProjectIds = projectMemberships
      .filter((membership) => PRIVILEGED_ROLES.includes(membership.role))
      .map((membership) => membership.projectId);
    const memberProjectIds = projectMemberships
      .filter((membership) => !PRIVILEGED_ROLES.includes(membership.role))
      .map((membership) => membership.projectId);

    const taskAccessClauses = [
      ...(privilegedWorkspaceIds.length
        ? [{ workspaceId: { $in: privilegedWorkspaceIds } }]
        : []),
      ...(privilegedProjectIds.length
        ? [{ projectId: { $in: privilegedProjectIds } }]
        : []),
      ...(memberWorkspaceIds.length
        ? [
            {
              workspaceId: { $in: memberWorkspaceIds },
              assignees: userId,
            },
          ]
        : []),
      ...(memberProjectIds.length
        ? [
            {
              projectId: { $in: memberProjectIds },
              assignees: userId,
            },
          ]
        : []),
    ];

    if (taskAccessClauses.length === 0) {
      return {
        stats: {
          activeProjects: 0,
          openTasks: 0,
          dueThisWeek: 0,
          teamMembers: 0,
        },
        projects: [],
        myTasks: [],
        upcomingTasks: [],
        upcomingMeetings: [],
        recentActivity: [],
      };
    }

    const { now, dueThrough } = getDueDateRange();
    const { startOfToday, startOfTomorrow } = getTodayRange(now);
    const [taskStatistics, backlogColumnIds] = await Promise.all([
      getTaskStatistics({ $or: taskAccessClauses }, now, dueThrough),
      Column.distinct('_id', { name: /^backlog$/i }),
    ]);
    const projectMembershipWorkspaceIds = projectMemberships.map(
      (membership) => membership.workspaceId
    );
    const meetingMemberWorkspaceIds = [
      ...new Set([
        ...memberWorkspaceIds.map(String),
        ...projectMembershipWorkspaceIds.map(String),
      ]),
    ];
    const meetingAccessClauses = [
      ...(privilegedWorkspaceIds.length
        ? [{ workspaceId: { $in: privilegedWorkspaceIds } }]
        : []),
      ...(meetingMemberWorkspaceIds.length
        ? [
            {
              workspaceId: { $in: meetingMemberWorkspaceIds },
              attendees: userId,
            },
          ]
        : []),
    ];
    const personalProjectIds = taskStatistics.map((item) => item._id);
    const projectAccessClauses = [
      ...(privilegedWorkspaceIds.length
        ? [{ workspaceId: { $in: privilegedWorkspaceIds } }]
        : []),
      ...(privilegedProjectIds.length ? [{ _id: { $in: privilegedProjectIds } }] : []),
      ...(personalProjectIds.length ? [{ _id: { $in: personalProjectIds } }] : []),
    ];
    const upcomingTaskConditions = [
      ...(backlogColumnIds.length
        ? [{ columnId: { $in: backlogColumnIds } }]
        : []),
      { dueDate: { $lt: startOfToday } },
      { dueDate: { $gte: startOfTomorrow } },
    ];

    const [
      projects,
      memberIds,
      myTasks,
      upcomingTasks,
      upcomingMeetings,
      recentActivity,
    ] =
      await Promise.all([
      Project.find({ $or: projectAccessClauses })
        .sort({ lastActivityAt: -1, createdAt: -1 })
        .lean(),
      Promise.all([
        privilegedWorkspaceIds.length
          ? WorkspaceMember.distinct('userId', {
              workspaceId: { $in: privilegedWorkspaceIds },
            })
          : [],
        privilegedProjectIds.length
          ? ProjectMember.distinct('userId', {
              projectId: { $in: privilegedProjectIds },
            })
          : [],
      ]),
        getMyTasks(
          userId,
          { $or: taskAccessClauses },
          { $nor: upcomingTaskConditions },
          { lastActivityAt: -1 }
        ),
        getMyTasks(
          userId,
          { $or: taskAccessClauses },
          { $or: upcomingTaskConditions },
          { dueDate: 1 }
        ),
        getUpcomingMeetings({
          startsAt: { $gte: now },
          $or: meetingAccessClauses,
        }),
        getRecentActivity(userId),
      ]);
    const workspaces = await Workspace.find({
      _id: { $in: projects.map((project) => project.workspaceId) },
    })
      .select('name slug')
      .lean();
    const workspacesById = new Map(
      workspaces.map((workspace) => [String(workspace._id), workspace])
    );

    const statisticsByProject = new Map(
      taskStatistics.map((statistic) => [String(statistic._id), statistic])
    );
    const privilegedWorkspaceIdSet = new Set(
      privilegedWorkspaceIds.map(String)
    );
    const privilegedProjectIdSet = new Set(privilegedProjectIds.map(String));
    const visibleProjects = projects.map((project) => {
      const isPrivileged =
        privilegedWorkspaceIdSet.has(String(project.workspaceId)) ||
        privilegedProjectIdSet.has(String(project._id));
      const taskStatisticsForProject = statisticsByProject.get(String(project._id));

      return {
        ...project,
        workspace: workspacesById.get(String(project.workspaceId)) ?? null,
        taskCount: isPrivileged
          ? project.taskCount
          : (taskStatisticsForProject?.taskCount ?? 0),
        completedTaskCount: isPrivileged
          ? Math.max(
              project.taskCount - (taskStatisticsForProject?.openTaskCount ?? 0),
              0
            )
          : (taskStatisticsForProject?.completedTaskCount ?? 0),
      };
    });

    return {
      stats: {
        activeProjects: visibleProjects.filter(
          (project) => project.status === PROJECT_STATUS.ACTIVE
        ).length,
        openTasks: taskStatistics.reduce(
          (total, statistic) => total + statistic.openTaskCount,
          0
        ),
        dueThisWeek: taskStatistics.reduce(
          (total, statistic) => total + statistic.dueThisWeekCount,
          0
        ),
        teamMembers: new Set(memberIds.flat().map(String)).size,
      },
      projects: visibleProjects.slice(0, PROJECT_LIMIT),
      myTasks,
      upcomingTasks,
      upcomingMeetings,
      recentActivity,
    };
  },
};
