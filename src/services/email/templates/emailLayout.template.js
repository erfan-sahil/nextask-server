import { env } from '../../../config/env.js';

/** Brand palette — mirrors nextask-client/src/app/globals.css (:root light theme) */
export const emailColors = {
  background: '#f0f5f3',
  foreground: '#18181b',
  mutedForeground: '#5f6b65',
  border: '#e4e8e6',
  card: '#ffffff',
  primary: '#0f7d5b',
  primaryForeground: '#ffffff',
  primaryLight: '#dcf2e8',
  accent: '#0a5f46',
};

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const getCurrentYear = () => new Date().getFullYear();

export const EMAIL_LOGO_CID = 'nextask-logo@nextask';

const c = emailColors;

export const buildEmailLogo = () => {
  const appUrl = escapeHtml(env.clientUrl);

  return `<a href="${appUrl}" style="display:inline-block;text-decoration:none;">
    <img src="cid:${EMAIL_LOGO_CID}" alt="NexTask" width="160" height="auto" style="display:block;width:160px;max-width:100%;height:auto;border:0;outline:none;" />
  </a>`;
};

export const buildEmailButton = (href, label) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background-color:${c.primary};color:${c.primaryForeground};font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;line-height:1;box-shadow:0 2px 8px rgba(15,125,91,0.25);">
    ${escapeHtml(label)}
  </a>`;

export const buildEmailOtpCode = (otp) => {
  const digits = String(otp).replace(/\D/g, '').slice(0, 6);
  const formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;

  return `<p style="margin:0;font-size:36px;font-weight:700;letter-spacing:0.32em;color:${c.primary};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
    ${escapeHtml(formatted)}
  </p>`;
};

export const buildEmailMutedText = (content) =>
  `<p style="margin:0;font-size:14px;line-height:1.7;color:${c.mutedForeground};">${content}</p>`;

export const buildEmailDivider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
    <tr>
      <td style="border-top:1px solid ${c.border};font-size:0;line-height:0;">&nbsp;</td>
    </tr>
  </table>`;

export const buildEmailStepList = (steps) => {
  const items = steps
    .map(
      (step, index) => `<tr>
      <td valign="top" style="padding:0 0 14px;width:28px;font-size:14px;font-weight:700;color:${c.primary};">
        ${index + 1}.
      </td>
      <td valign="top" style="padding:0 0 14px;font-size:14px;line-height:1.65;color:${c.foreground};">
        ${step}
      </td>
    </tr>`
    )
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    ${items}
  </table>`;
};

/**
 * Professional email shell — branded header, content card, footer.
 */
export const buildEmailLayout = ({
  pageTitle,
  preheader,
  title,
  description,
  bodyHtml,
  footerNote,
}) => {
  const year = getCurrentYear();
  const hiddenPreheader = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${c.background};">
        ${escapeHtml(preheader)}
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(pageTitle)}</title>
</head>
<body style="margin:0;padding:0;background-color:${c.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;color:${c.foreground};">
  ${hiddenPreheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.background};">
    <tr>
      <td align="center" style="padding:48px 20px 56px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td align="center" style="padding:28px 24px;background-color:${c.card};border:1px solid ${c.border};border-radius:16px 16px 0 0;border-bottom:3px solid ${c.primary};">
              ${buildEmailLogo()}
            </td>
          </tr>
          <tr>
            <td style="background-color:${c.card};border:1px solid ${c.border};border-top:0;border-radius:0 0 16px 16px;padding:40px 36px 36px;">
              <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;line-height:1.3;color:${c.foreground};letter-spacing:-0.02em;">
                ${escapeHtml(title)}
              </h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:${c.mutedForeground};">
                ${escapeHtml(description)}
              </p>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:${c.mutedForeground};">
                &copy; ${year} NexTask. All rights reserved.
              </p>
              ${
                footerNote
                  ? `<p style="margin:0;font-size:12px;line-height:1.6;color:${c.mutedForeground};">${escapeHtml(footerNote)}</p>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
