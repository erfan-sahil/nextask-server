import { authService } from '../services/auth.service.js';
import { emailService } from '../services/email.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  const { user, tokens } = await authService.register(req.body);

  authService.setTokenCookies(res, tokens);

  await emailService.sendWelcomeEmail(user.email, user.name);

  res.status(201).json(
    ApiResponse.created(
      { user, accessToken: tokens.accessToken },
      'Registration successful'
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

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, res);
  res.json(ApiResponse.ok(null, 'Logged out successfully'));
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(ApiResponse.ok({ user: req.user }));
});
