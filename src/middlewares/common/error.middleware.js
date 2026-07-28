import { randomUUID } from 'crypto';
import { env } from '../../config/env.js';
import { ERROR_CODES } from '../../constants/errorCodes.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../utils/logger.js';
import { normalizeError } from '../../utils/normalizeError.js';

export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

const buildErrorResponse = ({ message, errors, errorCode, requestId, stack }) => ({
  success: false,
  message,
  errorCode,
  ...(errors.length > 0 && { errors }),
  ...(requestId && { requestId }),
  ...(!env.isProduction && stack && { stack }),
});

export const errorHandler = (err, req, res, _next) => {
  const normalized = normalizeError(err);

  let { statusCode, message, errors, errorCode, isOperational } = normalized;

  if (!isOperational && env.isProduction) {
    message = 'Something went wrong. Please try again later.';
    errors = [];
    errorCode = ERROR_CODES.INTERNAL_ERROR;
  }

  logger.error(message, {
    requestId: req.requestId,
    statusCode,
    errorCode,
    method: req.method,
    path: req.originalUrl,
    ...(errors.length > 0 && { errors }),
    ...(!isOperational && { cause: err.message }),
    ...(!env.isProduction && { stack: err.stack }),
  });

  res.status(statusCode).json(
    buildErrorResponse({
      message,
      errors,
      errorCode,
      requestId: req.requestId,
      stack: err.stack,
    })
  );
};

export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
