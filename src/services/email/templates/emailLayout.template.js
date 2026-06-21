import { env } from '../../../config/env.js';

/** Brand palette — mirrors nextask-client/src/app/globals.css (:root light theme) */
export const emailColors = {
  background: '#f5f9f7',
  foreground: '#18181b',
  mutedForeground: '#5f6b65',
  border: '#e4e8e6',
  card: '#ffffff',
  primary: '#0f7d5b',
  primaryForeground: '#ffffff',
  primaryLight: '#dcf2e8',
};

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const getCurrentYear = () => new Date().getFullYear();

export const getEmailLogoUrl = () => {
  const base = (env.emailLogoUrl || env.clientUrl).replace(/\/$/, '');
  return `${base}/email/logo.png`;
};

const c = emailColors;

export const buildEmailLogo = () => {
  const logoUrl = escapeHtml(getEmailLogoUrl());
  const appUrl = escapeHtml(env.clientUrl);

  return `<a href="${appUrl}" style="display:inline-block;text-decoration:none;">
    <img src="${logoUrl}" alt="NexTask" width="132" height="auto" style="display:block;width:132px;height:auto;border:0;outline:none;" />
  </a>`;
};

export const buildEmailButton = (href, label) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background-color:${c.primary};color:${c.primaryForeground};font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:10px;line-height:1;">
    ${escapeHtml(label)}
  </a>`;

export const buildEmailOtpCode = (otp) => {
  const digits = String(otp).replace(/\D/g, '').slice(0, 6);
  const formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`;

  return `<p style="margin:0;font-size:32px;font-weight:700;letter-spacing:0.28em;color:${c.primary};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
    ${escapeHtml(formatted)}
  </p>`;
};

export const buildEmailMutedText = (content) =>
  `<p style="margin:0;font-size:14px;line-height:1.65;color:${c.mutedForeground};">${content}</p>`;

/**
 * Minimal email shell — logo, headline, body, footer.
 */
export const buildEmailLayout = ({
  pageTitle,
  title,
  description,
  bodyHtml,
  footerNote,
}) => {
  const year = getCurrentYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(pageTitle)}</title>
</head>
<body style="margin:0;padding:0;background-color:${c.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;color:${c.foreground};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${c.background};">
    <tr>
      <td align="center" style="padding:56px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              ${buildEmailLogo()}
            </td>
          </tr>
          <tr>
            <td style="background-color:${c.card};border:1px solid ${c.border};border-radius:16px;padding:40px 36px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.3;color:${c.foreground};letter-spacing:-0.02em;">
                ${escapeHtml(title)}
              </h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:${c.mutedForeground};">
                ${escapeHtml(description)}
              </p>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${c.mutedForeground};">
                &copy; ${year} NexTask
                ${footerNote ? `<br />${escapeHtml(footerNote)}` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
