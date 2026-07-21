import { z } from 'zod';
import { TASK_COMMENT_MESSAGES } from '../../constants/taskCommentMessages.js';
import {
  objectIdSchema,
  paginationQuerySchema,
} from '../common/common.validation.js';

const taskCommentParamsSchema = z.object({
  workspaceId: objectIdSchema,
  projectId: objectIdSchema,
  boardId: objectIdSchema,
  taskId: objectIdSchema,
});

const contentSchema = z
  .string({ required_error: 'Comment content is required' })
  .trim()
  .min(1, 'Comment content is required')
  .max(5000, 'Comment content cannot exceed 5000 characters');

export const createTaskCommentSchema = z.object({
  params: taskCommentParamsSchema,
  body: z.object({ content: contentSchema }),
});

export const updateTaskCommentSchema = z.object({
  params: taskCommentParamsSchema.extend({
    commentId: objectIdSchema,
  }),
  body: z
    .object({ content: contentSchema })
    .refine((data) => Object.keys(data).length > 0, {
      message: TASK_COMMENT_MESSAGES.UPDATE_FIELDS_REQUIRED,
    }),
});

export const taskCommentIdSchema = z.object({
  params: taskCommentParamsSchema.extend({
    commentId: objectIdSchema,
  }),
});

export const listTaskCommentsSchema = z.object({
  params: taskCommentParamsSchema,
  query: z.object({
    ...paginationQuerySchema,
  }),
});
