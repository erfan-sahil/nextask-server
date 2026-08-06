import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5001,
  isProduction: process.env.NODE_ENV === 'production',

  mongodbUri: process.env.MONGODB_URI,

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:5001/api/v1/auth/google/callback',
  },

  // Prefer Brevo/Resend HTTPS APIs on Render free (SMTP ports are blocked).
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    // Must be a verified Brevo sender (your Gmail) when using Brevo.
    from: process.env.EMAIL_FROM || 'NexTask <noreply@example.com>',
  },

  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    // SPA shells issue many authenticated GETs; 100/15m locks out normal usage.
    max:
      Number(process.env.RATE_LIMIT_MAX) ||
      (process.env.NODE_ENV === 'production' ? 1000 : 5000),
  },
};
