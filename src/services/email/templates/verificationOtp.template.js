import { EMAIL_VERIFICATION } from '../../../constants/emailVerification.js';

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
  primaryLight: '#fae8ff',
  primaryMuted: '#e879f9',
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatOtp = (otp) => {
  const digits = String(otp).replace(/\D/g, '');
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
};

export const buildVerificationOtpEmail = (firstName, otp) => {
  const safeName = escapeHtml(firstName);
  const safeOtp = escapeHtml(formatOtp(otp));
  const expiryMinutes = EMAIL_VERIFICATION.OTP_EXPIRY_MS / (60 * 1000);
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Verify your NexTask email</title>
</head>
<body style="margin:0;padding:0;background-color:${colors.card};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.card};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${colors.background};border:1px solid ${colors.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid ${colors.border};">
              <span style="font-size:22px;font-weight:700;color:${colors.primary};letter-spacing:-0.02em;">NexTask</span>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom:24px;">
                    <span style="display:inline-block;background-color:${colors.primaryLight};color:${colors.primary};font-size:13px;font-weight:600;padding:6px 14px;border-radius:999px;">
                      Verify your email
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:12px;">
                    <h1 style="margin:0;font-size:28px;font-weight:700;line-height:1.25;color:${colors.foreground};letter-spacing:-0.02em;">
                      Hi ${safeName}, confirm it's you
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:16px;line-height:1.65;color:${colors.muted};">
                      Use the verification code below to confirm your email address and activate your
                      <strong style="color:${colors.foreground};font-weight:600;">NexTask</strong> account.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <div style="display:inline-block;background-color:${colors.card};border:1px solid ${colors.border};border-radius:12px;padding:20px 32px;">
                      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:${colors.mutedForeground};text-transform:uppercase;letter-spacing:0.08em;">
                        Verification code
                      </p>
                      <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:0.2em;color:${colors.primary};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">
                        ${safeOtp}
                      </p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="margin:0;font-size:14px;line-height:1.6;color:${colors.mutedForeground};text-align:center;">
                      This code expires in <strong style="color:${colors.foreground};">${expiryMinutes} minutes</strong>.
                      If you didn't create a NexTask account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid ${colors.border};background-color:${colors.card};">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${colors.mutedForeground};text-align:center;">
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

  const text = `Hi ${firstName},

Verify your NexTask email address with this code:

${formatOtp(otp)}

This code expires in ${expiryMinutes} minutes.

If you didn't create a NexTask account, you can safely ignore this email.

© ${year} NexTask. All rights reserved.`;

  return { html, text };
};
