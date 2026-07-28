import { CALENDAR_MESSAGES } from '../../constants/calendarMessages.js';
import { calendarService } from '../../services/calendar/calendar.service.js';
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

  res.status(201).json(ApiResponse.created({ meeting }, CALENDAR_MESSAGES.MEETING_CREATED));
});

export const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await calendarService.updateMeeting(
    req.workspace,
    req.params.meetingId,
    req.body
  );

  res.json(ApiResponse.ok({ meeting }, CALENDAR_MESSAGES.MEETING_UPDATED));
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  await calendarService.deleteMeeting(req.workspace, req.params.meetingId);

  res.json(ApiResponse.ok(null, CALENDAR_MESSAGES.MEETING_DELETED));
});
