import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

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
import { dashboardRouter } from './routes/dashboard.routes.js';
import { agentMemoryRouter } from './routes/agent-memory.routes.js';
import { speechToTextRouter } from './routes/speech-to-text.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiLimiter, getRateLimitStoreStatus } from './middleware/rate-limit.middleware.js';
import { getOptionalSupabaseAdmin, hasSupabaseConfig } from './utils/supabase.js';
import { AIService } from './services/ai.service.js';

const app: Express = express();
const PORT = process.env.PORT || 4000;
const readinessAiService = new AIService();
const SUPABASE_READINESS_TIMEOUT_MS = Number(process.env.SUPABASE_READINESS_TIMEOUT_MS || 3500);

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

if (process.env.DEBUG_API_REQUESTS === 'true') {
  app.use('/api', (req, res, next) => {
    const startedAt = Date.now();
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    res.on('finish', () => {
      logger.info('api-request', {
        requestId,
        endpoint: `${req.method} ${req.originalUrl}`,
        timestamp: new Date(startedAt).toISOString(),
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });
    next();
  });
}

app.use('/api/', apiLimiter);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', async (_req, res) => {
  const ai = readinessAiService.getStatus();
  const supabase = getOptionalSupabaseAdmin();
  const isProduction = process.env.NODE_ENV === 'production';
  let database = {
    ok: !isProduction || hasSupabaseConfig(),
    configured: hasSupabaseConfig(),
    mode: hasSupabaseConfig() ? 'supabase' : 'demo',
    message: hasSupabaseConfig()
      ? 'Supabase configured'
      : 'Using demo/local persistence. Configure Supabase before public production.',
  };

  if (supabase) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SUPABASE_READINESS_TIMEOUT_MS);

    try {
      const { error } = await supabase
        .from('profiles')
        .select('id', { head: true, count: 'exact' })
        .limit(1)
        .abortSignal(controller.signal);

      database = {
        ok: !error,
        configured: true,
        mode: 'supabase',
        message: error ? error.message : 'Supabase reachable',
      };
    } catch (error) {
      database = {
        ok: false,
        configured: true,
        mode: 'supabase',
        message:
          error instanceof Error && error.name === 'AbortError'
            ? `Supabase readiness check timed out after ${SUPABASE_READINESS_TIMEOUT_MS}ms`
            : error instanceof Error
              ? error.message
              : 'Supabase readiness check failed',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  const checks = {
    api: { ok: true },
    database,
    ai: {
      ok: ai.configured || ai.fallbackEnabled,
      provider: ai.provider,
      configured: ai.configured,
      fallbackEnabled: ai.fallbackEnabled,
      model: ai.model,
      missingEnv: ai.missingEnv,
    },
    rateLimit: getRateLimitStoreStatus(),
  };

  const ok = checks.api.ok && checks.database.ok && checks.ai.ok;
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    checks,
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/assessments', assessmentsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/roadmaps', roadmapsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/agent-memory', agentMemoryRouter);
app.use('/api/speech-to-text', speechToTextRouter);
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
