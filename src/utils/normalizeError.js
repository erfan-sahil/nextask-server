import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES, getDuplicateFieldMessage } from '../constants/errorCodes.js';
import { ApiError } from './ApiError.js';

const formatZodIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

const formatMongooseValidationErrors = (err) =>
  Object.values(err.errors).map((issue) => ({
    field: issue.path,
    message: issue.message,
  }));

const normalizeMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'File is too large. Maximum allowed size is 5 MB.',
      errors: [],
      errorCode: ERROR_CODES.INVALID_FILE,
      isOperational: true,
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Unexpected file field in upload.',
      errors: [],
      errorCode: ERROR_CODES.INVALID_FILE,
      isOperational: true,
    };
  }

  return {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    message: 'File upload failed. Please try again.',
    errors: [],
    errorCode: ERROR_CODES.INVALID_FILE,
    isOperational: true,
  };
};

export const normalizeError = (err) => {
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
      errorCode: err.errorCode,
      isOperational: true,
    };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      errors: formatZodIssues(err.issues ?? []),
      errorCode: ERROR_CODES.VALIDATION_FAILED,
      isOperational: true,
    };
  }

  if (err instanceof MulterError) {
    return normalizeMulterError(err);
  }

  if (err.name === 'TokenExpiredError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Your session has expired. Please log in again.',
      errors: [],
      errorCode: ERROR_CODES.TOKEN_EXPIRED,
      isOperational: true,
    };
  }

  if (err.name === 'JsonWebTokenError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      message: 'Invalid or expired token',
      errors: [],
      errorCode: ERROR_CODES.UNAUTHORIZED,
      isOperational: true,
    };
  }

  if (err instanceof SyntaxError && err.status === HTTP_STATUS.BAD_REQUEST && 'body' in err) {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Invalid JSON in request body',
      errors: [],
      errorCode: ERROR_CODES.INVALID_JSON,
      isOperational: true,
    };
  }

  if (err.type === 'entity.too.large') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Request body is too large',
      errors: [],
      errorCode: ERROR_CODES.PAYLOAD_TOO_LARGE,
      isOperational: true,
    };
  }

  if (err.name === 'ValidationError') {
    return {
      statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message: 'Validation failed',
      errors: formatMongooseValidationErrors(err),
      errorCode: ERROR_CODES.VALIDATION_FAILED,
      isOperational: true,
    };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];

    return {
      statusCode: HTTP_STATUS.CONFLICT,
      message: field ? getDuplicateFieldMessage(field) : 'Duplicate value already exists',
      errors: field ? [{ field, message: getDuplicateFieldMessage(field) }] : [],
      errorCode: ERROR_CODES.CONFLICT,
      isOperational: true,
    };
  }

  if (err.name === 'CastError') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      message: 'Invalid resource ID',
      errors: [{ field: err.path, message: 'Invalid resource ID' }],
      errorCode: ERROR_CODES.BAD_REQUEST,
      isOperational: true,
    };
  }

  return {
    statusCode: err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: err.message || 'Internal server error',
    errors: err.errors || [],
    errorCode: ERROR_CODES.INTERNAL_ERROR,
    isOperational: Boolean(err.isOperational),
  };
};
