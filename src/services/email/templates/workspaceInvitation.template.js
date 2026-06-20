import { env } from '../../../config/env.js';
import { WORKSPACE_INVITATION } from '../../../constants/workspaceInvitation.js';

const colors = {
  background: '#ffffff',
  foreground: '#18181b',
  muted: '#71717a',
  mutedForeground: '#a1a1aa',
  border: '#e4e4e7',
  card: '#fafafa',
  primary: '#c026d3',
  primaryForeground: '#ffffff',
  primaryHover: '#a21caf',
  primaryLight: '#fae8ff',
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const buildWorkspaceInvitationEmail = ({
  workspaceName,
  role,
  invitedByName,
  acceptUrl,
}) => {
  const safeWorkspaceName = escapeHtml(workspaceName);
  const safeRole = escapeHtml(role);
  const safeInvitedByName = escapeHtml(invitedByName);
  const safeAcceptUrl = escapeHtml(acceptUrl);
  const expiryDays = WORKSPACE_INVITATION.EXPIRY_MS / (24 * 60 * 60 * 1000);
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Join ${safeWorkspaceName} on NexTask</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.card};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.card};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${colors.background};border:1px solid ${colors.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid ${colors.border};">
              <span style="font-size:22px;font-weight:700;color:${colors.primary};">NexTask</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <span style="display:inline-block;background-color:${colors.primaryLight};color:${colors.primary};font-size:13px;font-weight:600;padding:6px 14px;border-radius:999px;">
                Workspace invitation
              </span>
              <h1 style="margin:20px 0 12px;font-size:28px;font-weight:700;color:${colors.foreground};">
                You are invited to join ${safeWorkspaceName}
              </h1>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.65;color:${colors.muted};">
                ${safeInvitedByName} invited you to join
                <strong style="color:${colors.foreground};">${safeWorkspaceName}</strong>
                as a <strong style="color:${colors.foreground};">${safeRole}</strong>.
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${colors.muted};">
                Sign in with this email address, then confirm your invitation to access the workspace.
              </p>
              <a href="${safeAcceptUrl}" style="display:inline-block;background-color:${colors.primary};color:${colors.primaryForeground};text-decoration:none;font-size:16px;font-weight:600;padding:14px 28px;border-radius:10px;">
                Accept invitation
              </a>
              <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:${colors.mutedForeground};">
                This invitation expires in ${expiryDays} days. If you did not expect this email, you can ignore it.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid ${colors.border};background-color:${colors.card};">
              <p style="margin:0;font-size:12px;color:${colors.mutedForeground};text-align:center;">
                &copy; ${year} NexTask. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `You are invited to join ${workspaceName} on NexTask.

${invitedByName} invited you as ${role}.

Sign in with this email address, then open the link below to accept:
${acceptUrl}

This invitation expires in ${expiryDays} days.

© ${year} NexTask. All rights reserved.`;

  return { html, text };
};

export const buildInvitationAcceptUrl = (token) =>
  `${env.clientUrl}/invitations/accept?token=${encodeURIComponent(token)}`;
