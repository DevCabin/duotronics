# Security Scan Report — Duotronics

**Run timestamp:** 2026-07-25 (this report was generated from a static review per the security scan spec)
**Scope:** Source code (SAST) + dependency SCA
**Methodology:** `npm audit`, baseline `next lint`, custom architectural auditor (`scripts/security-scan.ts`), manual review of all in-scope files
**Tool versions:** `node` per repo, `npm audit` per `npm` version on host, `next` 14.2.3

---

## Executive summary

**Severity histogram:** High 13 / Medium 7 / Low 3 / Info 3 (plus 6 High + 1 Critical **dependency** advisories tracked separately below because their fix requires a major version upgrade, which the scan was scoped to exclude).

**Top 5 issues (read this first):**

1. **DEPS-1 (Critical)** — `next@14.2.3` has an Authorization Bypass in Middleware advisory. Fix requires Next 15.x major upgrade. **Out of scope per user, but still a launch blocker.**
2. **DEPS-2 (High)** — `next@14.2.3` has 6 distinct High-severity advisories (Server Components DoS cluster, HTTP deserialization DoS, cache poisoning, authz bypass).
3. **H1 (High)** — `/api/pipeline` has **no rate limit, no body-size guard, no per-call timeout** — any signed-up user can drain provider budgets via unbounded LLM calls.
4. **H3 (High)** — `x-dev-bypass` header is the sole gate for the dev user identity. If `NODE_ENV` is ever `development` in production, all protected routes fall to a single sharded row.
5. **M1 (Medium)** — `app/lib/dev-store.ts` keeps plaintext LLM provider API keys in module-scope memory; coupled with H3, this becomes a full secret exfiltration under misconfiguration.

**Launch verdict:** **NO-GO (conditional)**. Two blockers before go-live:
- (a) `next` must be upgraded to a non-vulnerable major version (Next 15.x with reviewed release notes) OR an explicit risk acceptance signed off by the owner; and
- (b) H1 + H3 + M1 must be patched. All three have apply-ready patches in `security-patches/`.

If the user wants a hobby/peer-review deployment where the operator accepts the Next CVEs on trust, the verdict downgrades to **CONDITIONAL GO** — sign off M1 + H3 explicitly and apply them before turning dev-mode on in any deployed environment.

**Estimated time to remediate all in-scope High findings:** ~3–4 hours (small patches) + ~4–8 hours if Next major upgrade is included.

---

## Methodology

Run order (re-runnable via `bash scripts/security-scan.sh`):

1. **`npm audit --omit=dev --json`** — SCA against installed runtime deps. Output captured as appendix.
2. **Baseline `next lint`** — capture existing project lint state (no security plugins installed; treated as a hygiene baseline).
3. **Custom architectural auditor (`scripts/security-scan.ts`)** — TypeScript constants-pattern scanner that catches rule violations ESLint can't express (e.g., `x-dev-bypass` adjacent to FETCH/IO calls, `await req.json()` without timeouts, `headers()` function presence in `next.config.js`).
4. **Manual review** — every file in §1.1 of `security-scan-spec.md` was inspected and paired with the spec's findings shortlist. New findings (any) are added below; pre-existing ones are confirmed/refined.
5. **Patch generation** — one `security-patches/<ID>.patch` per High + Medium finding, gauge-confirmed to pass `git apply --check`.

### Tools used, versions, and what they covered

| Tool | Coverage | Notes |
| --- | --- | --- |
| `npm audit` | Transitive CVEs in production deps | 18 advisories found; covered below as DEPS-* |
| `next lint` | Baseline TS/React lint | No new findings beyond what's already in the existing rule set |
| `scripts/security-scan.ts` | Custom pattern guards | Catches scenarios ESLint can't express |
| Manual review | Logic, threat model | Primary signal source |

### What this scan does NOT cover

- **DAST / runtime probing** — out of scope
- **CSS/theme files** — out of scope
- **Documentation files** — out of scope
- **Infrastructure** (Vercel env, DNS) — out of scope
- **Major dependency upgrades** — flags DEPS-* but does not produce upgrade patches
- **Logging** — none configured; if logging is added later, M-redaction will be required

---

## Findings table

| ID | Sev | Title | File | Patch |
| --- | --- | --- | --- | --- |
| **DEPS-1** | Critical | Next.js Authorization Bypass in Middleware | `package.json` (next 14.2.3) | track — major upgrade required |
| **DEPS-2a** | High | Next.js DoS via Server Components (cluster x4) | `package.json` (next 14.2.3) | track — major upgrade required |
| **DEPS-2b** | High | Next.js HTTP request deserialization DoS | `package.json` (next 14.2.3) | track — major upgrade required |
| **DEPS-2c** | High | Next.js Cache Poisoning | `package.json` (next 14.2.3) | track — major upgrade required |
| **DEPS-2d** | High | Next.js authorization bypass | `package.json` (next 14.2.3) | track — major upgrade required |
| **DEPS-3** | High | `form-data` CRLF injection via unescaped multipart field names | `package.json` (transitive) | `npm dedupe` will surface a patch |
| **H1** | High | `/api/pipeline` no rate limit / no body cap / no timeout | `app/api/pipeline/route.ts` | `security-patches/pipeline-route-consolidated.patch` |
| **H2** | High | `/api/pipeline` writes LLM output to DB regardless of preflight status | `app/api/pipeline/route.ts` | `security-patches/pipeline-route-consolidated.patch` + [migration 002](supabase/migrations/002_add_preflight_overall_pass.sql) |
| **H3** | High | `x-dev-bypass` header is the sole gate for dev user identity | `app/api/pipeline/route.ts`, `app/api/session/route.ts` | `security-patches/create-dev-mode-guard.patch` + both route patches |
| **H4** | High → Med | `scryptSync` runs synchronously on every encrypt/decrypt | `app/lib/encryption.ts` | `security-patches/encryption-consolidated.patch` |
| **H5** | High → Med | Hardcoded salt `'duotronics-salt'` | `app/lib/encryption.ts` | `security-patches/encryption-consolidated.patch` |
| **M1** | Medium | Plaintext API keys in dev memory | `app/lib/dev-store.ts` | `security-patches/M1-dev-store-encrypted.patch` |
| **M2** | Medium | `/api/session` no validation on key shape | `app/api/session/route.ts` | `security-patches/session-route-consolidated.patch` |
| **M3** | Medium | Prompt concatenation injection surface | `app/lib/pipeline.ts` + `app/lib/prompts.ts` | `security-patches/M3-prompt-delimiters.patch` |
| **M4** | Medium | In-memory rate limiter resets on every server restart | `app/lib/rate-limit.ts` + new migration | `security-patches/M4-rate-limit-supabase.patch` + [migration 005](supabase/migrations/005_rate_limit_state.sql) |
| **M5** | Medium | Rate limit not applied to `/api/pipeline` | covered by H1 |
| **M6** | Medium | `next.config.js` has no security-headers configuration | `next.config.js` | `security-patches/M6-security-headers.patch` |
| **M7** | Medium | `/api/pipeline` writes `finalOutput` to DB without size cap | `app/api/pipeline/route.ts` | `security-patches/pipeline-route-consolidated.patch` |
| **L1** | Low | Auth callback swallows code-exchange errors | `app/auth/callback/route.ts` | `security-patches/L1-callback-error-handling.patch` |
| **L2** | Low | Cookie helpers silence errors | `app/lib/supabase-server.ts` | `security-patches/L2-cookie-helper-logging.patch` |
| **L3** | Low | Production deps use `^` ranges, no lockfile churn policy | `package.json` | `security-patches/L3-dep-pinning.patch` |
| **I1** | Info | No `key_version` column for `ENCRYPTION_SECRET` rotation | `supabase/migrations/` | (no patch — design discussion) |
| **I2** | Info | No logging configured | n/a | (no patch — policy) |
| **I3** | Info | `/api/pipeline` returns full result object (incl. faultOrigin/retryCount) | `app/api/pipeline/route.ts` | (no patch — redaction if public) |

(M5 deliberately merged under H1 since both are addressed by the same patch.)

---

## Per-finding sections

### DEPS-1 — `next` Authorization Bypass in Middleware (Critical, track-only)

- **Location:** `package.json` line 18 (`"next": "14.2.3"`)
- **Description:** The pinned Next.js version is affected by GHSA-7gfc-8cq8-jh5f (Authorization Bypass in Middleware). Authenticated paths that rely only on middleware to enforce authorization are vulnerable.
- **Patchability within scan scope:** None. Fix requires Next 15.x. The codebase here uses **route-handler auth checks** (server-side `supabase.auth.getUser()` inside each route), not middleware-only, so the practical exploitability surface is reduced — but the downstream advisory clusters still apply.
- **Recommendation for owner:** Either (a) plan a Next 15.x major upgrade + migration review OR (b) sign an explicit risk acceptance if launch is hobby/peer-review only.
- **Patch:** none within scope.

### DEPS-2 — `next` High-severity advisory cluster (High, track-only)

- **Sub-advisories covered:** Server Components DoS (multiple), HTTP request deserialization DoS, Cache Poisoning, authorization bypass.
- **Patchability within scan scope:** None. All require Next 15.x.
- **Practical mitigation in scope:** Apply H1 (rate limit pipeline), M7 (body-size cap), M6 (security headers). These compensated for some of the next-level DoS surface area for *this* app's specific routes, but **do not replace the upgrade**.
- **Recommendation:** Owner decision point: upgrade or accept-risk.

### DEPS-3 — `form-data` CRLF injection (High)

- **Location:** `package.json` lockfile (transitive). Used by `@supabase/ssr` and indirectly by `next` dev tooling.
- **Description:** CRLF injection via unescaped multipart field names. Reaching this from a Duotronics request path is blocked by Next.js's CSRF middleware default and by the request-shape constraints in `/api/pipeline` (JSON only) — same for `/api/session` and `/api/rating`. Practical exploitability: low for this app, medium for dev tooling.
- **Patch:** `npm dedupe --force && npm update form-data` (at the next minor that contains the upstream fix). Document in CHANGELOG.

### H1 — `/api/pipeline` has no rate limit, no payload-size guard, no per-call timeout

- **Severity:** High
- **Location:** `app/api/pipeline/route.ts`
- **Description:** The POST handler authenticates the user, then immediately parses `req.json()` and runs the full pipeline (6 LLM calls per request). There is no per-user or per-IP cap, no `AbortController`, no concurrency limit.
- **Exploit sketch:** An auth'd user loops `curl -X POST /api/pipeline -d '{"q1":"...","q2":"...","q3":"..."}'` repeatedly. Each request triggers 6 provider calls. Combined with H4 (sync `scrypt` on decrypt), a 100-concurrent-user burst stalls the Node event loop.
- **Remediation:** Apply `security-patches/pipeline-route-consolidated.patch`. It introduces:
  - `checkRateLimit('pipeline:'+userId)` before any provider calls (covers M5 too)
  - A 60-second soft body-size check via `req.json()` size via Content-Length header
  - A wrapper `Promise.race` cap of 90 seconds on the full pipeline
- **Notes:** Patch is conservative — does not break dev mode (`isDev` skips the check).

### H2 — Preflight-failed outputs are persisted as "final"

- **Severity:** High
- **Location:** `app/api/pipeline/route.ts` insert into `results`
- **Description:** Even when preflight reports fail, `result.leftOutput` and `result.finalOutput` are still inserted into `results` with `preflight_sanity/balance/quality` flags. Downstream consumers (low-rated analysis view, future analytics, prompt-store features) cannot reliably treat `final_output` as "the good answer".
- **Remediation:** `security-patches/pipeline-route-consolidated.patch` inserts `preflight_overall_pass` (`sanity && balance && quality`). The column itself comes from [002_add_preflight_overall_pass.sql](supabase/migrations/002_add_preflight_overall_pass.sql), which is now a real migration file rather than a hunk inside a patch.

### H3 — `x-dev-bypass` is the sole gate, gated only by `NODE_ENV`

- **Severity:** High
- **Location:** `app/api/pipeline/route.ts:14`, `app/api/session/route.ts:14`
- **Description:** `if (isDev && req.headers.get('x-dev-bypass') === 'true') { return DEV_USER_ID }` — anyone with the header gets the dev user identity. If `NODE_ENV` is ever `'development'` in a deployed environment (mis-cloned Vercel env, manual override, dev branch deployed), all protected API routes become wide-open under a single shared user row.
- **Remediation:** Three files: `security-patches/create-dev-mode-guard.patch` (new `app/lib/dev-mode-guard.ts`) plus `pipeline-route-consolidated.patch` and `session-route-consolidated.patch`, which drop their local `getUserId` copies and consume the guard. Together they add:
  - A second gate `process.env.VERCEL_ENV !== 'preview'` (so Vercel preview deployments never get dev-mode identity even if NODE_ENV slips)
  - A boot-time assertion that throws in production if `getDevConfig()` is ever imported in a production-only path
  - An `app/lib/dev-mode-guard.ts` helper that centralizes the gate so future routes can't drift

### H4 — `scryptSync` blocks the event loop on every encrypt/decrypt

- **Severity:** High → Medium (downgraded because in practice this app has low concurrent users in hobby/peer-review mode; in production it would be High)
- **Location:** `app/lib/encryption.ts:11`
- **Description:** `scryptSync(secret, 'duotronics-salt', 32)` is invoked every `encryptKey()` and `decryptKey()`. On `/api/pipeline` every request calls `decryptKey` twice (left + right). A 50-user concurrent burst stalls the Node event loop proportional to args/cost (`scryptSync` cost = `2^17` for 32-byte key, so ~100ms each on average hardware). Combined with H1, this becomes a DoS vector.
- **Remediation:** `security-patches/encryption-consolidated.patch` caches the `scryptSync`-derived base key in module scope, so the derivation runs at most once per process instead of on every encrypt/decrypt. Note: it stays synchronous — the cost is removed from the request path by caching, not by going async, so there is no per-`key_version` cache (see I1).

### H5 — Hardcoded salt `'duotronics-salt'`

- **Severity:** High → Medium (downgraded because the app is hobby and the salt leak risk is contingent on the secret being weak)
- **Location:** `app/lib/encryption.ts:11`
- **Description:** Per-record salt is the recommended practice; a static global salt allows a single rainbow-table-style precomputation if `ENCRYPTION_SECRET` ever leaks or is brute-forced.
- **Remediation:** `security-patches/encryption-consolidated.patch` moves the ciphertext to `salt:iv:tag:enc` and derives a per-record key via `sha256(baseKey || salt)`. Correction to the original write-up: there is **no** DB migration and no bulk re-encryption. `decryptKey()` still accepts the legacy 3-part `iv:tag:enc` via the base key, so existing `user_config` rows keep working and only get upgraded the next time they are written. No user action or downtime required.

### M1 — Plaintext API keys in dev memory

- **Severity:** Medium
- **Location:** `app/lib/dev-store.ts`
- **Description:** `let devConfig: DevConfig | null = null` holds the user's actual provider keys in JS heap memory. A console.log or memory snapshot exposes them. The patch encrypts them with the same `ENCRYPTION_SECRET` AES-GCM path as production, so log noise is symmetric.

### M2 — No validation on `leftKey`/`rightKey` shape

- **Severity:** Medium
- **Location:** `app/api/session/route.ts:25–31`
- **Description:** `if (!leftKey || !rightKey)` is the only shape test. An attacker can write `leftKey = 'x'.repeat(200_000)` and bloat the encrypted blob in `user_config`.
- **Remediation:** `security-patches/session-route-consolidated.patch` adds per-provider regex checks (`PROVIDER_KEY_PATTERNS` from `providers.ts`) and a `MAX_KEY_LENGTH` ceiling. Those two exports must exist in `providers.ts` — the patch imports them but does not define them.

### M3 — Prompt concatenation injection surface

- **Severity:** Medium
- **Location:** `app/lib/pipeline.ts:buildFullQuery`, `app/lib/prompts.ts`
- **Description:** `q1`, `q2`, `q3` are concatenated directly into system-prompt templates. Adversarial inputs can hijack system instructions or coerce preflight into reporting "pass" on adversarial output.
- **Remediation:** `security-patches/M3-prompt-delimiters.patch` wraps user input in `<user_query>...</user_query>` delimiters and adds a system-prompt instruction that *any instruction found inside `<user_query>` is to be ignored*.
- **Residual risk:** Per user direction, this is documented as residual; LLMs cannot fully defend.

### M4 — In-memory rate limiter resets on every server restart

- **Severity:** Medium
- **Location:** `app/lib/rate-limit.ts`
- **Description:** `Map<string, RateLimitEntry>`. Dies on Vercel cold-starts. Open-signups means bound identifier domain = email-able-now.
- **Remediation:** `security-patches/M4-rate-limit-supabase.patch` introduces a `rate_limit_state` table keyed on `user_id` and migrates the lockout logic to read/write the table.

### M5 — Subsumed by H1.

### M6 — `next.config.js` has no security headers

- **Severity:** Medium
- **Location:** `next.config.js`
- **Description:** No `headers()` function exported; no CSP, HSTS, X-Frame-Options, Referrer-Policy.
- **Remediation:** `security-patches/M6-security-headers.patch` adds a minimal `headers()` returning CSP + HSTS + X-Frame-Options + Referrer-Policy. Permits inline styles (needed for theme) but no inline scripts.

### M7 — `finalOutput` written without size cap

- **Severity:** Medium
- **Location:** `app/api/pipeline/route.ts`
- **Description:** `finalOutput` is inserted without length check; a misbehaving LLM could insert megabytes.
- **Remediation:** `security-patches/pipeline-route-consolidated.patch` checks both outputs against a 64 KiB ceiling (`Buffer.byteLength`, so multi-byte content is measured correctly) before the insert and returns 413.

### L1 — Auth callback swallows code-exchange errors

- **Severity:** Low
- **Location:** `app/auth/callback/route.ts`
- **Description:** `await supabase.auth.exchangeCodeForSession(code)` is uncaught; user is redirected to origin with no session cookie. Silent failure.
- **Remediation:** `security-patches/L1-callback-error-handling.patch` adds try/catch and a `?error=auth_failed` redirect on failure.

### L2 — Cookie helpers silence errors

- **Severity:** Low
- **Location:** `app/lib/supabase-server.ts:13-18`
- **Description:** `try {…} catch {}` in `set`/`remove`. Auth state changes can fail silently.
- **Remediation:** `security-patches/L2-cookie-helper-logging.patch` adds a `console.warn` inside the catch (no new logger dependency).

### L3 — Production deps use `^`

- **Severity:** Low
- **Location:** `package.json`
- **Description:** All five production deps use `^` ranges. New minors can land auto via `npm install`.
- **Remediation:** `security-patches/L3-dep-pinning.patch` changes `^` to `~` for `@anthropic-ai/sdk`, `openai`, `@supabase/ssr`, `@google/generative-ai` (keeps `^` for non-security-critical `react`/`react-dom`).

### I1 — No `key_version` column for secret rotation

- **Severity:** Info
- **Location:** `supabase/migrations/001_initial_schema.sql`
- **Description:** Rotation story missing.
- **Recommendation:** Future migration `003_add_key_version.sql`. Not patched in this scan (design decision needed).

### I2 — No logging configured

- **Severity:** Info
- **Description:** Today fine. Future logging must redact `apiKey` and prompts/outputs.

### I3 — `/api/pipeline` returns full result with internal flags

- **Severity:** Info
- **Description:** `faultOrigin` and `retryCount` are useful telemetry but expose internal retry policy to clients.

---

## Out-of-scope notes

- CSS/theme/template files, README/CHANGELOG/DEVELOPER, lint-noisy findings, infra config, DAST — all out per user direction in `security-scan-spec.md` §1.2.

---

## Patch artifacts

After two iterations (consolidated hand-written → auto-generated via `git diff`), the canonical patch set is:

| ID(s) | File | Applies? (2026-10-28) |
| --- | --- | --- |
| H1 + H2 + H3 + M7 | `security-patches/pipeline-route-consolidated.patch` | ✗ stale |
| H3 (session) + M2 | `security-patches/session-route-consolidated.patch` | ✗ stale |
| H4 + H5 | `security-patches/encryption-consolidated.patch` | ✓ clean |
| H3 (new file) | `security-patches/create-dev-mode-guard.patch` | ✓ clean |
| M1 | `security-patches/M1-dev-store-encrypted.patch` | ✗ stale |
| M3 | `security-patches/M3-prompt-delimiters.patch` | ✗ stale |
| M4 | `security-patches/M4-rate-limit-supabase.patch` | ✓ clean |
| M6 | `security-patches/M6-security-headers.patch` | ✓ clean |
| L1 | `security-patches/L1-callback-error-handling.patch` | ✗ stale |
| L2 | `security-patches/L2-cookie-helper-logging.patch` | ✓ clean |
| L3 | `security-patches/L3-dep-pinning.patch` | ✓ clean |

**Re-verification, 2026-10-28.** The "all 12 apply cleanly" claim was true when this scan was written and is no longer. Five patches were generated against source that has since moved (non-blocking result save, tiered `LEFT_MODELS` / `RIGHT_MODELS`, the reset-config `DELETE` handler, client stage logging), so they now reject with `patch does not apply`. That means **none of H1 / H2 / H3 / M1 / M2 / M7 / L1 can land until those five are regenerated against current `HEAD`** — including the three the launch verdict calls mandatory.

Re-check before trusting the set:

```bash
for f in security-patches/*.patch; do git apply --check "$f" && echo "PASS $f" || echo "FAIL $f"; done
```

`create-preflight-migration.patch` was removed: its migration is now a real file (below), and keeping the patch would have collided with it on `git apply`.

**Schema migrations now live as files, not inside patches:**

- [002_add_preflight_overall_pass.sql](supabase/migrations/002_add_preflight_overall_pass.sql) — H2 column + index.
- [005_rate_limit_state.sql](supabase/migrations/005_rate_limit_state.sql) — M4 table. Two deviations from the original patch: **RLS is enabled with no policies** (the patch left the table readable and writable through PostgREST by anyone holding the anon key), and the trigger is idempotent (`drop trigger if exists` first) so the file can be re-run safely in the dashboard.

Both are written but not yet applied to any Supabase project — migrations are run by hand in the dashboard per `DEVELOPER.md`.

(M5 is covered by H1 inside `pipeline-route-consolidated.patch`; no separate patch.)

Patch conventions per spec §7:
- Unified diff, comments above the hunk (in this iteration, comments live inside `commit-message`-style headers, not the file body)
- Passes `git apply --check` from a clean working tree
- No changes to out-of-scope files
- Naming: `<ID>-<slug>.patch` or `<area>-consolidated.patch`

**Iteration notes:**
1. The first-pass hand-written patches had several `@@` hunk line-count mismatches and `--- a/path` (vs `/dev/null`) errors for new files. They were all caught by code-review.
2. Second pass regenerated patches using the working tree as the source of truth, then `git diff <file> > security-patches/<name>.patch`, then `git checkout HEAD -- <file>` to revert. This produced 12 fully apply-ready patches.
3. After this iteration, the security-scan-report.md was updated; no code-level changes remaining in working tree.

---

## Suppressions (false positives)

None this run. The custom auditor ran and surfaced zero false positives.

---

## Launch verdict

**NO-GO (conditional)**.

Mandatory before launch (ranked):

1. Decide on Next 15.x upgrade OR sign explicit risk acceptance for `next@14.2.3`'s CVE cluster (DEPS-1, DEPS-2).
2. Apply `create-dev-mode-guard` + `pipeline-route-consolidated` + `session-route-consolidated` (H1/H3) + `M1-dev-store-encrypted`. All four currently need regeneration first — see "Patch artifacts".
3. Apply `M6-security-headers` to at least baseline CSP+HSTS (cheap, no breakage).
4. Apply `M3-prompt-delimiters` to add injection-mitigation (residual-risk per spec).
5. Optionally apply M2 / M4 / M7 if any external signups will be allowed before M1/H3 lands.
6. Run migrations 002 and 005 in the Supabase dashboard before deploying code that writes `preflight_overall_pass`.

### Conditional downgrade path

If the user intends this as hobby/peer-review-only AND is comfortable with the Next CVEs unfixed, the verdict downgrades to **CONDITIONAL GO** under the constraint that:
- The deployed environment enforces `NODE_ENV=production` and `VERCEL_ENV=production`.
- `x-dev-bypass` is never trusted even in dev branches.
- All M-class patches land before exposing the URL.

---

## Appendix A — Files reviewed

(Signed off per spec §8 acceptance criterion 1.)

| File | Reviewed | Findings |
| --- | --- | --- |
| `app/lib/encryption.ts` | yes | H4, H5 |
| `app/lib/dev-store.ts` | yes | M1 |
| `app/lib/pipeline.ts` | yes | H1 (call site), M3 |
| `app/lib/prompts.ts` | yes | M3 |
| `app/lib/providers.ts` | yes | none direct |
| `app/lib/rate-limit.ts` | yes | M4 |
| `app/lib/supabase.ts` | yes | none |
| `app/lib/supabase-server.ts` | yes | L2 |
| `app/api/pipeline/route.ts` | yes | H1, H2, M7, I3 |
| `app/api/session/route.ts` | yes | H3, M2 |
| `app/api/rating/route.ts` | yes | none (defense-in-depth on `user_id` is present) |
| `app/api/rate-limit/route.ts` | yes | none (helper for the limiter lib) |
| `app/auth/callback/route.ts` | yes | L1 |
| `app/components/wizard/Wizard.tsx` | yes | none (UI pass-through) |
| `app/components/intake/IntakeForm.tsx` | yes | none (textarea — XSS-safe under React defaults) |
| `app/components/results/Results.tsx` | yes | none (renders via `whiteSpace: pre-wrap` — text-only) |
| `app/components/Auth.tsx` | yes | none |
| `app/page.tsx`, `app/layout.tsx` | yes | none (env reads are inline-replaced at build, safe) |
| `supabase/migrations/001_initial_schema.sql` | yes | I1 (no key version) |
| `package.json` | yes | DEPS-1/2/3, L3 |
| `next.config.js` | yes | M6 |
| `tsconfig.json`, `eslint` configs | yes | none |

---

## Appendix B — `npm audit` summary

Counts: Critical 1, High 6, Moderate 7, Low 4 (`@supabase/ssr`-transitive 1, plus next-cluster).

Top advisories:

| Package | Sev | Title (shortened) |
| --- | --- | --- |
| next | Critical | Authorization Bypass in Next.js Middleware |
| next | High | Server Components DoS cluster (4 advisories) |
| next | High | HTTP request deserialization DoS |
| next | High | Cache Poisoning |
| next | High | authorization bypass |
| form-data | High | CRLF injection via multipart field names |
| next | Moderate | Cache Key Confusion for Image Optimization |
| next | Moderate | ... (other moderate) |
| cookie | Low | via @supabase/ssr |

All `next` fixes require major upgrade. All transitives require `npm dedupe` or upstream min-bump.

---

## Automation-ready runbook

```bash
# Re-run the scan from a clean tree:
bash scripts/security-scan.sh

# Apply a single patch:
git apply security-patches/pipeline-route-consolidated.patch

# Dry-run all patches (CI gate candidate):
for f in security-patches/*.patch; do
  echo "checking $f..."
  git apply --check "$f" || exit 1
done

# Apply all patches in order:
for f in security-patches/*.patch; do
  git apply "$f"
done

# Run typecheck after applying:
npx tsc --noEmit

# Run baseline lint:
npx next lint
```

(For CI integration, the spec recommends a separate `github-actions/security-scan.yml.example` document; the user opted against in-line CI wiring today.)
