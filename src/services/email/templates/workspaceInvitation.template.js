import { env } from '../../../config/env.js';
import { WORKSPACE_INVITATION } from '../../../constants/workspaceInvitation.js';
import {
  buildEmailButton,
  buildEmailLayout,
  buildEmailMutedText,
  escapeHtml,
} from './emailLayout.template.js';

export const buildWorkspaceInvitationEmail = ({
  workspaceName,
  role,
  invitedByName,
  acceptUrl,
}) => {
  const expiryDays = WORKSPACE_INVITATION.EXPIRY_MS / (24 * 60 * 60 * 1000);

  const bodyHtml = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="padding-bottom:28px;">
        ${buildEmailMutedText(
          `<strong style="color:#18181b;">${escapeHtml(invitedByName)}</strong> invited you to join <strong style="color:#18181b;">${escapeHtml(workspaceName)}</strong> as ${escapeHtml(role)}.`
        )}
      </td>
    </tr>
    <tr>
      <td style="padding-bottom:28px;">
        ${buildEmailButton(acceptUrl, 'Accept invitation')}
      </td>
    </tr>
    <tr>
      <td>
        ${buildEmailMutedText(
          `Sign in with this email address to accept. This invitation expires in ${expiryDays} days.`
        )}
      </td>
    </tr>
  </table>`;

  const html = buildEmailLayout({
    pageTitle: `Join ${workspaceName} on NexTask`,
    title: `Join ${workspaceName}`,
    description: 'You have been invited to collaborate on NexTask.',
    bodyHtml,
    footerNote: 'If you were not expecting this invitation, you can ignore this email.',
  });

  const text = `Join ${workspaceName} on NexTask

${invitedByName} invited you to join ${workspaceName} as ${role}.

Accept the invitation:
${acceptUrl}

Sign in with this email address to accept. This invitation expires in ${expiryDays} days.

© ${new Date().getFullYear()} NexTask`;

  return { html, text };
};

export const buildInvitationAcceptUrl = (token) =>
  `${env.clientUrl}/invitations/accept?token=${encodeURIComponent(token)}`;
