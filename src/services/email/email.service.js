import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

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

export const emailService = {
  async send({ to, subject, html, text }) {
    const transport = getTransporter();

    if (!transport) {
      console.warn('Email not configured — skipping send');
      return null;
    }

    return transport.sendMail({
      from: env.smtp.from,
      to,
      subject,
      html,
      text,
    });
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
