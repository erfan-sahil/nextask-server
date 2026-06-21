import { EMAIL_VERIFICATION } from '../../../constants/emailVerification.js';
import {
  buildEmailLayout,
  buildEmailMutedText,
  buildEmailOtpCode,
  emailColors,
} from './emailLayout.template.js';

const formatOtp = (otp) => {
  const digits = String(otp).replace(/\D/g, '');
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
};

export const buildVerificationOtpEmail = (firstName, otp) => {
  const expiryMinutes = EMAIL_VERIFICATION.OTP_EXPIRY_MS / (60 * 1000);
  const formattedOtp = formatOtp(otp);

  const bodyHtml = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:24px 16px;background-color:${emailColors.primaryLight};border-radius:12px;">
        ${buildEmailOtpCode(otp)}
      </td>
    </tr>
    <tr>
      <td style="padding-top:24px;">
        ${buildEmailMutedText(
          `This code expires in <strong style="color:${emailColors.foreground};font-weight:600;">${expiryMinutes} minutes</strong>. If you didn't sign up for NexTask, you can ignore this email.`
        )}
      </td>
    </tr>
  </table>`;

  const html = buildEmailLayout({
    pageTitle: 'Verify your NexTask email',
    title: `Hi ${firstName}, verify your email`,
    description: 'Enter this code on the verification page to activate your account.',
    bodyHtml,
  });

  const text = `Hi ${firstName},

Your NexTask verification code:

${formattedOtp}

This code expires in ${expiryMinutes} minutes.

If you didn't sign up for NexTask, you can ignore this email.

© ${new Date().getFullYear()} NexTask`;

  return { html, text };
};
