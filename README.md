# Avora

AI career assistant for people with disabilities.

![Node](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-local%20MVP-0ea5e9)

Avora is a web platform that helps people with disabilities explore career paths, discover strengths, practice interviews, build learning roadmaps, and get accessibility-aware job guidance.

## Current Status

This repository is currently around:

- **80% complete** for a local demo / MVP.
- **65-70% complete** for a public MVP.
- **50-55% complete** compared with a polished commercial product.

The project started from an estimated **50% complete** state and has been improved into a working local MVP with authentication, persistent demo users, AI chat fallback, production configuration, and clearer GitHub documentation.

## What Has Been Improved

- Email register, login, forgot password, and reset password now work locally.
- Demo users persist after restarting the API.
- Demo passwords are hashed with bcrypt instead of being stored as plain text.
- User profile and saved jobs in demo mode are persisted to local JSON.
- Added Avora AI floating chat widget after login.
- Added `/api/ai/status` to check whether real AI provider keys are configured.
- Added OpenAI and Azure OpenAI environment support.
- Added demo fallback mode when no real AI key is configured.
- Improved Vietnamese fallback responses for Avora AI.
- Improved auth error messages, including clearer API network errors.
- Improved landing page hero UI and fixed broken AI image/avatar icons.
- Updated `.env.example`, Docker, Vercel, and production checklist.
- Added auth smoke test for register, login, profile, forgot password, reset password, and login after reset.
- Verified API and web typecheck/build.

## Known Limitations

- The AI is not fully intelligent until `OPENAI_API_KEY` or Azure OpenAI keys are configured.
- Supabase production auth/database is prepared but still needs real project keys and schema verification.
- Some pages still contain mock/demo content, especially Dashboard, Confidence, Partners, and some landing sections.
- Some lower sections of the UI still need Vietnamese/English consistency cleanup.
- Browser-based UI tests should be expanded with Playwright or another real browser e2e tool.
- Public deployment still needs real domains, CORS values, Supabase redirect URLs, and production environment variables.
- Mobile app and some Azure infrastructure targets are not fully production-ready.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Zustand, React Router
- **Backend**: Node.js 20, Express, TypeScript
- **AI**: OpenAI or Azure OpenAI, with local fallback mode
- **Auth/Data**: Supabase for production, local JSON fallback for demo mode
- **Tooling**: pnpm workspaces, Turbo, Docker, Vercel config

## Project Structure

```text
Avora-main/
|-- apps/
|   |-- web/                 # React web app
|   `-- mobile/              # React Native / Expo app
|-- packages/
|   `-- shared/              # Shared types and constants
|-- services/
|   |-- api-gateway/         # Express API
|   `-- ai-service/          # AI agent service
|-- tests/
|   `-- e2e/                 # Smoke tests
|-- docs/
|   `-- production-checklist.md
|-- infra/                   # Azure/Terraform/Bicep infrastructure
|-- .env.example
|-- docker-compose.yml
|-- package.json
`-- pnpm-workspace.yaml
```

## Requirements

- Node.js 20 or newer
- pnpm 9.15.4
- PowerShell on Windows, or any terminal on macOS/Linux

Enable pnpm with Corepack:

```powershell
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

If Windows has registry certificate errors, run commands with:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
```

## Installation

```powershell
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
pnpm install
```

Create local environment file:

```powershell
Copy-Item .env.example .env
```

For local demo mode, you can run without Supabase and without OpenAI keys. The app will use local demo auth and fallback AI.

## Environment Variables

Main variables for local development:

```env
NODE_ENV=development
PORT=4000
JWT_SECRET=change-this-secret
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
DEMO_DATA_FILE=./data/demo-db.json

VITE_API_URL=http://localhost:4000
VITE_APP_NAME=Avora
AI_ENABLE_DEMO_FALLBACK=true
```

To use real AI, choose one provider.

OpenAI:

```env
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Azure OpenAI:

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

For production, configure Supabase:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Running Locally

Open terminal 1:

```powershell
cd D:\Avora-main\Avora-main
pnpm --filter @ai4a/api-gateway dev
```

Open terminal 2:

```powershell
cd D:\Avora-main\Avora-main
pnpm --filter @ai4a/web dev
```

Then open:

```text
http://localhost:3000
```

Health check:

```powershell
Invoke-WebRequest http://localhost:4000/health
```

AI status:

```powershell
Invoke-WebRequest http://localhost:4000/api/ai/status
```

## Demo Auth Flow

In local demo mode:

1. Open `http://localhost:3000`.
2. Click register.
3. Create an account.
4. Log out.
5. Log in again.
6. Test forgot password and reset password.
7. Restart API.
8. Log in again with the same account.

Demo users are saved in:

```text
services/api-gateway/data/demo-db.json
```

This runtime file is ignored by Git.

## Useful Commands

```powershell
# Typecheck API
pnpm --filter @ai4a/api-gateway typecheck

# Typecheck web
pnpm --filter @ai4a/web typecheck

# Build API
pnpm --filter @ai4a/api-gateway build

# Build web
pnpm --filter @ai4a/web build

# Run auth smoke test
pnpm test:e2e:auth
```

## Production Checklist

See:

```text
docs/production-checklist.md
```

Recommended deployment:

- Web: Vercel or Netlify
- API: Render, Railway, Fly.io, Azure App Service, or another long-running Node host
- Auth/database: Supabase
- AI: OpenAI or Azure OpenAI

Before public release:

- Set `VITE_API_URL` to the deployed API URL.
- Set `CORS_ORIGIN` and `FRONTEND_URL` to the deployed web URL.
- Configure Supabase OAuth redirect URLs.
- Confirm `/health` returns OK.
- Confirm `/api/ai/status` reports `configured: true`.
- Set `AI_ENABLE_DEMO_FALLBACK=false` after real AI keys work.

## Main API Endpoints

```text
GET  /health
GET  /api/ai/status
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/users/profile
PUT  /api/users/profile
POST /api/ai/chat
POST /api/assessments
POST /api/assessments/:id/message
PUT  /api/assessments/:id/complete
GET  /api/jobs
POST /api/jobs/:id/analyze
POST /api/roadmaps
POST /api/interviews
```

## Handoff Notes For The Next Team

Priority order:

1. Configure Supabase production auth/database.
2. Configure real OpenAI or Azure OpenAI.
3. Remove or replace mock content in Dashboard, Confidence, Partners, and lower landing sections.
4. Add full browser e2e tests.
5. Deploy web and API.
6. Test on mobile screen sizes and with accessibility settings.

## License

MIT
