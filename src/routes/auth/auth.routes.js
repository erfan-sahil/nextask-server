import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  updateProfile,
  changePassword,
  deleteAccount,
  googleAuth,
  googleAuthCallback,
} from '../../controllers/auth/auth.controller.js';
import { authenticate } from '../../middlewares/auth/auth.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from '../../validations/auth/auth.validation.js';

const router = Router();

const verificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests());
  },
});

const authWriteRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests());
  },
});

router.post('/register', authWriteRateLimit, validate(registerSchema), register);
router.post('/login', authWriteRateLimit, validate(loginSchema), login);
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.patch('/password', authenticate, validate(changePasswordSchema), changePassword);
router.delete('/account', authenticate, validate(deleteAccountSchema), deleteAccount);
router.post('/verify-email', verificationRateLimit, validate(verifyEmailSchema), verifyEmail);
router.post(
  '/resend-verification',
  verificationRateLimit,
  validate(resendVerificationSchema),
  resendVerification
);

export default router;
