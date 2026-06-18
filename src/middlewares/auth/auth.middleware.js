import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../../models/user/user.model.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw ApiError.unauthorized('Access token required');
  }

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw ApiError.forbidden('Your account has been suspended');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw ApiError.unauthorized('Invalid or expired token');
  }
});
