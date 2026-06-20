import { authService } from '../../services/auth/auth.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { user, tokens, verificationEmailSent } = await authService.register(
    req.body
  );

  authService.setTokenCookies(res, tokens);

  const message = verificationEmailSent
    ? 'Registration successful. Please check your email for the verification code.'
    : 'Registration successful, but we could not send the verification email. Please use resend verification.';

  res.status(201).json(
    ApiResponse.created(
      { user, accessToken: tokens.accessToken, verificationEmailSent },
      message
    )
  );
});

export const login = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.login(req.body);

  authService.setTokenCookies(res, tokens);

  res.json(
    ApiResponse.ok(
      { user, accessToken: tokens.accessToken },
      'Login successful'
    )
  );
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  const { user, tokens } = await authService.refresh(refreshToken);

  authService.setTokenCookies(res, tokens);

  res.json(
    ApiResponse.ok(
      { user, accessToken: tokens.accessToken },
      'Token refreshed successfully'
    )
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
  const { user, alreadyVerified } = await authService.verifyEmail(
    req.user._id,
    req.body.otp
  );

  const message = alreadyVerified
    ? 'Email is already verified'
    : 'Email verified successfully';

  res.json(ApiResponse.ok({ user }, message));
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { user } = await authService.resendVerification(req.user._id);

  res.json(
    ApiResponse.ok(
      { user },
      'A new verification code has been sent to your email'
    )
  );
});
