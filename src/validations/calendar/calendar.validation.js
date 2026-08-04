import { z } from 'zod';
import { CALENDAR_MESSAGES } from '../../constants/calendarMessages.js';
import { objectIdSchema } from '../common/common.validation.js';

const workspaceIdParamSchema = z.object({
  workspaceId: objectIdSchema,
});

const meetingIdParamSchema = workspaceIdParamSchema.extend({
  meetingId: objectIdSchema,
});

const dateSchema = z
  .union([
    z.string().datetime({ message: 'Invalid date format' }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: 'Invalid date format',
    }),
    z.date(),
  ])
  .transform((value) => (value instanceof Date ? value : new Date(value)));

const meetingStartsAtSchema = z
  .union(
    [z.string().datetime({ message: 'Invalid date and time format' }), z.date()],
    {
      error: 'Meeting date and time is required',
    }
  )
  .transform((value) => (value instanceof Date ? value : new Date(value)))
  .refine((value) => !Number.isNaN(value.getTime()), {
    message: 'Invalid date and time format',
  });

const optionalMeetingText = (max, message) =>
  z
    .union([z.string().max(max, message), z.literal(''), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null) {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed === '' ? undefined : trimmed;
    });

const dateRangeSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => data.endDate > data.startDate, {
    message: CALENDAR_MESSAGES.INVALID_DATE_RANGE,
    path: ['endDate'],
  });

const meetingBodyFields = {
  title: z
    .string({ error: 'Meeting title is required' })
    .trim()
    .min(1, 'Meeting title is required')
    .max(500, 'Meeting title cannot exceed 500 characters'),
  message: optionalMeetingText(10000, 'Message cannot exceed 10000 characters'),
  location: optionalMeetingText(500, 'Location cannot exceed 500 characters'),
  attendeeIds: z.array(objectIdSchema).max(100).optional(),
};

export const getCalendarSchema = z.object({
  params: workspaceIdParamSchema,
  query: dateRangeSchema,
});

export const createMeetingSchema = z.object({
  params: workspaceIdParamSchema,
  body: z.object({
    title: meetingBodyFields.title,
    message: meetingBodyFields.message,
    startsAt: meetingStartsAtSchema,
    location: meetingBodyFields.location,
    attendeeIds: meetingBodyFields.attendeeIds,
  }),
});

export const updateMeetingSchema = z.object({
  params: meetingIdParamSchema,
  body: z
    .object({
      title: meetingBodyFields.title.optional(),
      message: meetingBodyFields.message,
      startsAt: meetingStartsAtSchema.optional(),
      location: meetingBodyFields.location,
      attendeeIds: meetingBodyFields.attendeeIds,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one meeting field is required',
    }),
});

export const deleteMeetingSchema = z.object({
  params: meetingIdParamSchema,
});
