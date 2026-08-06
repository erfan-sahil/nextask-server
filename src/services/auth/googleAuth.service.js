import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AUTH_PROVIDER } from '../../constants/authProvider.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import { PendingRegistration } from '../../models/pending-registration/pendingRegistration.model.js';
import { User } from '../../models/user/user.model.js';
import { emailService } from '../email/email.service.js';
import { addRefreshSession, generateTokens, REFRESH_TOKEN_SELECT } from './auth.service.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const OAUTH_STATE_EXPIRES_IN = '10m';

const assertGoogleConfigured = () => {
  if (!env.google.clientId || !env.google.clientSecret) {
    throw ApiError.serviceUnavailable('Google sign-in is not configured');
  }
};

const sanitizeCallbackUrl = (callbackUrl) => {
  if (typeof callbackUrl !== 'string' || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return '/dashboard';
  }

  return callbackUrl;
};

const buildClientRedirectUrl = (pathname, params = {}) => {
  const url = new URL(pathname, env.clientUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};

const createOAuthState = (callbackUrl) =>
  jwt.sign(
    {
      callbackUrl: sanitizeCallbackUrl(callbackUrl),
      nonce: crypto.randomBytes(16).toString('hex'),
    },
    env.jwt.accessSecret,
    { expiresIn: OAUTH_STATE_EXPIRES_IN }
  );

const parseOAuthState = (state) => {
  if (!state) {
    throw ApiError.badRequest('Invalid Google sign-in state');
  }

  try {
    const payload = jwt.verify(state, env.jwt.accessSecret);
    return {
      callbackUrl: sanitizeCallbackUrl(payload.callbackUrl),
    };
  } catch {
    throw ApiError.badRequest('Google sign-in session expired. Please try again.');
  }
};

const exchangeCodeForTokens = async (code) => {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId,
      client_secret: env.google.clientSecret,
      redirect_uri: env.google.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    logger.error('Google token exchange failed', {
      status: response.status,
      error: data.error,
      description: data.error_description,
    });
    throw ApiError.unauthorized('Google authentication failed');
  }

  return data;
};

const fetchGoogleProfile = async (accessToken) => {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const profile = await response.json();

  if (!response.ok || !profile.sub || !profile.email) {
    logger.error('Google userinfo fetch failed', {
      status: response.status,
      error: profile.error,
    });
    throw ApiError.unauthorized('Unable to load Google account details');
  }

  if (profile.email_verified === false) {
    throw ApiError.forbidden('Google email is not verified');
  }

  return profile;
};

const buildUsernameBase = (email, givenName, familyName) => {
  const localPart = email.split('@')[0] || 'user';
  const fromName = [givenName, familyName].filter(Boolean).join('_');
  const source = fromName || localPart;

  const sanitized = source
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);

  return sanitized.length >= 3 ? sanitized : `user${sanitized}`.slice(0, 24) || 'user';
};

const createUniqueUsername = async (email, givenName, familyName) => {
  const base = buildUsernameBase(email, givenName, familyName);
  let candidate = base;
  let attempt = 0;

  while (await User.exists({ username: candidate })) {
    attempt += 1;
    candidate = `${base}${attempt}`.slice(0, 30);
  }

  return candidate;
};

const splitDisplayName = (profile) => {
  const givenName = profile.given_name?.trim();
  const familyName = profile.family_name?.trim();

  if (givenName || familyName) {
    return {
      firstName: givenName || familyName || 'Google',
      lastName: familyName || (givenName ? 'User' : 'User'),
    };
  }

  const fullName = profile.name?.trim();

  if (fullName) {
    const [firstName, ...rest] = fullName.split(/\s+/);
    return {
      firstName: firstName || 'Google',
      lastName: rest.join(' ') || 'User',
    };
  }

  const localPart = profile.email.split('@')[0] || 'user';

  return {
    firstName: localPart,
    lastName: 'User',
  };
};

const upsertGoogleUser = async (profile) => {
  const googleId = profile.sub;
  const email = profile.email.toLowerCase().trim();
  const { firstName, lastName } = splitDisplayName(profile);
  const avatar = profile.picture || null;

  let user = await User.findOne({ googleId }).select(`+googleId ${REFRESH_TOKEN_SELECT}`);

  if (!user) {
    user = await User.findOne({ email }).select(
      `+googleId +password ${REFRESH_TOKEN_SELECT}`
    );
  }

  if (user) {
    assertActiveUserSafe(user);

    if (user.googleId && user.googleId !== googleId) {
      throw ApiError.conflict('This email is already linked to a different Google account');
    }

    user.googleId = googleId;
    user.isEmailVerified = true;

    if (!user.avatar && avatar) {
      user.avatar = avatar;
    }

    if (user.authProvider === AUTH_PROVIDER.LOCAL && !user.password) {
      user.authProvider = AUTH_PROVIDER.GOOGLE;
    }

    const tokens = generateTokens(user._id);
    user.lastLoginAt = new Date();
    addRefreshSession(user, tokens.refreshToken);
    await user.save({ validateBeforeSave: false });

    await PendingRegistration.deleteOne({ email });

    user.password = undefined;
    user.googleId = undefined;

    return { user, tokens, isNewUser: false };
  }

  const username = await createUniqueUsername(email, firstName, lastName);

  user = new User({
    firstName,
    lastName,
    username,
    email,
    password: null,
    googleId,
    authProvider: AUTH_PROVIDER.GOOGLE,
    avatar,
    isEmailVerified: true,
  });

  const tokens = generateTokens(user._id);
  user.lastLoginAt = new Date();
  addRefreshSession(user, tokens.refreshToken);
  await user.save({ validateBeforeSave: false });

  await PendingRegistration.deleteOne({ email });

  try {
    await emailService.sendWelcomeEmail(user.email, user.firstName);
  } catch (error) {
    logger.error('Welcome email failed after Google sign-in', {
      userId: user._id,
      cause: error.message,
    });
  }

  user.password = undefined;
  user.googleId = undefined;

  return { user, tokens, isNewUser: true };
};

const assertActiveUserSafe = (user) => {
  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('Your account has been suspended');
  }
};

export const googleAuthService = {
  getAuthorizationUrl(callbackUrl) {
    assertGoogleConfigured();

    const state = createOAuthState(callbackUrl);
    const params = new URLSearchParams({
      client_id: env.google.clientId,
      redirect_uri: env.google.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
      access_type: 'online',
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  },

  async handleCallback({ code, state, error }) {
    if (error) {
      throw ApiError.unauthorized(
        error === 'access_denied' ? 'Google sign-in was cancelled' : 'Google sign-in failed'
      );
    }

    if (!code) {
      throw ApiError.badRequest('Google authorization code is missing');
    }

    assertGoogleConfigured();

    const { callbackUrl } = parseOAuthState(state);
    const tokenResponse = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleProfile(tokenResponse.access_token);
    const { user, tokens, isNewUser } = await upsertGoogleUser(profile);

    return { user, tokens, isNewUser, callbackUrl };
  },

  buildSuccessRedirect(callbackUrl, tokens) {
    const url = new URL(buildClientRedirectUrl(sanitizeCallbackUrl(callbackUrl)));

    // Hash keeps tokens out of server logs / Referer while letting the SPA
    // persist Bearer auth when cross-site cookies are blocked.
    if (tokens?.accessToken && tokens?.refreshToken) {
      url.hash = new URLSearchParams({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }).toString();
    }

    return url.toString();
  },

  buildErrorRedirect(message) {
    return buildClientRedirectUrl('/login', {
      error: 'google_auth',
      message,
    });
  },
};
