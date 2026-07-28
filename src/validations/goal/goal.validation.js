import { z } from 'zod';
import { GOAL_PRIORITY } from '../../constants/goalPriority.js';
import { GOAL_STATUS } from '../../constants/goalStatus.js';
import { GOAL_MESSAGES } from '../../constants/goalMessages.js';
import { objectIdSchema, paginationQuerySchema } from '../common/common.validation.js';

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
    z.null(),
  ])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) {
      return value;
    }

    return value instanceof Date ? value : new Date(value);
  });

const goalFieldsSchema = {
  title: z
    .string({ required_error: 'Goal title is required' })
    .min(1, 'Goal title is required')
    .max(500, 'Goal title cannot exceed 500 characters')
    .trim(),
  details: z.string().max(10000, 'Goal details cannot exceed 10000 characters').trim().optional(),
  status: z.enum(Object.values(GOAL_STATUS), {
    message: `Status must be one of: ${Object.values(GOAL_STATUS).join(', ')}`,
  }),
  startDate: dateSchema,
  dueDate: dateSchema,
  priority: z.enum(Object.values(GOAL_PRIORITY), {
    message: `Priority must be one of: ${Object.values(GOAL_PRIORITY).join(', ')}`,
  }),
  completedAt: dateSchema,
};

const validateDateRange = (data, ctx) => {
  if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
    ctx.addIssue({
      code: 'custom',
      message: GOAL_MESSAGES.INVALID_DATE_RANGE,
      path: ['dueDate'],
    });
  }
};

export const createGoalSchema = z.object({
  params: workspaceIdParamSchema,
  body: z
    .object({
      title: goalFieldsSchema.title,
      details: goalFieldsSchema.details,
      status: goalFieldsSchema.status.optional(),
      startDate: goalFieldsSchema.startDate,
      dueDate: goalFieldsSchema.dueDate,
      priority: goalFieldsSchema.priority.optional(),
      completedAt: goalFieldsSchema.completedAt,
    })
    .superRefine(validateDateRange),
});

export const updateGoalSchema = z.object({
  params: workspaceIdParamSchema.extend({
    goalId: objectIdSchema,
  }),
  body: z
    .object({
      title: goalFieldsSchema.title.optional(),
      details: goalFieldsSchema.details,
      status: goalFieldsSchema.status.optional(),
      startDate: goalFieldsSchema.startDate,
      dueDate: goalFieldsSchema.dueDate,
      priority: goalFieldsSchema.priority.optional(),
      completedAt: goalFieldsSchema.completedAt,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: GOAL_MESSAGES.UPDATE_FIELDS_REQUIRED,
    })
    .superRefine(validateDateRange),
});

export const goalIdSchema = z.object({
  params: workspaceIdParamSchema.extend({
    goalId: objectIdSchema,
  }),
});

export const listGoalsSchema = z.object({
  params: workspaceIdParamSchema,
  query: z.object({
    ...paginationQuerySchema,
    status: goalFieldsSchema.status.optional(),
    priority: goalFieldsSchema.priority.optional(),
    search: z.string().trim().max(100, 'Search query cannot exceed 100 characters').optional(),
  }),
});
