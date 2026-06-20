import { z } from 'zod';

export const acceptWorkspaceInvitationSchema = z.object({
  body: z.object({
    token: z
      .string({ required_error: 'Invitation token is required' })
      .min(32, 'Invalid invitation token'),
  }),
});

export const previewWorkspaceInvitationSchema = z.object({
  query: z.object({
    token: z
      .string({ required_error: 'Invitation token is required' })
      .min(32, 'Invalid invitation token'),
  }),
});
