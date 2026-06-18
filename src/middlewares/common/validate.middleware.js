import { ZodError } from 'zod';
import { ApiError } from '../../utils/ApiError.js';

export const validate = (schema) => (req, _res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Express 5: req.query and req.params are read-only — assign body directly, merge the rest.
    if ('body' in parsed) req.body = parsed.body;
    if ('query' in parsed) Object.assign(req.query, parsed.query);
    if ('params' in parsed) Object.assign(req.params, parsed.params);

    next();
  } catch (error) {
    next(error instanceof ZodError ? error : ApiError.badRequest(error.message));
  }
};
