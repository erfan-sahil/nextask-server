import { z } from 'zod';
import { objectIdSchema } from '../common/common.validation.js';

export const REPORT_PERIOD = {
  LAST_WEEK: 'last_week',
  LAST_MONTH: 'last_month',
  LAST_THREE_MONTHS: 'last_three_months',
  LAST_SIX_MONTHS: 'last_six_months',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom',
};

const projectIdsSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((value, ctx) => {
    if (value === undefined || value === '') {
      return [];
    }

    const ids = (Array.isArray(value) ? value : value.split(','))
      .map((id) => id.trim())
      .filter(Boolean);

    for (const id of ids) {
      const parsed = objectIdSchema.safeParse(id);

      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'Each projectId must be a valid resource ID',
        });
        return z.NEVER;
      }
    }

    return [...new Set(ids)];
  });

const optionalDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Date must be a valid ISO date' });
      return z.NEVER;
    }

    return {
      value: date,
      isDateOnly: /^\d{4}-\d{2}-\d{2}$/.test(value),
    };
  });

export const getWorkspaceReportSchema = z.object({
  params: z.object({
    workspaceId: objectIdSchema,
  }),
  query: z
    .object({
      period: z.enum(Object.values(REPORT_PERIOD)).optional(),
      from: optionalDateSchema,
      to: optionalDateSchema,
      projectIds: projectIdsSchema,
    })
    .superRefine((data, ctx) => {
      const isCustomRange = data.period === REPORT_PERIOD.CUSTOM;
      const hasCustomDates = data.from || data.to;

      if (isCustomRange && (!data.from || !data.to)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Custom reports require both from and to dates',
          path: ['from'],
        });
      }

      if (hasCustomDates && (!data.from || !data.to)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Both from and to dates are required together',
          path: ['from'],
        });
      }

      if (data.from && data.to && data.to.value < data.from.value) {
        ctx.addIssue({
          code: 'custom',
          message: 'The to date must be on or after the from date',
          path: ['to'],
        });
      }
    })
    .transform(({ from, to, ...data }) => ({
      ...data,
      from: from?.value,
      to: to?.value,
      toIsDateOnly: to?.isDateOnly ?? false,
    })),
});
