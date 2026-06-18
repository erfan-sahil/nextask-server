import { env } from '../config/env.js';

const formatMeta = (meta) => (Object.keys(meta).length > 0 ? meta : undefined);

export const logger = {
  error(message, meta = {}) {
    console.error(`[ERROR] ${message}`, formatMeta(meta));
  },

  warn(message, meta = {}) {
    console.warn(`[WARN] ${message}`, formatMeta(meta));
  },

  info(message, meta = {}) {
    if (!env.isProduction) {
      console.info(`[INFO] ${message}`, formatMeta(meta));
    }
  },
};
