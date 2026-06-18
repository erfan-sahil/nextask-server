import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';

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
      });
    } catch (error) {
      throw toFriendlyEmailError(error);
    }
  },

  async sendWelcomeEmail(to, firstName) {
    return this.send({
      to,
      subject: 'Welcome to NexTask',
      html: `<p>Hi ${firstName},</p><p>Welcome to NexTask! Your account has been created.</p>`,
      text: `Hi ${firstName}, Welcome to NexTask! Your account has been created.`,
    });
  },
};
