import { z } from 'zod';
import { TASK_PRIORITY } from '../../constants/taskPriority.js';
import { TASK_MESSAGES } from '../../constants/taskMessages.js';
import {
  objectIdSchema,
  paginationQuerySchema,
} from '../common/common.validation.js';

const boardTaskParamsSchema = z.object({
  workspaceId: objectIdSchema,
  projectId: objectIdSchema,
  boardId: objectIdSchema,
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
      return null;
    }

    return value instanceof Date ? value : new Date(value);
  });

const taskFieldsSchema = {
  title: z
    .string({ required_error: 'Task title is required' })
    .min(1, 'Task title is required')
    .max(500, 'Task title cannot exceed 500 characters')
    .trim(),
  description: z
    .string()
    .max(10000, 'Description cannot exceed 10000 characters')
    .trim()
    .optional(),
  priority: z.enum(Object.values(TASK_PRIORITY), {
    message: `Priority must be one of: ${Object.values(TASK_PRIORITY).join(', ')}`,
  }),
  columnId: objectIdSchema,
  position: z.number().int().min(0).optional(),
  assignees: z.array(objectIdSchema).optional(),
  reporterId: objectIdSchema.optional(),
  dueDate: dateSchema,
  labels: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Label cannot be empty')
        .max(50, 'Label cannot exceed 50 characters')
    )
    .optional(),
  completedAt: dateSchema,
};

export const createTaskSchema = z.object({
  params: boardTaskParamsSchema,
  body: z.object({
    title: taskFieldsSchema.title,
    columnId: taskFieldsSchema.columnId,
    description: taskFieldsSchema.description,
    priority: taskFieldsSchema.priority.optional(),
    assignees: taskFieldsSchema.assignees,
    reporterId: taskFieldsSchema.reporterId,
    dueDate: taskFieldsSchema.dueDate,
    labels: taskFieldsSchema.labels,
  }),
});

export const updateTaskSchema = z.object({
  params: boardTaskParamsSchema.extend({
    taskId: objectIdSchema,
  }),
  body: z
    .object({
      title: taskFieldsSchema.title.optional(),
      columnId: taskFieldsSchema.columnId.optional(),
      position: taskFieldsSchema.position,
      description: taskFieldsSchema.description,
      priority: taskFieldsSchema.priority.optional(),
      assignees: taskFieldsSchema.assignees,
      reporterId: taskFieldsSchema.reporterId,
      dueDate: taskFieldsSchema.dueDate,
      labels: taskFieldsSchema.labels,
      completedAt: taskFieldsSchema.completedAt,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: TASK_MESSAGES.UPDATE_FIELDS_REQUIRED,
    }),
});

export const taskIdSchema = z.object({
  params: boardTaskParamsSchema.extend({
    taskId: objectIdSchema,
  }),
});

export const listTasksSchema = z.object({
  params: boardTaskParamsSchema,
  query: z.object({
    ...paginationQuerySchema,
    columnId: objectIdSchema.optional(),
    priority: taskFieldsSchema.priority.optional(),
    assignee: objectIdSchema.optional(),
    search: z
      .string()
      .trim()
      .max(100, 'Search query cannot exceed 100 characters')
      .optional(),
  }),
});
