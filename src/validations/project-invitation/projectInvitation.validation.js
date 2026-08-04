import { z } from 'zod';

export const acceptProjectInvitationSchema = z.object({
  body: z.object({
    token: z
      .string({ required_error: 'Invitation token is required' })
      .min(32, 'Invalid invitation token'),
  }),
});

export const previewProjectInvitationSchema = z.object({
  query: z.object({
    token: z
      .string({ required_error: 'Invitation token is required' })
      .min(32, 'Invalid invitation token'),
  }),
});
