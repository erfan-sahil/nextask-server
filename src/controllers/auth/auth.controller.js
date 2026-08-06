import { authService } from '../../services/auth/auth.service.js';
import { googleAuthService } from '../../services/auth/googleAuth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { logger } from '../../utils/logger.js';

const authTokenPayload = (user, tokens) => ({
  user,
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
});

export const register = asyncHandler(async (req, res) => {
  const { email, verificationEmailSent } = await authService.register(req.body);

  const message = verificationEmailSent
    ? 'Registration started. Please check your email for the verification code.'
    : 'We could not send the verification email. Please try registering again.';

  res.status(201).json(ApiResponse.created({ email, verificationEmailSent }, message));
});

export const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.login(req.body);

  authService.setTokenCookies(res, tokens);

  res.json(ApiResponse.ok(authTokenPayload(user, tokens), 'Login successful'));
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  const { user, tokens } = await authService.refresh(refreshToken);

  authService.setTokenCookies(res, tokens);

  res.json(
    ApiResponse.ok(authTokenPayload(user, tokens), 'Token refreshed successfully')
  );
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  await authService.logout(req.user._id, refreshToken, res);
  res.json(ApiResponse.ok(null, 'Logged out successfully'));
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(ApiResponse.ok({ user: req.user }));
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { user, tokens, alreadyVerified } = await authService.verifyEmail(
    req.body.email,
    req.body.otp
  );

  if (tokens) {
    authService.setTokenCookies(res, tokens);
  }

  const message = alreadyVerified
    ? 'Email is already verified'
    : 'Email verified successfully. Your account has been created.';

  res.json(
    ApiResponse.ok(
      {
        user,
        ...(tokens
          ? {
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            }
          : {}),
      },
      message
    )
  );
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = await authService.resendVerification(req.body.email);

  res.json(ApiResponse.ok({ email }, 'A new verification code has been sent to your email'));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);

  res.json(ApiResponse.ok({ user }, 'Profile updated successfully'));
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.body);

  res.json(
    ApiResponse.ok(
      null,
      'Password updated successfully. Please sign in again with your new password.'
    )
  );
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await authService.deleteAccount(req.user._id, req.body.currentPassword, res);

  res.json(ApiResponse.ok(null, 'Account deleted successfully'));
});

export const googleAuth = asyncHandler(async (req, res) => {
  const authorizationUrl = googleAuthService.getAuthorizationUrl(req.query.callbackUrl);
  res.redirect(authorizationUrl);
});

export const googleAuthCallback = asyncHandler(async (req, res) => {
  try {
    const { tokens, callbackUrl } = await googleAuthService.handleCallback({
      code: req.query.code,
      state: req.query.state,
      error: req.query.error,
    });

    authService.setTokenCookies(res, tokens);
    res.redirect(googleAuthService.buildSuccessRedirect(callbackUrl, tokens));
  } catch (error) {
    logger.error('Google OAuth callback failed', {
      cause: error.message,
      statusCode: error.statusCode,
    });

    const message =
      error.isOperational && error.message
        ? error.message
        : 'Google sign-in failed. Please try again.';

    res.redirect(googleAuthService.buildErrorRedirect(message));
  }
});
