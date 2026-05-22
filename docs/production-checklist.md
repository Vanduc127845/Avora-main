# Avora Production Checklist

Use this checklist before publishing Avora.

## Local verification

1. Install dependencies:

   ```powershell
   pnpm install --frozen-lockfile
   ```

2. Start the API and web app in two terminals:

   ```powershell
   pnpm --filter @ai4a/api-gateway dev
   pnpm --filter @ai4a/web dev
   ```

3. Run the auth smoke test:

   ```powershell
   pnpm test:e2e:auth
   ```

The smoke test loads `/login` and `/register`, creates an account, signs in, loads the profile, requests a password reset, updates the password when demo reset tokens are enabled, and signs in again.

4. With API and web running, run the career workflow smoke test:

   ```powershell
   pnpm test:e2e:career
   ```

This verifies the selected-job flow: job fit analysis, roadmap creation, and mock interview creation.

5. After installing Playwright browsers, run the browser accessibility smoke test:

   ```powershell
   pnpm --filter @ai4a/tests exec playwright install chromium
   pnpm test:e2e:browser
   ```

This loads Dashboard, Profile, Assessment, Jobs, Roadmaps, Interviews, Confidence, and Simulation with reduced motion enabled, checks keyboard focus, validates that icon buttons have accessible names, and fails on console errors.

## Required production environment

API:

```env
NODE_ENV=production
PORT=4000
JWT_SECRET=<long-random-secret>
CORS_ORIGIN=https://your-web-domain.com
FRONTEND_URL=https://your-web-domain.com
AUTH_PASSWORD_RESET_DRY_RUN=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_ANON_KEY=<anon-key>
API_RATE_LIMIT_MAX=600
AI_RATE_LIMIT_MAX=30
AI_ACTION_RATE_LIMIT_MAX=20
RATE_LIMIT_STORE=redis
REDIS_URL=rediss://:<password>@<redis-host>:6380
AI_PROVIDER_MAX_RETRIES=1
AI_PROVIDER_RETRY_BASE_MS=700
AI_PROVIDER_RETRY_MAX_MS=2500
DEBUG_API_REQUESTS=false
RESEND_API_KEY=<resend-key>
PARTNER_EMAIL_TO=partnerships@your-domain.com
```

Web:

```env
VITE_API_URL=https://your-api-domain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_NAME=Avora
```

AI provider, choose one:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_DEPLOYMENT=<deployment-name>
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

or:

```env
OPENAI_API_KEY=<key>
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Set this after provider keys are confirmed so production does not silently use demo AI:

```env
AI_ENABLE_DEMO_FALLBACK=false
```

Before connecting production traffic, run `infra/supabase/free-mvp-schema.sql` in Supabase SQL editor. It creates the production tables for profiles, saved jobs, assessments, roadmap/interview data, and per-agent memory. The schema enables row-level security for user-owned tables; the API uses the service role key only on the backend.

Check AI status after deploy:

```powershell
Invoke-WebRequest https://your-api-domain.com/api/ai/status
```

Check readiness after deploy:

```powershell
Invoke-WebRequest https://your-api-domain.com/ready
```

Production readiness should report:

- `database.mode = "supabase"` and `database.ok = true`.
- `ai.configured = true`.
- `rateLimit.activeStore = "redis"` when `RATE_LIMIT_STORE=redis`.

Agent memory privacy endpoints:

```powershell
Invoke-WebRequest https://your-api-domain.com/api/agent-memory -Headers @{ Authorization = "Bearer <token>" }
Invoke-WebRequest https://your-api-domain.com/api/agent-memory/profile -Method DELETE -Headers @{ Authorization = "Bearer <token>" }
Invoke-WebRequest https://your-api-domain.com/api/agent-memory -Method DELETE -Headers @{ Authorization = "Bearer <token>" }
```

Use these endpoints to inspect or delete long-term per-agent memory. Product UI should expose the same controls before public launch.

## Demo data persistence

Without Supabase, local demo accounts are saved to:

```env
DEMO_DATA_FILE=./data/demo-db.json
```

This path is relative to the API process working directory. It is for local demos only. Serverless hosts do not keep writable files reliably, so public production should use Supabase for users, profiles, OAuth, and password recovery.

## Deployment shape

Recommended split:

- Web app: Vercel or Netlify, build command `pnpm build:web`, output `apps/web/dist`.
- API gateway: Render, Railway, Fly.io, Azure App Service, or another long-running Node host. Start command: `pnpm --filter @ai4a/api-gateway start` after `pnpm --filter @ai4a/api-gateway build`.
- Database/auth: Supabase.
- Rate limiting: Redis-backed express rate-limit on the API host.
- AI: Azure OpenAI or OpenAI with the env above.
- Monitoring: host logs plus `/health`, `/ready`, and provider-specific dashboards. For a public launch, connect Render/Railway/Azure logs to Sentry, Logtail, Datadog, or Application Insights.

Before opening to users, confirm:

- `/health` returns `{ "status": "ok" }`.
- `/ready` returns `status: "ok"` with Supabase, AI, and Redis checks.
- `/api/ai/status` reports `configured: true`.
- Register, login, forgot password, and reset password work from the deployed web domain.
- Partner inquiry form sends an email to `PARTNER_EMAIL_TO`. If email delivery is intentionally disabled for a demo, set `PARTNER_INQUIRY_DRY_RUN=true` and confirm the API returns `delivery: "dry-run"`.
- OAuth redirect URLs in Supabase include both `https://your-api-domain.com/api/auth/oauth/google/callback`, `https://your-api-domain.com/api/auth/oauth/microsoft/callback`, and the final frontend callback `https://your-web-domain.com/auth/callback`.
- `CORS_ORIGIN` contains the deployed web domain exactly.
- `pnpm test:e2e:career` passes against the deployed API/web URLs using `API_URL` and `WEB_URL`.
- Browser accessibility checks pass for keyboard navigation, focus states, labels, reduced motion, and contrast. Automated checks are a baseline; verify at least one flow with NVDA, Narrator, or VoiceOver before launch.
