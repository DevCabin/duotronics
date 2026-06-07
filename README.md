# Duotronics

Dual hemisphere AI processing — an experiment in model synthesis.

_A research project by [DevCabin](https://github.com/DevCabin)_

## Quick Start

```bash
npm install
cp .env.local.example .env.local
# Add your Supabase credentials + encryption secret
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Skip auth (dev mode) → Configure providers → Run pipeline.

## What This Is

Duotronics runs queries through two different LLM providers:

- **Left hemisphere** (analytical): Structure, accuracy, reasoning
- **Right hemisphere** (creative): Warmth, humanity, synthesis

The pipeline: Left analyzes → Left self-checks → Handoff → Right refines → Right self-checks → Pre-flight scan → Results.

## Stack

- Next.js 14 App Router + TypeScript
- Supabase (auth, encrypted API key storage, session persistence)
- Custom CSS theme (Space Age '70s aesthetic)

## Project Conventions

**Minimal commits to GitHub.** Detailed context lives in `CHANGELOG.md`. Commit messages are short: `feat: pipeline retry logic`, `fix: auth redirect`, `style: swoosh opacity`.

See [DEVELOPER.md](./DEVELOPER.md) for architecture walkthrough.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=          # For server-side operations
ENCRYPTION_SECRET=                  # Generate: openssl rand -base64 32
```

## Key Constraints

- Left and Right providers must be different (enforced in UI + API)
- API keys are encrypted server-side (AES-256-GCM)
- Triage retry limit: 1 (hardcoded in `pipeline.ts`)

## Documentation

- [CHANGELOG.md](./CHANGELOG.md) — Detailed version history
- [DEVELOPER.md](./DEVELOPER.md) — Architecture + onboarding guide

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link and deploy
vercel link
vercel --prod
```

**Required Environment Variables on Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENCRYPTION_SECRET`

## IYKYK

- Let's make Dr Daystrom proud
- Maybe we'll win the Zee-Magnees prize
