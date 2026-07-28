import { HTTP_STATUS } from '../constants/httpStatus.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export class ApiError extends Error {
  constructor(statusCode, message, errors = [], errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors, ERROR_CODES.BAD_REQUEST);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, [], ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, [], ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, [], ERROR_CODES.NOT_FOUND);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(HTTP_STATUS.CONFLICT, message, [], ERROR_CODES.CONFLICT);
  }

  static tooManyRequests(message = 'Too many requests. Please try again later.') {
    return new ApiError(HTTP_STATUS.TOO_MANY_REQUESTS, message, [], ERROR_CODES.TOO_MANY_REQUESTS);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, [], ERROR_CODES.INTERNAL_ERROR);
  }

  static unprocessableEntity(message = 'Validation failed', errors = []) {
    return new ApiError(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      message,
      errors,
      ERROR_CODES.VALIDATION_FAILED
    );
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      message,
      [],
      ERROR_CODES.SERVICE_UNAVAILABLE
    );
  }
}
