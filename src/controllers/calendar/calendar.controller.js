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
