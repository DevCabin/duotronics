# Changelog

All notable changes to Duotronics. Commit messages remain minimal; context lives here.

## [Unreleased]

### Added
- **Reset configuration button** — Added `DELETE /api/session` and a "Change providers / reset config" link on the intake screen so users can return to the provider setup wizard. Works for both dev-mode in-memory config and Supabase persisted config.
- **Client-side stage logging** — `page.tsx` now logs each pipeline stage transition to the browser console so live Vercel testing doesn't require dashboard log access.
- **Non-blocking result save** — `/api/pipeline` no longer fails the whole request when the Supabase `sessions`/`results` insert fails. It returns the LLM output with a `saveError` warning, disables rating, and shows the error in the UI.

- **About page model strategy section** — Added a "Model Strategy" section to `/about` (`app/about/ModelStrategy.tsx`) explaining the Cheap Left / Capable Right pairing and showing the per-provider model table.

### Fixed
- **Anthropic model retirement** — Right Hemi Anthropic model moved from `claude-sonnet-4-5` to `claude-sonnet-4-5-latest` after Anthropic retired `claude-sonnet-4-20250514` (June 15, 2026). Left Hemi Anthropic uses the valid snapshot `claude-3-5-haiku-20241022`.
- **DEVELOPER.md hemisphere wording** — Aligned "The Pipeline" stage descriptions with README roles (Left analytical vs Right creative/refine-not-replace) and fixed header typo. Docs-only, no app code touched.
- **Auth login/signup hardening (Failed to fetch)** — `Auth.tsx` now wraps the full email flow in try/catch, guards rate-limit fetches so cold-starts don't block auth, and maps `Failed to fetch` to an actionable Vercel/Supabase config message. `supabase.ts` logs a clear error when `NEXT_PUBLIC_*` vars are missing. Added `middleware.ts` session refresh (was missing, caused silent 401s after token expiry). `/auth/callback` surfaces exchange errors via `?auth_error=`. `page.tsx` init/handleAuth now guard fetch failures. Live-only fix; no local `.env` changes.
- **Auth SMTP error mapping + Resend confirmation** — `Auth.tsx` maps `Error sending confirmation email` (Supabase 500 via custom SMTP) to actionable Supabase SMTP/SendGrid guidance, adds a `Resend confirmation` button (`auth.resend type: signup`). `.gitignore` now covers `sendgrid.env`/`*.env` so the local SendGrid key can't be committed.

### Changed
- **Simplified dual-hemisphere pipeline** — Reduced the core flow from 6+ sequential LLM calls to 3–4 calls: Left analyze → Right accuracy check/re-process → Right humanize → Final approval. Removed Left self-check, reasoning stub, Right self-check, preflight scan, and triage recursion. Right Hemi now returns JSON with `accurate`/`confidence_score`/`response`; re-runs once if confidence is below 85. Added per-stage `console.log` instrumentation. Updated `PipelineProgress` stage list and `page.tsx` subtitles to match.
- **Tiered model selection by hemisphere** — Added `LEFT_MODELS` and `RIGHT_MODELS` maps in `providers.ts` and wired them into `/api/pipeline`. Left Hemisphere now uses cheap-but-capable chat models (`claude-3-5-haiku-20241022`, `gpt-4o-mini`, `gemini-2.0-flash`, `moonshot-v1-8k`, `grok-2-mini`). Right Hemisphere uses highly capable, non-frontier models (`claude-sonnet-4-5-latest`, `gpt-4o`, `gemini-2.5-flash`, `moonshot-v1-32k`, `grok-2-1212`). `DEFAULT_MODELS` is retained as a fallback for direct `callProvider()` usage.

## [0.3.1] - 2025-06-07

### Added
- Progressive rate limiting on authentication
  - 3 attempts → 5 min lockout
  - 3 more → 10 min lockout
  - 3 more → 30 min lockout
  - 4th lockout shows "peer review" contact message with email link
- Auth callback handler (`/auth/callback`) for email verification redirects
- Dynamic email redirect URL based on `window.location.origin`

- **About page model strategy section** — Added a "Model Strategy" section to `/about` (`app/about/ModelStrategy.tsx`) explaining the Cheap Left / Capable Right pairing and showing the per-provider model table.

### Fixed
- **Anthropic model retirement** — Right Hemi Anthropic model moved from `claude-sonnet-4-5` to `claude-sonnet-4-5-latest` after Anthropic retired `claude-sonnet-4-20250514` (June 15, 2026). Left Hemi Anthropic uses the valid snapshot `claude-3-5-haiku-20241022`.
- Email verification links now redirect to production URL instead of localhost

## [0.3.0] - 2025-06-07

### Added
- Space Age '70s theme implementation
  - Cream background (#F2EDE0) with grain texture overlay
  - Barlow Condensed (display) + Barlow (body) typography
  - Dual swoosh decorations: top-right (orange→teal), bottom-left (teal→orange)
  - Card accents with 4px top borders in hemisphere colors
  - Uppercase, letter-spaced buttons per template spec
- Dev mode bypass for local development
  - Skip auth button appears only in development
  - In-memory config store (no Supabase required for local testing)
  - `x-dev-bypass` header for API routes
- Vercel deployment documentation in README

### Changed
- Migrated from Tailwind to custom CSS architecture
  - `space-age-general.css` — base theme variables and components
  - `duotronics-theme.css` — hemisphere-specific overrides
  - `globals.css` — app utilities + variable bridging
- Provider color scheme: orange (left/analytical), teal (right/creative), violet (synthesis)

## [0.2.0] - 2025-06-06

### Added
- Pipeline retry logic with triage protocol
  - Pre-flight scan checks: sanity, balance, quality
  - Max 1 retry enforced (hard limit in `pipeline.ts`)
  - Fault origin tracking (left/right/ambiguous)
- Self-check stages for both hemispheres
  - Left self-checks before handoff
  - Right self-checks before pre-flight
- Encrypted API key storage
  - AES-256-GCM encryption (server-side only)
  - Keys never exposed to client
- Supabase schema migrations
  - `user_config` table for provider preferences
  - `sessions` table for query history
  - `results` table for pipeline outputs
  - `low_rated_results` view for ratings ≤ 2

### Changed
- Provider abstraction unified in `providers.ts`
  - Supports: Anthropic, OpenAI, Google, Moonshot, xAI
  - All LLM calls route through `callProvider()`
  - Dynamic imports for tree-shaking

- **About page model strategy section** — Added a "Model Strategy" section to `/about` (`app/about/ModelStrategy.tsx`) explaining the Cheap Left / Capable Right pairing and showing the per-provider model table.

### Fixed
- **Anthropic model retirement** — Right Hemi Anthropic model moved from `claude-sonnet-4-5` to `claude-sonnet-4-5-latest` after Anthropic retired `claude-sonnet-4-20250514` (June 15, 2026). Left Hemi Anthropic uses the valid snapshot `claude-3-5-haiku-20241022`.
- Left/Right provider validation
  - UI blocks selection of same provider
  - API enforces constraint with 400 error
- Auth callback handling for OAuth providers

## [0.1.0] - 2024-06-06

### Added
- Initial Next.js 14 scaffold with App Router
- Supabase auth (Google, GitHub, email)
- Basic wizard flow: Left provider → Right provider → Confirm
- Pipeline execution (6 stages)
- Results display with star rating
- Session persistence

---

## Commit Message Conventions

Keep commits minimal. Examples:
- `feat: add triage retry limit`
- `fix: provider validation bypass`
- `style: swoosh opacity 0.35`
- `refactor: extract dev-store`

Detailed context → this CHANGELOG.
Architectural decisions → DEVELOPER.md.