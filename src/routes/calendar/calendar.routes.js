import { Router } from 'express';
import {
  createMeeting,
  deleteMeeting,
  getCalendarEvents,
  updateMeeting,
} from '../../controllers/calendar/calendar.controller.js';
import {
  loadWorkspaceByWorkspaceId,
  requireCalendarAccess,
  requireMeetingCreate,
} from '../../middlewares/calendar/calendar.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  createMeetingSchema,
  deleteMeetingSchema,
  getCalendarSchema,
  updateMeetingSchema,
} from '../../validations/calendar/calendar.validation.js';

const router = Router({ mergeParams: true });

router.use(loadWorkspaceByWorkspaceId);

router.get('/', validate(getCalendarSchema), requireCalendarAccess, getCalendarEvents);
router.post('/meetings', validate(createMeetingSchema), requireMeetingCreate, createMeeting);
router.patch(
  '/meetings/:meetingId',
  validate(updateMeetingSchema),
  requireMeetingCreate,
  updateMeeting
);
router.delete(
  '/meetings/:meetingId',
  validate(deleteMeetingSchema),
  requireMeetingCreate,
  deleteMeeting
);

export default router;
