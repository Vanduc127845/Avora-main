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

## Required production environment

API:

```env
NODE_ENV=production
PORT=4000
JWT_SECRET=<long-random-secret>
CORS_ORIGIN=https://your-web-domain.com
FRONTEND_URL=https://your-web-domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
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

Check AI status after deploy:

```powershell
Invoke-WebRequest https://your-api-domain.com/api/ai/status
```

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
- AI: Azure OpenAI or OpenAI with the env above.

Before opening to users, confirm:

- `/health` returns `{ "status": "ok" }`.
- `/api/ai/status` reports `configured: true`.
- Register, login, forgot password, and reset password work from the deployed web domain.
- OAuth redirect URLs in Supabase match `https://your-web-domain.com/auth/callback`.
- `CORS_ORIGIN` contains the deployed web domain exactly.
