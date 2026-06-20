import { z } from 'zod';
import { COLUMN_MESSAGES } from '../../constants/columnMessages.js';
import { objectIdSchema } from '../common/common.validation.js';

const boardColumnParamsSchema = z.object({
  workspaceId: objectIdSchema,
  projectId: objectIdSchema,
  boardId: objectIdSchema,
});

const colorSchema = z
  .union([z.string().max(50, 'Color cannot exceed 50 characters'), z.null()])
  .optional()
  .transform((value) => (value === '' ? null : value));

const positionSchema = z
  .number({ required_error: 'Position is required' })
  .int('Position must be a whole number')
  .min(0, 'Position must be at least 0');

const columnFieldsSchema = {
  name: z
    .string({ required_error: 'Column name is required' })
    .min(1, 'Column name is required')
    .max(200, 'Column name cannot exceed 200 characters')
    .trim(),
  position: positionSchema,
  color: colorSchema,
  isCompletedColumn: z.boolean().optional(),
};

export const createColumnSchema = z.object({
  params: boardColumnParamsSchema,
  body: z.object({
    name: columnFieldsSchema.name,
    position: columnFieldsSchema.position,
    color: columnFieldsSchema.color,
    isCompletedColumn: columnFieldsSchema.isCompletedColumn,
  }),
});

export const updateColumnSchema = z.object({
  params: boardColumnParamsSchema.extend({
    columnId: objectIdSchema,
  }),
  body: z
    .object({
      name: columnFieldsSchema.name.optional(),
      position: columnFieldsSchema.position.optional(),
      color: colorSchema,
      isCompletedColumn: columnFieldsSchema.isCompletedColumn,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: COLUMN_MESSAGES.UPDATE_FIELDS_REQUIRED,
    }),
});

export const columnIdSchema = z.object({
  params: boardColumnParamsSchema.extend({
    columnId: objectIdSchema,
  }),
});

export const listColumnsSchema = z.object({
  params: boardColumnParamsSchema,
});
