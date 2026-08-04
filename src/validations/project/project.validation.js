import { z } from 'zod';
import { PROJECT_STATUS } from '../../constants/projectStatus.js';
import { PROJECT_MESSAGES } from '../../constants/projectMessages.js';
import { objectIdSchema, paginationQuerySchema } from '../common/common.validation.js';

const workspaceIdParamSchema = z.object({
  workspaceId: objectIdSchema,
});

const iconSchema = z
  .union([z.string().url('Icon must be a valid URL'), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' ? null : value));

const dateSchema = z
  .union([z.string().datetime({ message: 'Invalid date format' }), z.date(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null) {
      return null;
    }

    return value instanceof Date ? value : new Date(value);
  });

const projectFieldsSchema = {
  name: z
    .string({ required_error: 'Project name is required' })
    .min(1, 'Project name is required')
    .max(200, 'Project name cannot exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .trim()
    .optional(),
  icon: iconSchema,
  status: z.enum(Object.values(PROJECT_STATUS), {
    message: `Status must be one of: ${Object.values(PROJECT_STATUS).join(', ')}`,
  }),
  startDate: dateSchema,
  endDate: dateSchema,
};

export const createProjectSchema = z.object({
  params: workspaceIdParamSchema,
  body: z
    .object({
      name: projectFieldsSchema.name,
      description: projectFieldsSchema.description,
      icon: projectFieldsSchema.icon,
      status: projectFieldsSchema.status.optional(),
      startDate: projectFieldsSchema.startDate,
      endDate: projectFieldsSchema.endDate,
    })
    .superRefine((data, ctx) => {
      if (data.startDate && data.endDate && data.endDate < data.startDate) {
        ctx.addIssue({
          code: 'custom',
          message: PROJECT_MESSAGES.INVALID_DATE_RANGE,
          path: ['endDate'],
        });
      }
    }),
});

export const updateProjectSchema = z.object({
  params: workspaceIdParamSchema.extend({
    projectId: objectIdSchema,
  }),
  body: z
    .object({
      name: projectFieldsSchema.name.optional(),
      description: projectFieldsSchema.description,
      icon: iconSchema,
      status: projectFieldsSchema.status.optional(),
      startDate: projectFieldsSchema.startDate,
      endDate: projectFieldsSchema.endDate,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: PROJECT_MESSAGES.UPDATE_FIELDS_REQUIRED,
    }),
});

export const projectIdSchema = z.object({
  params: workspaceIdParamSchema.extend({
    projectId: objectIdSchema,
  }),
});

export const listProjectsSchema = z.object({
  params: workspaceIdParamSchema,
  query: z.object({
    ...paginationQuerySchema,
    status: projectFieldsSchema.status.optional(),
    search: z.string().trim().max(100, 'Search query cannot exceed 100 characters').optional(),
  }),
});
