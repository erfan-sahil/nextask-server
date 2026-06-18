import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
} from '../../controllers/auth/auth.controller.js';
import { authenticate } from '../../middlewares/auth/auth.middleware.js';
import { validate } from '../../middlewares/common/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
} from '../../validations/auth/auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
