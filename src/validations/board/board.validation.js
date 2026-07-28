import { z } from 'zod';
import { BOARD_MESSAGES } from '../../constants/boardMessages.js';
import { objectIdSchema, paginationQuerySchema } from '../common/common.validation.js';

const workspaceProjectParamsSchema = z.object({
  workspaceId: objectIdSchema,
  projectId: objectIdSchema,
});

const boardFieldsSchema = {
  name: z
    .string({ required_error: 'Board name is required' })
    .min(1, 'Board name is required')
    .max(200, 'Board name cannot exceed 200 characters')
    .trim(),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters').trim().optional(),
};

export const createBoardSchema = z.object({
  params: workspaceProjectParamsSchema,
  body: z.object({
    name: boardFieldsSchema.name,
    description: boardFieldsSchema.description,
  }),
});

export const updateBoardSchema = z.object({
  params: workspaceProjectParamsSchema.extend({
    boardId: objectIdSchema,
  }),
  body: z
    .object({
      name: boardFieldsSchema.name.optional(),
      description: boardFieldsSchema.description,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: BOARD_MESSAGES.UPDATE_FIELDS_REQUIRED,
    }),
});

export const boardIdSchema = z.object({
  params: workspaceProjectParamsSchema.extend({
    boardId: objectIdSchema,
  }),
});

export const listBoardsSchema = z.object({
  params: workspaceProjectParamsSchema,
  query: z.object({
    ...paginationQuerySchema,
    search: z.string().trim().max(100, 'Search query cannot exceed 100 characters').optional(),
  }),
});
