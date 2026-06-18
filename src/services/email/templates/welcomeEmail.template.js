import { env } from '../../../config/env.js';

/** Brand palette — mirrors nextask-client/src/app/globals.css (:root light theme) */
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
  primaryMuted: '#e879f9',
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const buildWelcomeEmail = (firstName) => {
  const safeName = escapeHtml(firstName);
  const appUrl = env.clientUrl;
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Welcome to NexTask</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.card};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.card};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${colors.background};border:1px solid ${colors.border};border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid ${colors.border};">
              <span style="font-size:22px;font-weight:700;color:${colors.primary};letter-spacing:-0.02em;">NexTask</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:24px;">
                    <span style="display:inline-block;background-color:${colors.primaryLight};color:${colors.primary};font-size:13px;font-weight:600;padding:6px 14px;border-radius:999px;">
                      Welcome aboard
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:12px;">
                    <h1 style="margin:0;font-size:28px;font-weight:700;line-height:1.25;color:${colors.foreground};letter-spacing:-0.02em;">
                      Hi ${safeName}, you're all set
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:16px;line-height:1.65;color:${colors.muted};">
                      Thanks for joining <strong style="color:${colors.foreground};font-weight:600;">NexTask</strong>.
                      Your account is ready — a clean, focused way to manage tasks, stay productive, and get things done.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${colors.card};border:1px solid ${colors.border};border-radius:12px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:${colors.foreground};text-transform:uppercase;letter-spacing:0.04em;">
                            What you can do next
                          </p>
                          <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:${colors.muted};">
                            <span style="color:${colors.primaryMuted};font-weight:700;margin-right:8px;">&#10003;</span>
                            Create and organize your tasks
                          </p>
                          <p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:${colors.muted};">
                            <span style="color:${colors.primaryMuted};font-weight:700;margin-right:8px;">&#10003;</span>
                            Stay on top of your priorities
                          </p>
                          <p style="margin:0;font-size:15px;line-height:1.5;color:${colors.muted};">
                            <span style="color:${colors.primaryMuted};font-weight:700;margin-right:8px;">&#10003;</span>
                            Track progress and get more done
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <a href="${appUrl}" style="display:inline-block;background-color:${colors.primary};color:${colors.primaryForeground};font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:999px;">
                      Start for free
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:16px 0 0;font-size:13px;color:${colors.mutedForeground};">
                      Or copy this link: <a href="${appUrl}" style="color:${colors.primary};text-decoration:none;">${appUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid ${colors.border};background-color:${colors.card};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${colors.mutedForeground};text-align:center;">
                &copy; ${year} NexTask. All rights reserved.<br />
                You received this email because you signed up for a NexTask account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hi ${firstName},

Welcome to NexTask — your account has been created.

Thanks for joining us. NexTask is a clean, focused way to manage your tasks, stay productive, and get things done.

What you can do next:
- Create and organize your tasks
- Stay on top of your priorities
- Track progress and get more done

Get started: ${appUrl}

© ${year} NexTask. All rights reserved.
You received this email because you signed up for a NexTask account.`;

  return { html, text };
};
