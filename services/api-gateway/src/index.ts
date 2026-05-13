import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { logger } from './utils/logger.js';
import { getDemoDataFile, loadDemoData } from './data/demo-persistence.js';

import { authRouter } from './routes/auth.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { assessmentsRouter } from './routes/assessments.routes.js';
import { jobsRouter } from './routes/jobs.routes.js';
import { roadmapsRouter } from './routes/roadmaps.routes.js';
import { interviewsRouter } from './routes/interviews.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { partnersRouter } from './routes/partners.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app: Express = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
    callback(null, allowedOrigins.has(origin) || (process.env.NODE_ENV !== 'production' && isLocalNetwork));
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/roadmaps', roadmapsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/ai', aiRouter);
app.use('/api', partnersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

await loadDemoData();

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    logger.info(`Demo auth persistence file: ${getDemoDataFile()}`);
  }
});

export default app;
