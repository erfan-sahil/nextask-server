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
} from '../../controllers/auth/auth.controller.js';
import { authenticate } from '../../middlewares/auth/auth.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../../validations/auth/auth.validation.js';

const router = Router();

const verificationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(ApiError.tooManyRequests());
  },
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post(
  '/verify-email',
  verificationRateLimit,
  validate(verifyEmailSchema),
  verifyEmail
);
router.post(
  '/resend-verification',
  verificationRateLimit,
  validate(resendVerificationSchema),
  resendVerification
);

export default router;
