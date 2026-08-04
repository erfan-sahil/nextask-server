import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { ApiError } from './utils/ApiError.js';
import routes from './routes/index.js';
import {
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
} from './middlewares/common/error.middleware.js';
import { requestLogger } from './middlewares/common/morgan.middleware.js';

const app = express();

app.set('trust proxy', 1);

app.use(requestIdMiddleware);
app.use(requestLogger);

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    // Failed auth/validation responses should not burn the SPA budget.
    skipFailedRequests: true,
    // Avoid express-rate-limit ValidationError crashes behind local proxies.
    validate: {
      xForwardedForHeader: false,
    },
    handler: (_req, _res, next) => {
      next(ApiError.tooManyRequests());
    },
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
