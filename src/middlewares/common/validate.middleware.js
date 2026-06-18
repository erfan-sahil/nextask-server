import { ZodError } from 'zod';
import { HTTP_STATUS } from '../../constants/httpStatus.js';

export const validate = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    req.body = parsed.body ?? req.body;
    req.query = parsed.query ?? req.query;
    req.params = parsed.params ?? req.params;

    next();
  } catch (error) {
    if (error instanceof ZodError) {
      error.statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    }
    next(error);
  }
};
