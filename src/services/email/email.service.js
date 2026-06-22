import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import { EMAIL_LOGO_CID } from './templates/emailLayout.template.js';
import { buildWelcomeEmail } from './templates/welcomeEmail.template.js';
import { buildVerificationOtpEmail } from './templates/verificationOtp.template.js';
import { buildWorkspaceInvitationEmail } from './templates/workspaceInvitation.template.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMAIL_LOGO_PATH = path.join(__dirname, '../../assets/email/logo.png');

let transporter = null;

const getTransporter = () => {
  if (!transporter && env.smtp.host && env.smtp.user) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }
  return transporter;
};

const toFriendlyEmailError = (error) => {
  logger.error('Email delivery failed', { cause: error.message });

  return ApiError.serviceUnavailable(
    'We could not complete your request because the welcome email could not be sent. Please try again later.'
  );
};

export const emailService = {
  async send({ to, subject, html, text }) {
    const transport = getTransporter();

    if (!transport) {
      logger.warn('Email not configured — skipping send');
      return null;
    }

    try {
      return await transport.sendMail({
        from: env.smtp.from,
        to,
        subject,
        html,
        text,
        attachments: [
          {
            filename: 'logo.png',
            path: EMAIL_LOGO_PATH,
            cid: EMAIL_LOGO_CID,
          },
        ],
      });
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

  async sendWorkspaceInvitationEmail({
    to,
    workspaceName,
    role,
    invitedByName,
    acceptUrl,
  }) {
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
};
