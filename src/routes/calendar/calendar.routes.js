import { Router } from 'express';
import {
  createMeeting,
  getCalendarEvents,
} from '../../controllers/calendar/calendar.controller.js';
import {
  loadWorkspaceByWorkspaceId,
  requireCalendarAccess,
} from '../../middlewares/calendar/calendar.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createMeetingSchema,
  getCalendarSchema,
} from '../../validations/calendar/calendar.validation.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);

router.get('/', validate(getCalendarSchema), requireCalendarAccess, getCalendarEvents);
router.post('/meetings', validate(createMeetingSchema), requireCalendarAccess, createMeeting);

export default router;
