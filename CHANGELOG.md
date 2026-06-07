# Changelog

All notable changes to Duotronics. Commit messages remain minimal; context lives here.

## [Unreleased]

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

### Fixed
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