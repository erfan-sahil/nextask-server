import { z } from 'zod';
import { WORKSPACE_VISIBILITY } from '../../constants/workspaceVisibility.js';
import { WORKSPACE_STATUS } from '../../constants/workspaceStatus.js';
import { WORKSPACE_MESSAGES } from '../../constants/workspaceMessages.js';
import { objectIdSchema, paginationQuerySchema } from '../common/common.validation.js';

const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(100, 'Slug must be at most 100 characters')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug may only contain lowercase letters, numbers, and hyphens'
  );

const logoSchema = z
  .union([z.string().url('Logo must be a valid URL'), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' ? null : value));

const workspaceFieldsSchema = {
  name: z
    .string({ required_error: 'Workspace name is required' })
    .min(1, 'Workspace name is required')
    .max(100, 'Workspace name cannot exceed 100 characters')
    .trim(),
  slug: slugSchema,
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
  logo: logoSchema,
  visibility: z.enum(Object.values(WORKSPACE_VISIBILITY), {
    required_error: 'Visibility is required',
    message: `Visibility must be one of: ${Object.values(WORKSPACE_VISIBILITY).join(', ')}`,
  }),
  ownerId: objectIdSchema,
  status: z.enum(Object.values(WORKSPACE_STATUS), {
    message: `Status must be one of: ${Object.values(WORKSPACE_STATUS).join(', ')}`,
  }),
};

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: workspaceFieldsSchema.name,
    slug: workspaceFieldsSchema.slug.optional(),
    description: workspaceFieldsSchema.description,
    logo: workspaceFieldsSchema.logo,
    visibility: workspaceFieldsSchema.visibility,
    ownerId: workspaceFieldsSchema.ownerId.optional(),
    status: workspaceFieldsSchema.status.optional(),
  }),
});

export const updateWorkspaceSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      name: workspaceFieldsSchema.name.optional(),
      slug: workspaceFieldsSchema.slug.optional(),
      description: workspaceFieldsSchema.description,
      logo: logoSchema,
      visibility: workspaceFieldsSchema.visibility.optional(),
      status: workspaceFieldsSchema.status.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: WORKSPACE_MESSAGES.UPDATE_FIELDS_REQUIRED,
    }),
});

export const workspaceIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const listWorkspacesSchema = z.object({
  query: z.object({
    ...paginationQuerySchema,
    status: workspaceFieldsSchema.status.optional(),
    visibility: workspaceFieldsSchema.visibility.optional(),
    search: z.string().trim().max(100, 'Search query cannot exceed 100 characters').optional(),
  }),
});
