import {
  buildEmailLayout,
  buildEmailMutedText,
  buildEmailStepList,
  emailColors,
} from './emailLayout.template.js';

export const buildWelcomeEmail = (firstName) => {
  const bodyHtml = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="padding-bottom:28px;">
        ${buildEmailMutedText('Your email has been verified and your account is now active.')}
      </td>
    </tr>
    <tr>
      <td>
        <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:${emailColors.foreground};">
          Here is what you can do next
        </p>
        ${buildEmailStepList([
          'Sign in to NexTask with your registered email and password.',
          'Create a workspace to organize your team and projects.',
          'Add projects and tasks to keep your work in one place.',
        ])}
      </td>
    </tr>
  </table>`;

  const html = buildEmailLayout({
    pageTitle: 'Welcome to NexTask',
    preheader: 'Your NexTask account is ready. Sign in to get started.',
    title: `Welcome, ${firstName}`,
    description:
      'Thank you for joining NexTask. Your account has been successfully verified and is ready to use.',
    bodyHtml,
    footerNote: 'You received this email because you created a NexTask account.',
  });

  const text = `Welcome, ${firstName}

Thank you for joining NexTask. Your account has been successfully verified and is ready to use.

Your email has been verified and your account is now active.

Here is what you can do next:
1. Sign in to NexTask with your registered email and password.
2. Create a workspace to organize your team and projects.
3. Add projects and tasks to keep your work in one place.

© ${new Date().getFullYear()} NexTask
You received this email because you created a NexTask account.`;

  return { html, text };
};
