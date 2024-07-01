import { createNodeMiddleware } from '@octokit/webhooks';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { pino } from 'pino';

import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter';
import { openAPIRouter } from '@/api-docs/openAPIRouter';
import errorHandler from '@/common/middleware/errorHandler';
import rateLimiter from '@/common/middleware/rateLimiter';
import requestLogger from '@/common/middleware/requestLogger';
import { env } from '@/common/utils/envConfig';

import { ReportRouter } from './api/report/reportRouter';
import webhooks from './common/middleware/webhooksHandler';

const logger = pino({ name: 'server start' });

const app = express();

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

// Middlewares
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use('/health-check', healthCheckRouter);
app.use('/report', ReportRouter);

app.use('/uploads', express.static(path.join(__dirname, '../' + env.UPLOADS_DIR)));

// Swagger UI
app.use(openAPIRouter);

app.use('/api/github/webhooks', createNodeMiddleware(webhooks, { path: '/' }));

// Error handlers
app.use(errorHandler());

export { app, logger };
