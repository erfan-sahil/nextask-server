import { z } from 'zod';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { WORKSPACE_MEMBER_MESSAGES } from '../../constants/workspaceMemberMessages.js';
import { objectIdSchema, paginationQuerySchema } from '../common/common.validation.js';

const workspaceIdParamSchema = z.object({
  workspaceId: objectIdSchema,
});

const memberRoleSchema = z.enum(Object.values(WORKSPACE_MEMBER_ROLE), {
  message: `Role must be one of: ${Object.values(WORKSPACE_MEMBER_ROLE).join(', ')}`,
});

const assignableMemberRoleSchema = memberRoleSchema.refine(
  (role) => role !== WORKSPACE_MEMBER_ROLE.OWNER,
  WORKSPACE_MEMBER_MESSAGES.OWNER_ROLE_ASSIGN
);

export const inviteWorkspaceMemberSchema = z.object({
  params: workspaceIdParamSchema,
  body: z.object({
    email: z
      .string({ error: 'Email is required' })
      .trim()
      .min(1, 'Email is required')
      .email('Invalid email address')
      .toLowerCase(),
    role: assignableMemberRoleSchema.optional(),
  }),
});

export const updateWorkspaceMemberSchema = z.object({
  params: workspaceIdParamSchema.extend({
    memberId: objectIdSchema,
  }),
  body: z
    .object({
      role: assignableMemberRoleSchema,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: WORKSPACE_MEMBER_MESSAGES.UPDATE_FIELDS_REQUIRED,
    }),
});

export const workspaceMemberIdSchema = z.object({
  params: workspaceIdParamSchema.extend({
    memberId: objectIdSchema,
  }),
});

export const listWorkspaceMembersSchema = z.object({
  params: workspaceIdParamSchema,
  query: z.object({
    ...paginationQuerySchema,
    role: memberRoleSchema.optional(),
    search: z.string().trim().max(100, 'Search query cannot exceed 100 characters').optional(),
  }),
});
