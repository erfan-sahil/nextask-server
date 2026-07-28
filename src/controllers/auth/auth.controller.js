import { authService } from '../../services/auth/auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

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

  res.json(ApiResponse.ok({ user, accessToken: tokens.accessToken }, 'Login successful'));
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  const { user, tokens } = await authService.refresh(refreshToken);

  authService.setTokenCookies(res, tokens);

  res.json(
    ApiResponse.ok({ user, accessToken: tokens.accessToken }, 'Token refreshed successfully')
  );
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, res);
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
        ...(tokens ? { accessToken: tokens.accessToken } : {}),
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
