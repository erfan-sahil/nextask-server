import { z } from 'zod';

export const objectIdSchema = z
  .string({ required_error: 'Resource ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid resource ID format');

const isValidQueryInt = (value) =>
  typeof value === 'number' ? Number.isInteger(value) : /^[1-9]\d*$/.test(String(value));

const optionalQueryInt = (fieldName, { min = 1, max } = {}) =>
  z
    .union([z.undefined(), z.string(), z.number()])
    .optional()
    .superRefine((value, ctx) => {
      if (value === undefined || value === '') {
        return;
      }

      if (!isValidQueryInt(value)) {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldName} must be a valid whole number greater than or equal to ${min}`,
        });
        return;
      }

      const parsed = Number(value);

      if (parsed < min) {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldName} must be at least ${min}`,
        });
      }

      if (max !== undefined && parsed > max) {
        ctx.addIssue({
          code: 'custom',
          message: `${fieldName} cannot exceed ${max}`,
        });
      }
    })
    .transform((value) => (value === undefined || value === '' ? undefined : Number(value)));

export const paginationQuerySchema = {
  page: optionalQueryInt('Page'),
  limit: optionalQueryInt('Limit', { max: 100 }),
};
