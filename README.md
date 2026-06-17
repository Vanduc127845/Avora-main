# Avora - AI Career Copilot for People with Disabilities

An AI-powered career platform that helps people with disabilities move from self-discovery to accessible job preparation, learning roadmaps, mock interviews, and confidence coaching.

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-20.x-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-18-61BAFB?logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/vite-8-646CFF?logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-submission--ready%20MVP-0ea5e9)

**Live Demo:** [avora-main-web.vercel.app](https://avora-main-web.vercel.app) | **Video Pitch:** coming soon

## Vision

Break down barriers in career exploration and job preparation through AI-powered personalization, accessible content, practical learning plans, and disability-aware support.

Avora is built around one core idea: career tools should adapt to the user, not force every user through the same generic path.

## Key Features

| Feature | Description |
| --- | --- |
| Disability-aware AI | AI agents consider accessibility preferences, work style, disclosure comfort, and support needs. |
| Career assessment | Conversation-based assessment that turns goals, skills, and job targets into practical next steps. |
| Job analysis | Compares a role or job description against the user's profile and highlights skill gaps. |
| Personalized roadmaps | Builds weekly learning plans with concrete outputs and accessible pacing. |
| Smart mock interview | Creates job-specific interview practice with structured feedback and disclosure coaching. |
| Confidence builder | Supports self-esteem, reflection, and progress tracking throughout the career journey. |
| Partner inquiry flow | Lets employers, schools, NGOs, and technology partners contact the Avora team. |
| Local demo fallback | Runs locally without production Supabase or AI keys, while keeping a production path ready. |

## Architecture

```mermaid
flowchart TD
  subgraph Client
    Web[React Web App]
    Mobile[React Native / Expo App]
  end

  subgraph Backend
    API[Express API Gateway]
    Auth[Auth Routes]
    Users[User/Profile Service]
    Jobs[Jobs Service]
    Assessment[Assessment Agent]
    Roadmaps[Roadmap Service]
    Interviews[Interview Service]
    Memory[Agent Memory Service]
  end

  subgraph Data
    Supabase[(Supabase Auth + Postgres)]
    Demo[(Local Demo JSON Store)]
  end

  subgraph AI
    Groq[Groq / Llama 3.3 70B]
    OpenAI[OpenAI]
    AzureOpenAI[Azure OpenAI]
    Fallback[Deterministic Demo Fallback]
  end

  Web --> API
  Mobile --> API
  API --> Auth
  API --> Users
  API --> Jobs
  API --> Assessment
  API --> Roadmaps
  API --> Interviews
  API --> Memory
  Auth --> Supabase
  Users --> Supabase
  Jobs --> Supabase
  Assessment --> Groq
  Assessment --> OpenAI
  Assessment --> AzureOpenAI
  Assessment --> Fallback
  API --> Demo
```

## Current Status

This repository is a submission-ready local MVP. The core web product runs end to end with:

- Email register, login, forgot password, and reset password.
- Local demo persistence for users, profiles, saved jobs, and agent memory.
- Supabase production schema and service-role backend integration.
- AI provider support for Groq (Llama 3.3 70B), OpenAI, and Azure OpenAI with automatic fallback.
- Demo fallback mode when real AI keys are not configured.
- Career assessment, job analysis, roadmaps, mock interviews, confidence coaching, and partner inquiry handling.
- Browser accessibility smoke coverage for desktop and mobile pages.

The hosted hackathon demo is available at [avora-main-web.vercel.app](https://avora-main-web.vercel.app/). The API runs on Render at [avora-main.onrender.com](https://avora-main.onrender.com/health). Public production hardening still requires Redis-backed rate limiting, email delivery keys, and final manual accessibility QA.

## Tech Stack

### Frontend

- Web: React 18, Vite, TypeScript, Tailwind CSS
- State: Zustand, React Query
- Routing: React Router 6
- UI: Lucide icons, custom accessible components
- Mobile: React Native / Expo scaffold

### Backend

- Runtime: Node.js 20
- Framework: Express.js + TypeScript
- Auth: Supabase Auth in production, local JWT demo fallback
- AI: Groq (Llama 3.3 70B), OpenAI, Azure OpenAI, deterministic local fallback
- Email: Resend for partner inquiries
- Rate limiting: memory or Redis-backed express-rate-limit

### Data & Storage

- Production database: Supabase Postgres
- Production auth: Supabase Auth
- Local demo store: JSON file persistence
- Agent memory: Supabase table or local demo store

### Tooling

- Package manager: pnpm 9.15.4
- Monorepo orchestration: Turbo
- Tests: Vitest, Playwright, Node smoke tests
- Deploy targets: Vercel/Netlify for web, Render/Railway/Fly/Azure App Service for API

## Getting Started

### Prerequisites

- Node.js 20 or newer
- pnpm 9.15.4
- PowerShell on Windows, or any shell on macOS/Linux

Enable pnpm with Corepack:

```powershell
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

If Windows has registry certificate errors:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Vanduc127845/Avora-main.git
```

2. Enter the project directory:

```bash
cd Avora-main
```

3. Install dependencies:

```bash
pnpm install --frozen-lockfile
```

4. Create the shared root environment file on Windows:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux, use:

```bash
cp .env.example .env
```

5. Start the API:

```bash
pnpm --filter @ai4a/api-gateway dev
```

6. In a second terminal, start the web app:

```bash
pnpm --filter @ai4a/web dev
```

7. Open:

```text
http://localhost:3000
```

> 💡 **JUDGE'S NOTE: ZERO-CONFIG LOCAL MODE**
>
> You do NOT need production Supabase or AI provider keys to evaluate this project.
>
> Keep `AI_ENABLE_DEMO_FALLBACK=true` and `VITE_ENABLE_OAUTH=false` in the root `.env` file created from `.env.example`.
>
> Avora will use local demo auth, mock data persistence, and fallback AI for the core evaluation flows: career assessment, job analysis, roadmaps, mock interviews, and confidence coaching.

For local demo mode, you can run without Supabase and without AI provider keys. Avora will use local demo auth and fallback AI.

## Fresh Clone Runbook

Use this checklist when someone clones `Avora-main` from GitHub on a new machine.

### What GitHub includes

- Source code for the web app, API gateway, shared package, docs, infra, tests, and workspace config.
- `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `package.json`, and `.env.example`.
- No local-only generated folders such as `node_modules`, `dist`, `.turbo`, or local `.env` secrets. Those are intentionally ignored and regenerated after install/build.

### Step-by-step local run

1. Install Node.js 20 LTS or newer.

2. Enable the pinned pnpm version:

```powershell
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

3. Clone the repository:

```bash
git clone https://github.com/Vanduc127845/Avora-main.git
```

4. Enter the project:

```bash
cd Avora-main
```

5. Install dependencies:

```bash
pnpm install --frozen-lockfile
```

6. Create the local environment file:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

7. Keep these zero-config demo values in `.env`:

```env
VITE_API_URL=http://localhost:4000
VITE_ENABLE_OAUTH=false
VITE_DASHBOARD_DATA_MODE=hybrid
API_DATA_MODE=demo
AI_ENABLE_DEMO_FALLBACK=true
AUTH_PASSWORD_RESET_DRY_RUN=true
PARTNER_INQUIRY_DRY_RUN=true
RATE_LIMIT_STORE=memory
```

Interview microphone transcription works best when the API has `ELEVENLABS_API_KEY`.
Without that key, local/demo users can still type answers and submit them.

8. Start the API in terminal 1:

```powershell
pnpm --filter @ai4a/api-gateway dev
```

9. Confirm the API is alive:

```powershell
Invoke-WebRequest http://localhost:4000/health
```

10. Start the web app in terminal 2:

```powershell
pnpm --filter @ai4a/web dev
```

11. Open the local web app:

```text
http://localhost:3000
```

12. Before sharing or deploying changes, run both production builds:

```powershell
pnpm --filter @ai4a/web build
pnpm --filter @ai4a/api-gateway build
```

### Common local fixes

- If the web app says it cannot connect to the API, make sure terminal 1 is still running and `.env` has `VITE_API_URL=http://localhost:4000`.
- If OAuth buttons are shown before Google/Microsoft providers are configured, set `VITE_ENABLE_OAUTH=false` for local demo mode.
- If Windows has certificate errors during install, run `$env:NODE_OPTIONS='--use-system-ca'` and retry `pnpm install --frozen-lockfile`.
- If a port is already in use, stop the other process first, then restart the API and web terminals.
- The hosted demo can be opened at `https://avora-main-web.vercel.app`. If the Render API is asleep, wake it by opening `https://avora-main.onrender.com/health` once before presenting.

## Configuration

Create one root `.env` file from `.env.example`. The local pnpm commands for the web app, API gateway, and AI service read this shared file. Keep real credentials only in `.env`; Git ignores that file.

### Local demo essentials

```env
NODE_ENV=development
PORT=4000
JWT_SECRET=change-this-secret
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://localhost:3000
DEMO_DATA_FILE=./data/demo-db.json
AUTH_PASSWORD_RESET_DRY_RUN=true

VITE_API_URL=http://localhost:4000
VITE_APP_NAME=Avora
VITE_ENABLE_OAUTH=false
AI_ENABLE_DEMO_FALLBACK=true
PARTNER_INQUIRY_DRY_RUN=true
```

<details>
<summary>⚙️ Click to expand Production Configs (Not required for Hackathon Evaluation)</summary>

### OpenAI provider

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

### Azure OpenAI provider

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### Interview speech-to-text

```env
ELEVENLABS_API_KEY=<elevenlabs-key-with-speech-to-text-access>
SPEECH_TO_TEXT_LANGUAGE_CODE=
SPEECH_TO_TEXT_MAX_AUDIO_BYTES=10485760
```

Leave `SPEECH_TO_TEXT_LANGUAGE_CODE` blank for auto-detect. Set it to `vi` or `en` only when you want to force one language.

### Supabase production

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run `infra/supabase/free-mvp-schema.sql` in the Supabase SQL editor before connecting production traffic.

### Social OAuth providers

Google and Microsoft client secrets are configured in provider dashboards, not in repository files. Follow [docs/oauth-setup.md](docs/oauth-setup.md) after the web app has a deployed URL. Set `VITE_ENABLE_OAUTH=true` only after the enabled Supabase providers have working callback URLs.

### Docker Compose

Docker Compose uses service-specific production files. Before running Docker Compose, create `services/api-gateway/.env.production` and `services/ai-service/.env.production` from `.env.example`, then replace the placeholders. Git ignores these production credential files.

</details>

## Development

Start the API:

```powershell
pnpm --filter @ai4a/api-gateway dev
```

Start the web app:

```powershell
pnpm --filter @ai4a/web dev
```

Open:

```text
http://localhost:3000
```

Health checks:

```powershell
Invoke-WebRequest http://localhost:4000/health
Invoke-WebRequest http://localhost:4000/ready
Invoke-WebRequest http://localhost:4000/api/ai/status
```

## Build

```powershell
# Build all workspaces
pnpm build

# Build shared package
pnpm --filter @ai4a/shared build

# Build web app
pnpm --filter @ai4a/web build

# Build API gateway
pnpm --filter @ai4a/api-gateway build
```

## Test

```powershell
# Unit tests
pnpm --filter @ai4a/tests test

# Auth smoke test
pnpm test:e2e:auth

# Assessment role smoke test
pnpm test:e2e:assessment

# Career workflow smoke test
pnpm test:e2e:career

# Browser accessibility smoke test
pnpm test:e2e:browser
```

The browser accessibility smoke test checks Dashboard, Profile, Assessment, Jobs, Roadmaps, Interviews, Confidence, and Simulation on desktop and mobile viewports.

## Project Structure

```text
Avora-main/
|-- apps/
|   |-- web/                 # React web application
|   `-- mobile/              # React Native / Expo scaffold
|-- packages/
|   `-- shared/              # Shared types, constants, and helpers
|-- services/
|   |-- api-gateway/         # Express API gateway
|   `-- ai-service/          # AI service scaffold
|-- tests/
|   |-- e2e/                 # Node and Playwright smoke tests
|   `-- src/                 # Vitest unit tests
|-- infra/
|   |-- supabase/            # Supabase MVP schema
|   |-- terraform/           # Terraform scaffold
|   `-- bicep/               # Azure Bicep scaffold
|-- docs/
|   |-- oauth-setup.md
|   `-- production-checklist.md
|-- docker-compose.yml
|-- package.json
|-- pnpm-workspace.yaml
`-- README.md
```

## Modules Overview

<details>
<summary>📦 View Detailed Module Overview</summary>

### 1. User Profile & Accessibility

- Multi-step profile onboarding
- Disability profile and accommodation settings
- Work preferences and target roles
- Privacy settings and account controls

### 2. Career Assessment

- Conversation-based assessment
- Role and JD analysis
- Skill gap detection
- Role baseline analysis when the user gives a target role but no JD
- Agent traces for Profile, Jobs, Roadmaps, and Interviews

### 3. Jobs

- Accessible job search
- Job detail pages
- Job fit analysis against user profile
- Save and unsave jobs
- One-click action plan for roadmap and interview creation

### 4. Roadmaps

- Weekly learning phases
- Skill gap driven milestones
- Progress tracking
- Output-focused learning tasks

### 5. Mock Interview

- Job-specific question generation
- AI interviewer turn replies
- Structured answer feedback
- Accessibility-aware interview support

### 6. Confidence

- Reflection prompts
- Confidence coaching
- Local progress history
- Practical next-step support

### 7. Simulation

- Career scenario practice
- Workplace decision prompts
- Reflection history
- Reduced-motion friendly UI

### 8. Partners

- Partner inquiry form
- Backend validation
- Resend email delivery
- Safe dry-run mode for demos

</details>

## API Documentation

<details>
<summary>🔌 View Complete API Documentation</summary>

### Health and readiness

```text
GET /health
GET /ready
GET /api/ai/status
```

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/logout
GET  /api/auth/oauth/:provider
GET  /api/auth/oauth/:provider/callback
```

### Users

```text
GET    /api/users/profile
PUT    /api/users/profile
DELETE /api/users/account
```

### Assessments

```text
POST /api/assessments
GET  /api/assessments/history
GET  /api/assessments/:id
POST /api/assessments/:id/message
PUT  /api/assessments/:id/complete
```

### Jobs

```text
GET    /api/jobs
GET    /api/jobs/saved
GET    /api/jobs/:id
POST   /api/jobs/:id/analyze
POST   /api/jobs/:id/action-plan
POST   /api/jobs/:id/save
DELETE /api/jobs/:id/save
```

### Roadmaps

```text
GET    /api/roadmaps
POST   /api/roadmaps
GET    /api/roadmaps/:id
PUT    /api/roadmaps/:id
DELETE /api/roadmaps/:id
```

### Interviews

```text
GET  /api/interviews
POST /api/interviews
GET  /api/interviews/:id
POST /api/interviews/:id/answer
POST /api/interviews/:id/complete
```

### AI and memory

```text
POST   /api/ai/chat
GET    /api/agent-memory
DELETE /api/agent-memory/profile
DELETE /api/agent-memory
```

### Partners

```text
POST /api/partner-inquiry
```

</details>

## Deployment Guide

### 1 — Deploy the API to Render

1. Go to [render.com](https://render.com) → **New Web Service** → connect `Avora-main` repo.
2. Render detects `render.yaml` automatically and pre-fills all settings.
3. In the Render dashboard **Environment** tab, set the following secrets manually:

| Variable | Value |
|---|---|
| `AI_PROVIDER` | `groq` |
| `GROQ_API_KEY` | your key from [console.groq.com/keys](https://console.groq.com/keys) |
| `CORS_ORIGIN` | `https://avora-main-web.vercel.app` (your Vercel URL) |
| `JWT_SECRET` | any long random string |
| `SUPABASE_URL` | your Supabase project URL (optional – leave blank for demo mode) |
| `SUPABASE_SERVICE_KEY` | your Supabase service role key (optional) |
| `ELEVENLABS_API_KEY` | your ElevenLabs key (optional, for mic transcription) |

4. Click **Deploy**. The health check at `/health` will confirm the API is running.

### 2 — Deploy the Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add Project** → import `Avora-main`.
2. Vercel detects `vercel.json` and sets the correct build/output automatically.
3. In the Vercel **Settings → Environment Variables** tab add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | your Render API URL, e.g. `https://avora-api.onrender.com` |
| `VITE_APP_NAME` | `Avora` |
| `VITE_ENABLE_OAUTH` | `false` (set `true` only after Supabase OAuth is configured) |
| `VITE_DASHBOARD_DATA_MODE` | `hybrid` |
| `VITE_SUPABASE_URL` | your Supabase project URL (optional) |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key (optional) |

4. Click **Deploy**. Visit the preview URL to verify the app loads and can reach the API.

### 3 — Verify deployment

```bash
# API health
curl https://avora-api.onrender.com/health

# AI provider status
curl https://avora-api.onrender.com/api/ai/status

# Readiness (checks AI + DB + rate limit store)
curl https://avora-api.onrender.com/ready
```

---

## Production Checklist

See [docs/production-checklist.md](docs/production-checklist.md).

Before public launch, confirm:

- Web and API are deployed on final domains.
- `CORS_ORIGIN` and `FRONTEND_URL` match the deployed web URL.
- Supabase OAuth redirect URLs are configured.
- Supabase schema has been applied.
- `/health`, `/ready`, and `/api/ai/status` pass.
- `AI_ENABLE_DEMO_FALLBACK=false` after real AI keys work.
- Partner inquiry email delivery works or dry-run mode is explicitly enabled.
- Browser accessibility smoke tests pass.
- At least one primary flow is manually checked with NVDA, Narrator, or VoiceOver.

## License

MIT
