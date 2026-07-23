import { z } from 'zod';
import { CALENDAR_MESSAGES } from '../../constants/calendarMessages.js';
import { objectIdSchema } from '../common/common.validation.js';

const workspaceIdParamSchema = z.object({
  workspaceId: objectIdSchema,
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

const dateRangeSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => data.endDate > data.startDate, {
    message: CALENDAR_MESSAGES.INVALID_DATE_RANGE,
    path: ['endDate'],
  });

export const getCalendarSchema = z.object({
  params: workspaceIdParamSchema,
  query: dateRangeSchema,
});

export const createMeetingSchema = z.object({
  params: workspaceIdParamSchema,
  body: z.object({
    title: z
      .string({ required_error: 'Meeting title is required' })
      .min(1, 'Meeting title is required')
      .max(500, 'Meeting title cannot exceed 500 characters')
      .trim(),
    message: z.string().max(10000, 'Message cannot exceed 10000 characters').trim().optional(),
    startsAt: dateSchema,
    location: z.string().max(500, 'Location cannot exceed 500 characters').trim().optional(),
    attendeeIds: z.array(objectIdSchema).max(100).optional(),
  }),
});
