import { CALENDAR_MESSAGES } from '../../constants/calendarMessages.js';
import { NOTIFICATION_TYPE } from '../../models/notification/notification.model.js';
import { calendarService } from '../../services/calendar/calendar.service.js';
import { notificationService } from '../../services/notification/notification.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getCalendarEvents = asyncHandler(async (req, res) => {
  const result = await calendarService.getEvents(
    req.workspace,
    req.actorMembership,
    req.user._id,
    req.query
  );

  res.json(ApiResponse.ok(result, CALENDAR_MESSAGES.FETCHED));
});

export const createMeeting = asyncHandler(async (req, res) => {
  const meeting = await calendarService.createMeeting(req.workspace, req.user._id, req.body);

  await notificationService.createMany({
    workspaceId: req.workspace._id,
    recipientIds: meeting.attendees,
    actorId: req.user._id,
    type: NOTIFICATION_TYPE.MEETING_CREATED,
    message: `${req.user.firstName} scheduled “${meeting.title}”`,
    meetingId: meeting._id,
  });

  res.status(201).json(ApiResponse.created({ meeting }, CALENDAR_MESSAGES.MEETING_CREATED));
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await calendarService.updateMeeting(
    req.workspace,
    req.params.meetingId,
    req.body
  );

  await notificationService.createMany({
    workspaceId: req.workspace._id,
    recipientIds: meeting.attendees,
    actorId: req.user._id,
    type: NOTIFICATION_TYPE.MEETING_UPDATED,
    message: `${req.user.firstName} updated “${meeting.title}”`,
    meetingId: meeting._id,
  });

  res.json(ApiResponse.ok({ meeting }, CALENDAR_MESSAGES.MEETING_UPDATED));
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  await calendarService.deleteMeeting(req.workspace, req.params.meetingId);

  res.json(ApiResponse.ok(null, CALENDAR_MESSAGES.MEETING_DELETED));
});
