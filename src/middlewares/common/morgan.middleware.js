import morgan from 'morgan';
import { env } from '../../config/env.js';

morgan.token('body', (req) => {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return '';
  if (!req.body || Object.keys(req.body).length === 0) return '';

  const safeBody = { ...req.body };
  if (safeBody.password) safeBody.password = '***';
  return JSON.stringify(safeBody);
});

const devFormat =
  ':method :url :status :res[content-length] - :response-time ms :body';

const productionFormat = 'combined';

export const requestLogger = morgan(env.isProduction ? productionFormat : devFormat, {
  stream: process.stdout,
});
