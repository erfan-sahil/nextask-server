import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { ApiError } from '../../utils/ApiError.js';
import { User } from '../../models/user/user.model.js';

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

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password,
    });

    const tokens = generateTokens(user._id);
    await persistRefreshToken(user, tokens.refreshToken);

    return { user, tokens };
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
