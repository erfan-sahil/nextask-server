import { env } from '../../../config/env.js';
import {
  buildEmailButton,
  buildEmailLayout,
  buildEmailMutedText,
  emailColors,
  escapeHtml,
} from './emailLayout.template.js';

export const buildWelcomeEmail = (firstName) => {
  const appUrl = env.clientUrl;

  const bodyHtml = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="padding-bottom:28px;">
        ${buildEmailMutedText(
          'Your account is ready. Open NexTask to create workspaces, organize projects, and manage tasks in one place.'
        )}
      </td>
    </tr>
    <tr>
      <td>
        ${buildEmailButton(appUrl, 'Open NexTask')}
      </td>
    </tr>
    <tr>
      <td style="padding-top:20px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:${emailColors.mutedForeground};">
          <a href="${escapeHtml(appUrl)}" style="color:${emailColors.primary};text-decoration:none;">${escapeHtml(appUrl)}</a>
        </p>
      </td>
    </tr>
  </table>`;

  const html = buildEmailLayout({
    pageTitle: 'Welcome to NexTask',
    title: `Welcome, ${firstName}`,
    description: 'Thanks for joining NexTask.',
    bodyHtml,
    footerNote: 'You received this because you created a NexTask account.',
  });

  const text = `Welcome, ${firstName}

Thanks for joining NexTask.

Your account is ready. Open NexTask to create workspaces, organize projects, and manage tasks in one place.

${appUrl}

© ${new Date().getFullYear()} NexTask
You received this because you created a NexTask account.`;

  return { html, text };
};
