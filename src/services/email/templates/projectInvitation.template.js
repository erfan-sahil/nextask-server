import { env } from '../../../config/env.js';
import { WORKSPACE_INVITATION } from '../../../constants/workspaceInvitation.js';
import {
  buildEmailButton,
  buildEmailDetailCard,
  buildEmailDivider,
  buildEmailLayout,
  buildEmailMutedText,
  buildEmailRoleBadge,
  buildEmailStepList,
  emailColors,
  escapeHtml,
  formatRoleLabel,
} from './emailLayout.template.js';

export const buildProjectInvitationEmail = ({
  projectName,
  workspaceName,
  role,
  invitedByName,
  acceptUrl,
}) => {
  const expiryDays = WORKSPACE_INVITATION.EXPIRY_MS / (24 * 60 * 60 * 1000);
  const roleLabel = formatRoleLabel(role);

  const bodyHtml = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="padding-bottom:24px;">
        ${buildEmailDetailCard([
          { label: 'Project', value: projectName },
          { label: 'Workspace', value: workspaceName },
          { label: 'Invited by', value: invitedByName },
          { label: 'Your role', html: buildEmailRoleBadge(role) },
        ])}
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-bottom:28px;">
        ${buildEmailButton(acceptUrl, 'Accept invitation')}
      </td>
    </tr>
    <tr>
      <td>
        <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:${emailColors.foreground};">
          How to join
        </p>
        ${buildEmailStepList([
          'Click the "Accept invitation" button above.',
          'Sign in to NexTask with this email address (or create your account if you are new).',
          `Start collaborating on the ${escapeHtml(projectName)} project right away.`,
        ])}
      </td>
    </tr>
    ${buildEmailDivider()}
    <tr>
      <td>
        ${buildEmailMutedText(
          `You will have access to this project only. This invitation expires in <strong style="color:${emailColors.foreground};font-weight:600;">${expiryDays} days</strong>. If you were not expecting it, you can safely ignore this email.`
        )}
      </td>
    </tr>
  </table>`;

  const html = buildEmailLayout({
    pageTitle: `Join ${projectName} on NexTask`,
    preheader: `${invitedByName} invited you to the ${projectName} project as ${roleLabel}.`,
    title: `You are invited to ${projectName}`,
    description: `${invitedByName} has invited you to collaborate on the ${projectName} project in the ${workspaceName} workspace on NexTask as ${roleLabel}.`,
    bodyHtml,
    footerNote:
      'You received this email because someone invited you to a NexTask project.',
  });

  const text = `You are invited to ${projectName} on NexTask

${invitedByName} has invited you to collaborate on the ${projectName} project in the ${workspaceName} workspace as ${roleLabel}.

Project: ${projectName}
Workspace: ${workspaceName}
Invited by: ${invitedByName}
Your role: ${roleLabel}

How to join:
1. Open the invitation link below.
2. Sign in to NexTask with this email address (or create your account if you are new).
3. Start collaborating on the ${projectName} project right away.

Accept the invitation:
${acceptUrl}

You will have access to this project only. This invitation expires in ${expiryDays} days. If you were not expecting it, you can safely ignore this email.

© ${new Date().getFullYear()} NexTask`;

  return { html, text };
};

export const buildProjectInvitationAcceptUrl = (token) =>
  `${env.clientUrl}/project-invitations/accept?token=${encodeURIComponent(token)}`;
