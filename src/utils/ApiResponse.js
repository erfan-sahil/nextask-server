import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  static ok(data, message = 'Success') {
    return new ApiResponse(HTTP_STATUS.OK, data, message);
  }

  static created(data, message = 'Created successfully') {
    return new ApiResponse(HTTP_STATUS.CREATED, data, message);
  }
}
