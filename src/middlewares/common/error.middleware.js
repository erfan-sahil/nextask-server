import { ZodError } from 'zod';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  if (err instanceof ZodError) {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = 'Validation failed';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field} already exists`;
  }

  if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid resource ID';
  }

  if (!env.isProduction && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
    ...(!env.isProduction && { stack: err.stack }),
  });
};

export const notFoundHandler = (_req, _res, next) => {
  next(ApiError.notFound('Route not found'));
};
