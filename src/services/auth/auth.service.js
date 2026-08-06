import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AUTH_PROVIDER } from '../../constants/authProvider.js';
import { EMAIL_VERIFICATION } from '../../constants/emailVerification.js';
import { env } from '../../config/env.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import { compareOtp, generateOtp, hashOtp } from '../../utils/otp.js';
import { PendingRegistration } from '../../models/pending-registration/pendingRegistration.model.js';
import { User } from '../../models/user/user.model.js';
import { emailService } from '../email/email.service.js';

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });

  const refreshToken = jwt.sign({ id: userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

// Production uses SameSite=None so auth cookies work across
// split hosts (e.g. Vercel frontend + Render API).
const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? 'none' : 'lax',
});

const setTokenCookies = (res, { accessToken, refreshToken }) => {
  const cookieOptions = getAuthCookieOptions();

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
  const cookieOptions = getAuthCookieOptions();
  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
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

const assignVerificationOtp = (record) => {
  const otp = generateOtp();

  record.emailVerificationOtp = hashOtp(otp);
  record.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION.OTP_EXPIRY_MS);
  record.emailVerificationSentAt = new Date();
  record.emailVerificationAttempts = 0;

  return otp;
};

const assertValidOtp = (record, otp) => {
  if (
    !record.emailVerificationOtp ||
    !record.emailVerificationExpires ||
    record.emailVerificationExpires < new Date()
  ) {
    throw ApiError.badRequest('Verification code has expired. Please request a new one.');
  }

  if (record.emailVerificationAttempts >= EMAIL_VERIFICATION.MAX_VERIFY_ATTEMPTS) {
    throw ApiError.tooManyRequests(
      'Too many invalid attempts. Please request a new verification code.'
    );
  }

  if (!compareOtp(otp, record.emailVerificationOtp)) {
    record.emailVerificationAttempts += 1;
    return false;
  }

  return true;
};

const findPendingRegistrationByEmail = (email) =>
  PendingRegistration.findOne({ email }).select(
    '+password +emailVerificationOtp +emailVerificationExpires +emailVerificationAttempts +emailVerificationSentAt'
  );

const assertRegistrationAvailable = async ({ email, username }) => {
  const [existingEmail, existingUsername, pendingEmail, pendingUsername] = await Promise.all([
    User.findOne({ email }),
    User.findOne({ username }),
    PendingRegistration.findOne({ email }),
    PendingRegistration.findOne({ username }),
  ]);

  if (existingEmail) {
    throw ApiError.conflict('Email already registered');
  }

  if (existingUsername) {
    throw ApiError.conflict('Username already taken');
  }

  if (pendingUsername && pendingUsername.email !== email) {
    throw ApiError.conflict('Username already taken');
  }

  return pendingEmail;
};

const issueAndSendVerificationOtp = async (pendingRegistration) => {
  const otp = assignVerificationOtp(pendingRegistration);
  await pendingRegistration.save({ validateBeforeSave: false });
  await emailService.sendVerificationOtpEmail(
    pendingRegistration.email,
    pendingRegistration.firstName,
    otp
  );
};

export const authService = {
  async register({ firstName, lastName, username, email, password }) {
    const existingPending = await assertRegistrationAvailable({
      email,
      username,
    });

    let pendingRegistration = existingPending;

    if (pendingRegistration) {
      pendingRegistration.firstName = firstName;
      pendingRegistration.lastName = lastName;
      pendingRegistration.username = username;
      pendingRegistration.password = password;
    } else {
      pendingRegistration = new PendingRegistration({
        firstName,
        lastName,
        username,
        email,
        password,
      });
    }

    const otp = assignVerificationOtp(pendingRegistration);
    await pendingRegistration.save();

    let verificationEmailSent = true;

    try {
      await emailService.sendVerificationOtpEmail(
        pendingRegistration.email,
        pendingRegistration.firstName,
        otp
      );
    } catch (error) {
      logger.error('Verification email failed during registration', {
        email,
        cause: error.message,
      });
      throw error;
    }

    return { email: pendingRegistration.email, verificationEmailSent };
  },

  async login({ email, password }) {
    const pendingRegistration = await findPendingRegistrationByEmail(email);

    if (pendingRegistration && (await pendingRegistration.comparePassword(password))) {
      throw ApiError.forbidden(
        'Please verify your email before signing in. Check your inbox for the verification code.'
      );
    }

    const user = await User.findOne({ email }).select('+password +refreshToken +googleId');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.password) {
      throw ApiError.unauthorized(
        'This account uses Google sign-in. Please continue with Google.'
      );
    }

    if (!(await user.comparePassword(password))) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    assertActiveUser(user);

    const tokens = generateTokens(user._id);
    user.lastLoginAt = new Date();
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    user.password = undefined;
    user.googleId = undefined;
    return { user, tokens };
  },

  async verifyEmail(email, otp) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return { user: existingUser, alreadyVerified: true, tokens: null };
      }

      throw ApiError.badRequest(
        'This account requires support to complete verification. Please contact support.'
      );
    }

    const pendingRegistration = await findPendingRegistrationByEmail(normalizedEmail);

    if (!pendingRegistration) {
      throw ApiError.notFound(
        'No pending registration found for this email. Please sign up again.'
      );
    }

    const isValidOtp = assertValidOtp(pendingRegistration, otp);

    if (!isValidOtp) {
      await pendingRegistration.save({ validateBeforeSave: false });
      throw ApiError.badRequest('Invalid verification code');
    }

    const session = await mongoose.startSession();
    let user;

    try {
      session.startTransaction();

      user = new User({
        firstName: pendingRegistration.firstName,
        lastName: pendingRegistration.lastName,
        username: pendingRegistration.username,
        email: pendingRegistration.email,
        authProvider: AUTH_PROVIDER.LOCAL,
        isEmailVerified: true,
      });
      user.password = pendingRegistration.password;
      user.$locals.skipPasswordHash = true;

      await PendingRegistration.findByIdAndDelete(pendingRegistration._id, {
        session,
      });

      const tokens = generateTokens(user._id);
      user.refreshToken = tokens.refreshToken;
      await user.save({ session, validateBeforeSave: false });

      await session.commitTransaction();

      try {
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      } catch (error) {
        logger.error('Welcome email failed after verification', {
          userId: user._id,
          cause: error.message,
        });
      }

      return { user, tokens, alreadyVerified: false };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async resendVerification(email) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser?.isEmailVerified) {
      throw ApiError.badRequest('Email is already verified');
    }

    if (existingUser) {
      throw ApiError.badRequest(
        'This account requires support to complete verification. Please contact support.'
      );
    }

    const pendingRegistration = await PendingRegistration.findOne({
      email: normalizedEmail,
    }).select('+emailVerificationSentAt');

    if (!pendingRegistration) {
      throw ApiError.notFound(
        'No pending registration found for this email. Please sign up again.'
      );
    }

    if (pendingRegistration.emailVerificationSentAt) {
      const cooldownEndsAt =
        pendingRegistration.emailVerificationSentAt.getTime() +
        EMAIL_VERIFICATION.RESEND_COOLDOWN_MS;

      if (Date.now() < cooldownEndsAt) {
        const secondsLeft = Math.ceil((cooldownEndsAt - Date.now()) / 1000);

        throw ApiError.tooManyRequests(
          `Please wait ${secondsLeft} seconds before requesting a new code`
        );
      }
    }

    await issueAndSendVerificationOtp(pendingRegistration);

    return { email: pendingRegistration.email };
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

  async updateProfile(userId, { firstName, lastName, username }) {
    const normalizedUsername = username.toLowerCase().trim();
    const usernameInUse = await User.exists({
      _id: { $ne: userId },
      username: normalizedUsername,
    });

    if (usernameInUse) {
      throw ApiError.conflict('Username already taken');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: normalizedUsername,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.password) {
      throw ApiError.badRequest(
        'This account uses Google sign-in and does not have a password. Continue with Google to access your account.'
      );
    }

    if (!(await user.comparePassword(currentPassword))) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    if (await user.comparePassword(newPassword)) {
      throw ApiError.badRequest('New password must be different from your current password');
    }

    user.password = newPassword;
    user.refreshToken = null;
    await user.save();

    return user;
  },

  async deleteAccount(userId, currentPassword, res) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.password) {
      if (!(await user.comparePassword(currentPassword))) {
        throw ApiError.unauthorized('Current password is incorrect');
      }
    } else if (user.authProvider !== AUTH_PROVIDER.GOOGLE) {
      throw ApiError.unauthorized('Unable to delete this account');
    }

    await User.findByIdAndDelete(userId);
    clearTokenCookies(res);
  },

  generateTokens,
  setTokenCookies,
};
