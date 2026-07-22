import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { CALENDAR_MESSAGES } from '../../constants/calendarMessages.js';
import { Goal } from '../../models/goal/goal.model.js';
import { Meeting } from '../../models/meeting/meeting.model.js';
import { Task } from '../../models/task/task.model.js';
import { WorkspaceMember } from '../../models/workspace-member/workspaceMember.model.js';
import { ApiError } from '../../utils/ApiError.js';

const hasFullCalendarAccess = (role) =>
  role === WORKSPACE_MEMBER_ROLE.OWNER || role === WORKSPACE_MEMBER_ROLE.ADMIN;

const buildTaskEvent = (task) => ({
  id: `task:${task._id}`,
  resourceId: task._id.toString(),
  type: 'task-deadline',
  title: task.title,
  startsAt: task.dueDate,
  endsAt: null,
  allDay: true,
  projectId: task.projectId.toString(),
});

const buildGoalEvent = (goal) => ({
  id: `goal:${goal._id}`,
  resourceId: goal._id.toString(),
  type: 'goal-deadline',
  title: goal.title,
  startsAt: goal.dueDate,
  endsAt: null,
  allDay: true,
});

const buildMeetingEvent = (meeting) => ({
  id: `meeting:${meeting._id}`,
  resourceId: meeting._id.toString(),
  type: 'meeting',
  title: meeting.title,
  startsAt: meeting.startsAt,
  endsAt: meeting.endsAt,
  allDay: false,
  location: meeting.location,
  attendeeIds: meeting.attendees.map((attendeeId) => attendeeId.toString()),
  createdBy: meeting.createdBy.toString(),
});

export const calendarService = {
  async getEvents(workspace, actorMembership, userId, { startDate, endDate }) {
    const dateRange = { $gte: startDate, $lt: endDate };
    const canViewAll = hasFullCalendarAccess(actorMembership.role);
    const taskFilter = {
      workspaceId: workspace._id,
      dueDate: dateRange,
    };
    const meetingFilter = {
      workspaceId: workspace._id,
      startsAt: { $lt: endDate },
      endsAt: { $gt: startDate },
    };

    if (!canViewAll) {
      taskFilter.assignees = userId;
      meetingFilter.attendees = userId;
    }

    const [tasks, goals, meetings] = await Promise.all([
      Task.find(taskFilter).select('title dueDate projectId').lean(),
      Goal.find({
        workspaceId: workspace._id,
        dueDate: dateRange,
      })
        .select('title dueDate')
        .lean(),
      Meeting.find(meetingFilter)
        .select('title startsAt endsAt location attendees createdBy')
        .lean(),
    ]);

    const events = [
      ...tasks.map(buildTaskEvent),
      ...goals.map(buildGoalEvent),
      ...meetings.map(buildMeetingEvent),
    ].sort((first, second) => first.startsAt - second.startsAt);

    return { events };
  },

  async createMeeting(workspace, userId, data) {
    const attendeeIds = [
      ...new Set(
        [userId.toString(), ...(data.attendeeIds ?? [])].map((attendeeId) =>
          attendeeId.toLowerCase()
        )
      ),
    ];
    const memberCount = await WorkspaceMember.countDocuments({
      workspaceId: workspace._id,
      userId: { $in: attendeeIds },
    });

    if (memberCount !== attendeeIds.length) {
      throw ApiError.badRequest(CALENDAR_MESSAGES.INVALID_ATTENDEES);
    }

    const meeting = await Meeting.create({
      workspaceId: workspace._id,
      title: data.title,
      description: data.description ?? '',
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      location: data.location ?? '',
      attendees: attendeeIds,
      createdBy: userId,
    });

    return meeting;
  },
};
