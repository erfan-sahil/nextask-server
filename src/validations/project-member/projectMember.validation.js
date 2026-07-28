import { z } from 'zod';
import { WORKSPACE_MEMBER_ROLE } from '../../constants/workspaceMemberRole.js';
import { PROJECT_MEMBER_MESSAGES } from '../../constants/projectMemberMessages.js';
import { objectIdSchema, paginationQuerySchema } from '../common/common.validation.js';

const projectParamsSchema = z.object({
  workspaceId: objectIdSchema,
  projectId: objectIdSchema,
});

const memberRoleSchema = z.enum(Object.values(WORKSPACE_MEMBER_ROLE), {
  message: `Role must be one of: ${Object.values(WORKSPACE_MEMBER_ROLE).join(', ')}`,
});

const assignableMemberRoleSchema = memberRoleSchema.refine(
  (role) => role !== WORKSPACE_MEMBER_ROLE.OWNER,
  PROJECT_MEMBER_MESSAGES.OWNER_ROLE_ASSIGN
);

export const inviteProjectMemberSchema = z.object({
  params: projectParamsSchema,
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .trim()
      .toLowerCase(),
    role: assignableMemberRoleSchema.optional(),
  }),
});

export const updateProjectMemberSchema = z.object({
  params: projectParamsSchema.extend({
    memberId: objectIdSchema,
  }),
  body: z
    .object({
      role: assignableMemberRoleSchema,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: PROJECT_MEMBER_MESSAGES.UPDATE_FIELDS_REQUIRED,
    }),
});

export const projectMemberIdSchema = z.object({
  params: projectParamsSchema.extend({
    memberId: objectIdSchema,
  }),
});

export const listProjectMembersSchema = z.object({
  params: projectParamsSchema,
  query: z.object({
    ...paginationQuerySchema,
    role: memberRoleSchema.optional(),
    search: z.string().trim().max(100, 'Search query cannot exceed 100 characters').optional(),
  }),
});
