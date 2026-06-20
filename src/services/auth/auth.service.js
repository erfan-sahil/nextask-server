import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { EMAIL_VERIFICATION } from '../../constants/emailVerification.js';
import { env } from '../../config/env.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import { compareOtp, generateOtp, hashOtp } from '../../utils/otp.js';
import { User } from '../../models/user/user.model.js';
import { emailService } from '../email/email.service.js';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });

  const refreshToken = jwt.sign({ id: userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

const setTokenCookies = (res, { accessToken, refreshToken }) => {
  const cookieOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
  };

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
};

const clearTokenCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

const assertActiveUser = (user) => {
  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('Your account has been suspended');
  }
};

const persistRefreshToken = async (user, refreshToken) => {
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
};

const assignVerificationOtp = (user) => {
  const otp = generateOtp();

  user.emailVerificationOtp = hashOtp(otp);
  user.emailVerificationExpires = new Date(
    Date.now() + EMAIL_VERIFICATION.OTP_EXPIRY_MS
  );
  user.emailVerificationSentAt = new Date();
  user.emailVerificationAttempts = 0;

  return otp;
};

const clearVerificationOtp = (user) => {
  user.emailVerificationOtp = undefined;
  user.emailVerificationExpires = undefined;
  user.emailVerificationSentAt = undefined;
  user.emailVerificationAttempts = 0;
};

const issueAndSendVerificationOtp = async (user) => {
  const otp = assignVerificationOtp(user);
  await user.save({ validateBeforeSave: false });
  await emailService.sendVerificationOtpEmail(user.email, user.firstName, otp);
};

export const authService = {
  async register({ firstName, lastName, username, email, password }) {
    const [existingEmail, existingUsername] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ username }),
    ]);

    if (existingEmail) {
      throw ApiError.conflict('Email already registered');
    }

    if (existingUsername) {
      throw ApiError.conflict('Username already taken');
    }

    const session = await mongoose.startSession();
    let user;

    try {
      session.startTransaction();

      [user] = await User.create(
        [{ firstName, lastName, username, email, password }],
        { session }
      );

      const otp = assignVerificationOtp(user);

      const tokens = generateTokens(user._id);
      user.refreshToken = tokens.refreshToken;
      await user.save({ session, validateBeforeSave: false });

      await session.commitTransaction();

      let verificationEmailSent = true;

      try {
        await emailService.sendVerificationOtpEmail(
          user.email,
          user.firstName,
          otp
        );
      } catch (error) {
        verificationEmailSent = false;
        logger.error('Verification email failed after registration', {
          userId: user._id,
          cause: error.message,
        });
      }

      return { user, tokens, verificationEmailSent };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async login({ email, password }) {
    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user || !(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    assertActiveUser(user);

    const tokens = generateTokens(user._id);
    user.lastLoginAt = new Date();
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    return { user, tokens };
  },

  async verifyEmail(userId, otp) {
    const user = await User.findById(userId).select(
      '+emailVerificationOtp +emailVerificationExpires +emailVerificationAttempts'
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    assertActiveUser(user);

    if (user.isEmailVerified) {
      return { user, alreadyVerified: true };
    }

    if (
      !user.emailVerificationOtp ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw ApiError.badRequest(
        'Verification code has expired. Please request a new one.'
      );
    }

    if (
      user.emailVerificationAttempts >= EMAIL_VERIFICATION.MAX_VERIFY_ATTEMPTS
    ) {
      throw ApiError.tooManyRequests(
        'Too many invalid attempts. Please request a new verification code.'
      );
    }

    if (!compareOtp(otp, user.emailVerificationOtp)) {
      user.emailVerificationAttempts += 1;
      await user.save({ validateBeforeSave: false });

      throw ApiError.badRequest('Invalid verification code');
    }

    user.isEmailVerified = true;
    clearVerificationOtp(user);
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (error) {
      logger.error('Welcome email failed after verification', {
        userId: user._id,
        cause: error.message,
      });
    }

    return { user, alreadyVerified: false };
  },

  async resendVerification(userId) {
    const user = await User.findById(userId).select(
      '+emailVerificationSentAt +emailVerificationAttempts'
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    assertActiveUser(user);

    if (user.isEmailVerified) {
      throw ApiError.badRequest('Email is already verified');
    }

    if (user.emailVerificationSentAt) {
      const cooldownEndsAt =
        user.emailVerificationSentAt.getTime() +
        EMAIL_VERIFICATION.RESEND_COOLDOWN_MS;

      if (Date.now() < cooldownEndsAt) {
        const secondsLeft = Math.ceil((cooldownEndsAt - Date.now()) / 1000);

        throw ApiError.tooManyRequests(
          `Please wait ${secondsLeft} seconds before requesting a new code`
        );
      }
    }

    await issueAndSendVerificationOtp(user);

    return { user };
  },

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token required');
    }

    let decoded;

    try {
      decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    assertActiveUser(user);

    const tokens = generateTokens(user._id);
    await persistRefreshToken(user, tokens.refreshToken);

    return { user, tokens };
  },

  async logout(userId, res) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    clearTokenCookies(res);
  },

  setTokenCookies,
};
