import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import { EMAIL_LOGO_CID } from './templates/emailLayout.template.js';
import { buildWelcomeEmail } from './templates/welcomeEmail.template.js';
import { buildVerificationOtpEmail } from './templates/verificationOtp.template.js';
import { buildWorkspaceInvitationEmail } from './templates/workspaceInvitation.template.js';
import { buildProjectInvitationEmail } from './templates/projectInvitation.template.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMAIL_LOGO_PATH = path.join(__dirname, '../../assets/email/logo.png');
const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';

let smtpTransporter = null;
let resendClient = null;
let logoBase64 = null;

const getResendClient = () => {
  if (!resendClient && env.resend.apiKey) {
    resendClient = new Resend(env.resend.apiKey);
  }
  return resendClient;
};

const getSmtpTransporter = () => {
  if (!smtpTransporter && env.smtp.host && env.smtp.user) {
    smtpTransporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }
  return smtpTransporter;
};

const getLogoBase64 = () => {
  if (!logoBase64) {
    logoBase64 = fs.readFileSync(EMAIL_LOGO_PATH).toString('base64');
  }
  return logoBase64;
};

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

/** Pull a bare email out of messy env values (quotes, Name <email>, etc.). */
const extractEmail = (value) => {
  const cleaned = String(value || '')
    .trim()
    .replace(/^["']+|["']+$/g, '');

  if (isValidEmail(cleaned)) {
    return cleaned;
  }

  const angled = cleaned.match(/<([^>]+)>/);
  if (angled && isValidEmail(angled[1].trim())) {
    return angled[1].trim();
  }

  const loose = cleaned.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (loose && isValidEmail(loose[0])) {
    return loose[0];
  }

  return null;
};

/** Resolve Brevo sender from dedicated env vars or EMAIL_FROM. */
const getBrevoSender = () => {
  const dedicatedName = String(env.brevo.senderName || 'NexTask')
    .trim()
    .replace(/^["']+|["']+$/g, '') || 'NexTask';

  const email =
    extractEmail(env.brevo.senderEmail) || extractEmail(env.smtp.from);

  if (!email) {
    logger.error('Brevo sender email missing or invalid', {
      brevoSenderEmail: env.brevo.senderEmail,
      emailFrom: env.smtp.from,
    });
    throw new Error(
      'Valid sender email required. Set BREVO_SENDER_EMAIL=erfansahil20@gmail.com on Render (plain email, no quotes or <>).'
    );
  }

  return { name: dedicatedName, email };
};

const toFriendlyEmailError = (error) => {
  logger.error('Email delivery failed', { cause: error.message });

  const message = error.message || '';
  const expose =
    message.includes('testing emails') ||
    message.includes('verify a domain') ||
    message.includes('sender') ||
    message.includes('Sender');

  return ApiError.serviceUnavailable(
    expose
      ? message
      : 'We could not complete your request because the email could not be sent. Please try again later.'
  );
};

const sendWithBrevo = async ({ to, subject, html, text }) => {
  const sender = getBrevoSender();

  logger.info('Sending email via Brevo', { to, from: sender.email });

  const response = await fetch(BREVO_SEND_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': env.brevo.apiKey,
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
      attachment: [
        {
          name: 'logo.png',
          content: getLogoBase64(),
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail =
      payload?.message ||
      payload?.error ||
      (Array.isArray(payload?.code) ? payload.code.join(', ') : payload?.code) ||
      `Brevo request failed (${response.status})`;
    throw new Error(detail);
  }

  return payload;
};

const sendWithResend = async ({ to, subject, html, text }) => {
  const resend = getResendClient();

  logger.info('Sending email via Resend', { to, from: env.smtp.from });

  const { data, error } = await resend.emails.send({
    from: env.smtp.from,
    to: [to],
    subject,
    html,
    text,
    attachments: [
      {
        filename: 'logo.png',
        content: getLogoBase64(),
        contentId: EMAIL_LOGO_CID,
      },
    ],
  });

  if (error) {
    throw new Error(error.message || 'Resend email failed');
  }

  return data;
};

const sendWithSmtp = async ({ to, subject, html, text }) => {
  const transport = getSmtpTransporter();

  logger.info('Sending email via SMTP', { to, from: env.smtp.from });

  return transport.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: 'logo.png',
        content: Buffer.from(getLogoBase64(), 'base64'),
        cid: EMAIL_LOGO_CID,
      },
    ],
  });
};

export const emailService = {
  async send({ to, subject, html, text }) {
    const hasBrevo = Boolean(env.brevo.apiKey?.trim());
    const hasResend = Boolean(env.resend.apiKey?.trim());
    const hasSmtp = Boolean(env.smtp.host && env.smtp.user);

    if (!hasBrevo && !hasResend && !hasSmtp) {
      logger.warn('Email not configured — skipping send');
      return null;
    }

    try {
      // Brevo first (HTTPS, works on free Render without a custom domain).
      if (hasBrevo) {
        return await sendWithBrevo({ to, subject, html, text });
      }

      if (hasResend) {
        return await sendWithResend({ to, subject, html, text });
      }

      return await sendWithSmtp({ to, subject, html, text });
    } catch (error) {
      throw toFriendlyEmailError(error);
    }
  },

  async sendWelcomeEmail(to, firstName) {
    const { html, text } = buildWelcomeEmail(firstName);

    return this.send({
      to,
      subject: 'Welcome to NexTask — your account is ready',
      html,
      text,
    });
  },

  async sendVerificationOtpEmail(to, firstName, otp) {
    const { html, text } = buildVerificationOtpEmail(firstName, otp);

    return this.send({
      to,
      subject: `${otp} is your NexTask verification code`,
      html,
      text,
    });
  },

  async sendWorkspaceInvitationEmail({ to, workspaceName, role, invitedByName, acceptUrl }) {
    const { html, text } = buildWorkspaceInvitationEmail({
      workspaceName,
      role,
      invitedByName,
      acceptUrl,
    });

    return this.send({
      to,
      subject: `You have been invited to join ${workspaceName} on NexTask`,
      html,
      text,
    });
  },

  async sendProjectInvitationEmail({
    to,
    projectName,
    workspaceName,
    role,
    invitedByName,
    acceptUrl,
  }) {
    const { html, text } = buildProjectInvitationEmail({
      projectName,
      workspaceName,
      role,
      invitedByName,
      acceptUrl,
    });

    return this.send({
      to,
      subject: `You have been invited to join ${projectName} on NexTask`,
      html,
      text,
    });
  },
};
