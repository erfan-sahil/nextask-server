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

let smtpTransporter = null;
let resendClient = null;

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
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }
  return smtpTransporter;
};

const getLogoAttachment = () => {
  const content = fs.readFileSync(EMAIL_LOGO_PATH);

  return {
    filename: 'logo.png',
    content,
    contentId: EMAIL_LOGO_CID,
    cid: EMAIL_LOGO_CID,
  };
};

const toFriendlyEmailError = (error) => {
  logger.error('Email delivery failed', { cause: error.message });

  return ApiError.serviceUnavailable(
    'We could not complete your request because the email could not be sent. Please try again later.'
  );
};

const sendWithResend = async ({ to, subject, html, text }) => {
  const resend = getResendClient();
  const logo = getLogoAttachment();

  const { data, error } = await resend.emails.send({
    from: env.smtp.from,
    to: [to],
    subject,
    html,
    text,
    attachments: [
      {
        filename: logo.filename,
        content: logo.content,
        contentId: logo.contentId,
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
  const logo = getLogoAttachment();

  return transport.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
    attachments: [
      {
        filename: logo.filename,
        content: logo.content,
        cid: logo.cid,
      },
    ],
  });
};

export const emailService = {
  async send({ to, subject, html, text }) {
    const hasResend = Boolean(env.resend.apiKey);
    const hasSmtp = Boolean(env.smtp.host && env.smtp.user);

    if (!hasResend && !hasSmtp) {
      logger.warn('Email not configured — skipping send');
      return null;
    }

    try {
      // Prefer Resend (HTTPS) so free Render can send mail; SMTP is blocked there.
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
