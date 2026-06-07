# Developer Guide

Architecture and onboarding for Duotronics. Read this alongside the codebase.

## Project Structure

```
app/
├── page.tsx                    # Entry point, screen orchestrator
├── layout.tsx                  # Root layout, CSS imports, fonts
├── globals.css                 # App utilities + variable bridging
├── space-age-general.css       # Base theme (colors, typography)
├── duotronics-theme.css        # Hemisphere-specific overrides
├── api/                        # Server routes
│   ├── pipeline/route.ts       # Core pipeline endpoint
│   ├── session/route.ts        # Config GET/POST
│   └── rating/route.ts         # Star rating POST
├── components/                 # React components
│   ├── Auth.tsx                # Login/signup UI
│   ├── wizard/Wizard.tsx       # 3-step provider setup
│   ├── intake/IntakeForm.tsx   # Query input form
│   ├── pipeline/PipelineProgress.tsx  # Stage visualization
│   └── results/Results.tsx     # Output display + rating
├── lib/                        # Core logic
│   ├── providers.ts            # LLM abstraction layer
│   ├── pipeline.ts             # Pipeline execution logic
│   ├── prompts.ts              # System prompts
│   ├── encryption.ts           # AES-256-GCM for API keys
│   ├── dev-store.ts            # In-memory dev config
│   ├── supabase.ts             # Client Supabase client
│   └── supabase-server.ts      # Server Supabase client
└── auth/callback/route.ts      # OAuth callback handler

supabase/migrations/            # Database schema
```

## The Pipeline

The heart of the app. Six stages:

1. **Left analyze** — Left hemisphere processes the query
2. **Left self-check** — Left reviews its own output
3. **Handoff** — Reasoning stub extracted for Right
4. **Right refine** — Right hemisphere warms the output
5. **Right self-check** — Right verifies substance preserved
6. **Pre-flight scan** — Automated quality check (sanity, balance, quality)

If pre-flight fails → triage protocol (max 1 retry).

See `app/lib/pipeline.ts` for implementation.

## Key Files Explained

### `app/lib/providers.ts`
**Never call LLM SDKs directly.** All calls go through `callProvider(config, systemPrompt, userMessage)`.

```typescript
// Good
const output = await callProvider(
  { provider: 'anthropic', apiKey: key },
  LEFT_HEMI_SYSTEM,
  userQuery
)

// Bad - don't do this
const anthropic = new Anthropic({ apiKey })
// ... direct SDK calls
```

Supports: Anthropic, OpenAI, Google, Moonshot, xAI. Easy to add more.

### `app/lib/pipeline.ts`
Core logic. Key constraints:
- `MAX_RETRIES = 1` (hardcoded, don't increase without discussion)
- Left and Right providers must be different
- Returns `PipelineResult` with preflight checks and fault origin

### `app/lib/prompts.ts`
All system prompts live here. If you need to change model behavior, edit prompts here only.

### `app/api/pipeline/route.ts`
API endpoint. Flow:
1. Get user config (dev mode or Supabase)
2. Decrypt API keys (server-side only)
3. Run pipeline
4. Save results to Supabase (or mock in dev)

### `app/page.tsx`
Screen state machine:
```
loading → auth → wizard → intake → processing → results
```

Orchestrates all components via single `screen` state variable.

## Theming

Three CSS files load in this order (see `layout.tsx`):

1. **space-age-general.css** — Base variables (`--cream`, `--orange`, `--teal`, fonts)
2. **duotronics-theme.css** — Hemisphere overrides (`--left`, `--right`, `--synthesis`)
3. **globals.css** — App utilities + bridges old `--dt-*` vars to new theme

Color coding:
- **Orange** (`--left`, `--orange`) — Analytical hemisphere
- **Teal** (`--right`, `--teal`) — Creative hemisphere
- **Violet** (`--synthesis`) — Merged output, accent actions

Typography:
- **Barlow Condensed** — Headings, buttons, labels (uppercase, letter-spaced)
- **Barlow** — Body text, inputs

Visual flourishes:
- Grain texture overlay (subtle noise)
- Dual swoosh decorations (diagonal corners)
- Card top accents (4px colored borders)

## Dev Mode

Local development doesn't need Supabase auth:

```bash
npm run dev
# Click "Skip auth (dev mode)" button
```

How it works:
- `dev-store.ts` — In-memory config (resets on server restart)
- `x-dev-bypass` header — Tells API routes to use dev store
- Config never touches Supabase or disk

## Common Tasks

### Add a new LLM provider

1. Add to `Provider` type in `providers.ts`
2. Add `DEFAULT_MODELS` entry
3. Add `PROVIDER_LABELS` and `PROVIDER_KEY_LINKS`
4. Implement `callXxx()` function
5. Add case to `callProvider()` switch

### Change pipeline behavior

1. Edit prompts in `prompts.ts` (not pipeline logic)
2. If logic change needed, read `pipeline.ts` fully first — design is subtle
3. Test with dev mode before committing

### Update styling

1. Global changes → `space-age-general.css`
2. Hemisphere-specific → `duotronics-theme.css`
3. Component tweaks → inline styles (already using CSS-in-JS)

### Database changes

1. Add migration to `supabase/migrations/`
2. Run migration in Supabase dashboard
3. Document in CHANGELOG

## Important Constraints

| Constraint | Location | Why |
|------------|----------|-----|
| Left ≠ Right providers | `Wizard.tsx`, `session/route.ts` | Core product concept |
| Max 1 retry | `pipeline.ts:46` | Prevents runaway loops |
| Keys encrypted | `encryption.ts` | Security |
| Dev bypass header | All API routes | Local development |

## Debugging

**Pipeline failing silently?** Check browser Network tab → `/api/pipeline` response.

**Auth not working locally?** Use dev mode bypass, or check Supabase credentials in `.env.local`.

**Styles not applying?** Check CSS load order in `layout.tsx` (general → theme → globals).

## Questions?

- Architecture → this doc
- Version history → CHANGELOG.md
- Quick reference → README.md