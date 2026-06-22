import { EMAIL_VERIFICATION } from '../../../constants/emailVerification.js';
import { env } from '../../../config/env.js';
import {
  buildEmailButton,
  buildEmailDivider,
  buildEmailLayout,
  buildEmailMutedText,
  buildEmailOtpCode,
  buildEmailStepList,
  emailColors,
  escapeHtml,
} from './emailLayout.template.js';

const formatOtp = (otp) => {
  const digits = String(otp).replace(/\D/g, '');
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
};

export const buildVerificationOtpEmail = (firstName, otp) => {
  const expiryMinutes = EMAIL_VERIFICATION.OTP_EXPIRY_MS / (60 * 1000);
  const formattedOtp = formatOtp(otp);
  const verifyUrl = `${env.clientUrl.replace(/\/$/, '')}/verify-email`;

  const bodyHtml = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="padding:28px 20px;background-color:${emailColors.primaryLight};border:1px solid ${emailColors.border};border-radius:12px;text-align:center;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${emailColors.accent};">
          Your verification code
        </p>
        ${buildEmailOtpCode(otp)}
      </td>
    </tr>
    <tr>
      <td style="padding-top:28px;">
        <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:${emailColors.foreground};">
          How to complete your registration
        </p>
        ${buildEmailStepList([
          'Return to the NexTask verification page.',
          'Enter the 6-digit code shown above.',
          'Once verified, your account will be created and you can sign in immediately.',
        ])}
      </td>
    </tr>
    <tr>
      <td style="padding-top:8px;">
        ${buildEmailButton(verifyUrl, 'Go to verification')}
      </td>
    </tr>
    ${buildEmailDivider()}
    <tr>
      <td>
        ${buildEmailMutedText(
          `This code expires in <strong style="color:${emailColors.foreground};font-weight:600;">${expiryMinutes} minutes</strong> for your security. If you did not request this email, you can safely ignore it — no account will be created without verification.`
        )}
      </td>
    </tr>
    <tr>
      <td style="padding-top:16px;">
        <p style="margin:0;font-size:13px;line-height:1.65;color:${emailColors.mutedForeground};">
          Need help? Visit
          <a href="${escapeHtml(env.clientUrl)}" style="color:${emailColors.primary};text-decoration:none;font-weight:600;">${escapeHtml(env.clientUrl)}</a>
        </p>
      </td>
    </tr>
  </table>`;

  const html = buildEmailLayout({
    pageTitle: 'Verify your NexTask email',
    preheader: `Your NexTask verification code is ${formattedOtp}. It expires in ${expiryMinutes} minutes.`,
    title: `Welcome, ${firstName}`,
    description:
      'Thank you for signing up for NexTask. Use the verification code below to confirm your email address and activate your account.',
    bodyHtml,
    footerNote:
      'You received this email because a NexTask account registration was started with this address.',
  });

  const text = `Welcome, ${firstName}

Thank you for signing up for NexTask.

Your verification code: ${formattedOtp}

How to complete your registration:
1. Return to the NexTask verification page: ${verifyUrl}
2. Enter the 6-digit code above.
3. Once verified, your account will be created and you can sign in.

This code expires in ${expiryMinutes} minutes.

If you did not request this email, you can safely ignore it.

© ${new Date().getFullYear()} NexTask`;

  return { html, text };
};
