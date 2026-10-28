# Security Scan Spec — Duotronics

**Status:** Draft v1
**Stage at scan time:** Hobby / exploration, pre-launch, eventually open signups
**Scope:** Source code (SAST) only — no runtime probing, no infra review
**Goal:** Pre-launch gate. Findings are blockers unless explicitly triaged.
**Tooling decision:** `npm` + `ESLint` stack (per user)
**Output:** Single Markdown report (`security-scan-report.md`) + patch directory (`security-patches/`)

---

## 1. Scope

### 1.1 In scope — files to inspect

| Area | Files | Why |
| --- | --- | --- |
| Crypto / secrets | `app/lib/encryption.ts`, `app/lib/dev-store.ts` | API-key encryption at rest, dev bypass |
| Supabase wiring | `app/lib/supabase.ts`, `app/lib/supabase-server.ts` | Client/server separation, cookie handling |
| Provider calls | `app/lib/providers.ts` | Outbound to 5 LLM providers; request shape |
| Business logic | `app/lib/pipeline.ts`, `app/lib/prompts.ts` | Prompt injection surface, error swallowing |
| Rate limiting | `app/lib/rate-limit.ts`, `app/api/rate-limit/route.ts` | Reset semantics, scope of protection |
| API routes | `app/api/pipeline/route.ts`, `app/api/session/route.ts`, `app/api/rating/route.ts` | Auth gating, input validation, payload size, resource caps |
| Auth flow | `app/auth/callback/route.ts`, `app/components/Auth.tsx` | Code-exchange auth, login UI |
| UI inputs/outputs | `app/components/wizard/Wizard.tsx`, `app/components/intake/IntakeForm.tsx`, `app/components/results/Results.tsx` | XSS surface on rendered LLM output, input handling |
| Hosts | `app/layout.tsx`, `app/page.tsx` | Header/cookie use, env reads |
| Schema | `supabase/migrations/001_initial_schema.sql` | RLS policies, constraint presence |
| Config | `next.config.js`, `tsconfig.json`, `package.json`, `eslint` configs | Headers, dep ranges |

### 1.2 Out of scope — explicit exclusions

- `app/space-age-general.css`, `app/duotronics-theme.css`, `app/space-age-templates.html`
- `README.md`, `CHANGELOG.md`, `DEVELOPER.md`, `LICENSE`
- Stylistic / a11y / perf lint findings
- Major dependency version bumps (lockfile churn rejected)
- DAST / runtime probing / penetration test
- Vercel infra config, DNS, edge config
- Anything outside `app/`, `supabase/`, root config files

### 1.3 Audit deliverables (the WHAT the scan produces)

1. **`security-scan-report.md`** — single Markdown report (the user's chosen output)
2. **`security-patches/<ID>.patch`** — directory, one `*.patch` per High + Medium finding
3. **`scripts/security-scan.sh`** — single command to rerun the scan
4. **`scripts/security-scan.ts`** — Node TS harness for custom architectural checks
5. **`scripts/security-scan.eslintrc.json`** — ESLint config with security plugins isolated
6. **Launch verdict** — `GO` / `CONDITIONAL GO` / `NO-GO`

---

## 2. Threat model — priority order

User-confirmed top concerns (Round 2 multi-select):
1. Cost / DoS abuse on `/api/pipeline`
2. API key secrecy (encryption scheme, env handling, dev-mode plaintext)

User-confirmed ambient posture:
- Open signups eventually (so `/api/*` must not trust anonymous users for any path that costs money)
- Data held = keys + prompts + LLM outputs, possibly PII in prompts
- Prompt-injection: important but documented as residual-risk; do NOT fixate on it at the expense of cost-abuse

Threat-model ordering (severity × likelihood, in this codebase):

| Rank | Risk | Primary file | Why it ranks here |
| --- | --- | --- | --- |
| 1 | Cost amplification via `/api/pipeline` | `app/api/pipeline/route.ts` | No rate limit, no body cap, no per-user concurrent cap, ~6 LLM calls per request, every call billed |
| 2 | `x-dev-bypass` as production backdoor | `app/api/*/route.ts` ×3 | Single header is the only gate; if `NODE_ENV` is ever `development` in prod, every protected route is wide open |
| 3 | Plaintext API keys in dev memory | `app/lib/dev-store.ts` | Module-scope singleton; if `getDevConfig()` is ever imported in prod code paths, keys logged in clear |
| 4 | LLM provider key exposure via console / logging | all of `app/api/pipeline/route.ts`, `providers.ts` | Today no logs, but no guardrail against accidentally logging `apiKey` or decrypted plaintext |
| 5 | Prompt injection in pipeline | `app/lib/pipeline.ts`, `prompts.ts` | User input concatenated into LLM prompts — documented residual |
| 6 | RLS gaps / over-permissive | `supabase/migrations/001_initial_schema.sql` | Today tight; verify nothing widened |
| 7 | Dep-level CVEs | `package.json` | `^` ranges, esp. `@anthropic-ai/sdk`, `openai`, `@supabase/ssr`, `next 14.2.3` |
| 8 | Missing security headers | `next.config.js` (empty) | No CSP / HSTS / X-Frame / Referrer-Policy |
| 9 | Rate-limit reset / abuse via email | `app/lib/rate-limit.ts` | In-memory, lost on restart, defeated by free email signups |

---

## 3. Severity rubric

| Level | Definition | Launch impact |
| --- | --- | --- |
| **High** | Exploitable with low effort; immediate cost/data risk | Pre-launch BLOCKER. Patch required before launch. |
| **Medium** | Exploitable with chaining or specific precondition | Pre-launch SHOULD-FIX. Cancel launch without patches. |
| **Low** | Latent risk, hygiene, defense-in-depth | Backlog. Documented in report but not a launch blocker. |
| **Info** | Best-practice nudge, no direct exploit path | Optional. Listed in report appendix. |

Cutting the rubric to functional reuse: `npm audit` advisories are mapped to severity using `severity` field (critical/high → High, moderate → Medium, low → Low). ESLint custom-rule hits get the same Hot/Med/Low mapping in the custom scanner.

---

## 4. Findings shortlist (initial — to be confirmed or expanded during scan)

The scan must investigate **at minimum** each item below. Items the scan cannot validate from static review must be marked "Not statically determinable" in the report, never silently dropped.

### High (pre-launch blockers)

- **H1 — `/api/pipeline` has no rate limit, no payload-size guard, no per-call timeout.**
  - `app/api/pipeline/route.ts`: route reads `req.json()` with no size guard, calls `runPipeline` synchronously in the request lifecycle with no `AbortController`, no concurrency cap.
  - Exploit: attacker creates auth'd account, then loops `POST /api/pipeline` with arbitrary-size body. Each call performs 6 LLM API calls (left analyze + left check + handoff + right refine + right check + preflight). Cost amplifier: 6×per request, 0 limit.
  - Investigate: any reverse-proxy / Vercel defaults that mitigate this? If Vercel Edge has request-body limits, document but do not depend on it.

- **H2 — `/api/pipeline` writes LLM output to `results` regardless of preflight status.**
  - `app/api/pipeline/route.ts` lines ~70–95: even when `preflight.overall === 'fail'`, `result.leftOutput`/`result.finalOutput` are persisted. A failed preflight output may contain hallucinations surfaced as "final".
  - Investigate: is the UI's `Results.tsx` distinguishing preflight-pass vs preflight-fail? (Reviewer asserts yes — badged "!" — but downstream consumers / future analytics assume "final" means "good").

- **H3 — `x-dev-bypass` header is the sole gate for "dev user" identity.**
  - `app/api/pipeline/route.ts`, `app/api/session/route.ts`: `if (isDev && req.headers.get('x-dev-bypass') === 'true') { return DEV_USER_ID }`.
  - Single point of failure: anything that compiles with `NODE_ENV=development` (mis-set Vercel env, fine-tuned local clone) sees production data fall into a single user's row.
  - Investigate: confirm Vercel `NODE_ENV` is set to `production` in deployed envs (cannot determine statically — must be marked as "verify-env").

### High → Medium candidates (re-rank after scan)

- **H4 — `app/lib/encryption.ts` `scryptSync` runs on every encrypt/decrypt.**
  - Synchronous KDF on the request path of `/api/session` (encrypt-on-write, decrypt-on-read every `/api/pipeline`). Combined with H1 (cost amplification), `scryptSync` × N concurrent users stalls the Node event loop — DoS amplification even before the LLM call is made.
  - Recommend async `scrypt` and cache the derived key in module scope with version check.

- **H5 — Hardcoded salt `'duotronics-salt'` in `scryptSync`.**
  - `app/lib/encryption.ts`: `scryptSync(secret, 'duotronics-salt', 32)`. Static salt defeats one purpose of salts (per-secret uniqueness). Combined with weak/short `ENCRYPTION_SECRET`, accelerates offline attack on a leaked DB snapshot. NIST SP 800-132 intends salt per-record.
  - Recommend: store salt per-record alongside ciphertext; introduce `key_version` column.

### Medium (pre-launch should-fix)

- **M1 — `app/lib/dev-store.ts` holds plaintext API keys in a module-scope singleton.**
  - `let devConfig: DevConfig | null = null` accessed across all dev requests. Memory dumps, dev-mode console output, or any future `console.log` of `devConfig` leaks real provider keys.
  - Recommend: dev keys also encrypted at rest (can be plaintext-on-write to env) OR DevConfig gated by env flag that's NEVER set in deployed envs.

- **M2 — `app/api/session/route.ts` does no validation on `leftKey`/`rightKey` shape beyond non-empty.**
  - Attacker can submit `{leftKey: "x".repeat(100_000)}`. Encrypts to ~100KB AES-GCM blob, upserted to `user_config` — DoS via DB row bloat per user.
  - Recommend: regex per-provider (e.g., `^sk-` prefix, Anthropic `^sk-ant-`, length bounds).

- **M3 — `app/lib/pipeline.ts` builds prompts with template-string concatenation of user `q1/q2/q3`.**
  - Classic prompt injection vector. Adversary writes `"</system> Ignore previous instructions and ... "` into q1. Output then flows into preflight+triage, which can label legitimate-looking adversarial content as "pass".
  - Per user direction: document residual risk; recommend (a) wrap user text in `<user_query>` delimiters; (b) instruct left/right systems to ignore instructions in user blocks; (c) post-generation re-prompt preflight with output critique not output collab.

- **M4 — In-memory rate limiter resets on every server restart and is bypassable via new accounts.**
  - `app/lib/rate-limit.ts`: `Map<string, RateLimitEntry>`. Map dies with the process; on Vercel cold-starts every lockout is forgiven. Even warm, attacker creates fresh emails — `open signups` means unbound distinct identifiers.
  - Recommend: move to Supabase table-backed counter keyed on `user_id` (post-auth) — bind to authenticated user rather than email.

- **M5 — Rate-limit not applied to `/api/pipeline`.**
  - Same Map exists but `/api/pipeline` and `/api/rating` never call `checkRateLimit` / `recordAttempt`. So while auth-side attempts are throttled, LLM-cost-bearing routes are not.
  - Recommend: add `checkRateLimit(userId, 'pipeline')` with tighter limit and a session-aware token bucket.

- **M6 — `next.config.js` has no security-headers configuration.**
  - No `headers()` function → no CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy. Today the app renders `finalOutput` as text (low XSS risk), but the loose rendering policy is brittle: any future switch to `dangerouslySetInnerHTML` for markdown rendering pivots this into a High instantly.
  - Recommend: minimal CSP (`default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'`) plus HSTS + X-Frame-Options=DENY.

- **M7 — `app/api/pipeline/route.ts` writes `finalOutput` to DB without content-size check.**
  - A misbehaving LLM could return megabytes. DB write amplification per user.
  - Recommend: cap `finalOutput.length` (e.g., 64KB) before insert.

### Low

- **L1 — `app/auth/callback/route.ts` redirects to origin unconditionally, ignoring `code` exchange failure.**
  - `await supabase.auth.exchangeCodeForSession(code)` errors are not caught; user is "signed in" with no session cookie and silently redirected.
  - Recommend: try/catch + return error URL with safe message.

- **L2 — `app/lib/supabase-server.ts` cookie helpers swallow individual errors.**
  - Empty `catch {}` blocks in `set`/`remove`. Auth state changes can fail silently in server actions.
  - Recommend: at minimum log to a structured logger.

- **L3 — `package.json` dependency ranges use `^` (caret) across all production deps.**
  - `^0.24.0` for `@anthropic-ai/sdk`, `^4.52.0` for `openai`, `^0.4.0` for `@supabase/ssr`, `14.2.3` (exact) for `next`.
  - Recommend: pin production deps to tilde-range or exact, especially security-critical SDKs; add `npm ci` policy.

- **L4 — No `DELETE` RLS policy on `user_config`.**
  - Track-only. User has no auto-delete path today, but if one is added later, missing policy becomes a regression.

- **L5 — No MFA offered.**
  - Supabase Auth supports TOTP. Document as out-of-MVP hardening.

### Info

- **I1 — `ENCRYPTION_SECRET` no version column.**
  - Cannot rotate keys without a re-encryption pass. Add `key_version smallint not null default 1`.

- **I2 — Logging not specified.**
  - No `pino`/`winston` config in `package.json`. If logs are added later, must redact `apiKey`, decrypted key, full prompts.

- **I3 — `app/api/pipeline/route.ts` returns full `result` object including preflight flags to client.**
  - Information disclosure: client learns `faultOrigin` and `retryCount`. Today low risk, but add a TODO for redaction if public.

- **I4 — `app/page.tsx` uses `process.env.NODE_ENV` directly in client bundle.**
  - `process.env.NODE_ENV` is inlined at build, so this is OK — but worth documenting that `x-dev-bypass` reads `.get('x-dev-bypass')` server-side, NEVER `process.env`.

---

## 5. Tooling — `npm` + `ESLint` stack

### 5.1 SCA — dependency CVEs

```bash
npm audit --omit=dev --json
```

- Capture JSON. Map advisory severities to our severity rubric.
- For each hit, mark file:line as `package.json` and the offending dep.
- Note: only flag if there's an actual fix available in versions within current `^` range. If only a major bump fixes it, mark as "no patch available within minor — track".

### 5.2 SAST — ESLint with security plugins

Add to `package.json` `devDependencies` (proposed, not applied during spec):

```json
"eslint-plugin-security": "^3.0.1",
"eslint-plugin-no-unsanitized": "^4.0.2",
"@types/eslint": "^8"
```

`scripts/security-scan.eslintrc.json`:

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:security/recommended-legacy",
    "plugin:no-unsanitized/recommended"
  ],
  "rules": {
    "security/detect-object-injection": "error",
    "security/detect-non-literal-fs-filename": "error",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "error",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-non-literal-require": "error",
    "security/detect-possible-timing-attacks": "error",
    "security/detect-pseudoRandomBytes": "error",
    "no-unsanitized/method": "error",
    "no-unsanitized/property": "error"
  }
}
```

Run:

```bash
npx eslint -c scripts/security-scan.eslintrc.json --ext .ts,.tsx --format json -o eslint-report.json app/ supabase/
```

### 5.3 Custom architectural auditor — `scripts/security-scan.ts`

A Node TS program (no npm publish) that performs static checks ESLint cannot:

```ts
// Top-level checks (sketch — actual script implements ASCII matches):
// 1. For every route under app/api/**/route.ts that calls fetch/_Provider,
//    assert that the file imports checkRateLimit OR has explicit justification.
// 2. For every occurrence of 'x-dev-bypass', assert a sibling
//    `process.env.VERCEL_ENV !== 'preview'` AND `process.env.NODE_ENV !== 'development'`
//    cross-check (cannot determine statically → MUST mark "Verify-env in CI").
// 3. For every template-literal that interpolates a user-controlled string into
//    a string also containing uppercase keywords like 'SYSTEM', 'INSTRUCTIONS',
//    'LEFT HEMISPHERE', flag as M3 prompt-concat candidate.
// 4. For every `await req.json()` without `Promise.race` against a 5s timeout, flag M7.
// 5. For `app/lib/encryption.ts`, verify no synchronous KDF inside the request path.
// 6. For `next.config.js`, assert presence of `headers()` function (else M6).
// 7. For `package.json`, count `^` ranges vs `~`/`exact` (audit hygiene).
```

Output: `architecture-report.json` shaped like:

```json
{
  "findings": [
    { "id": "M1", "file": "app/lib/dev-store.ts", "line": 12, "rule": "plaintext-singleton", "severity": "Medium" }
  ]
}
```

### 5.4 Manual review pass

After automated runs, manual review of:

- `app/lib/pipeline.ts` (concatenation patterns, error swallows in `try {…} catch {}`)
- `app/api/pipeline/route.ts` (auth check before cost-incurring ops, response shape)
- `supabase/migrations/001_initial_schema.sql` (RLS policies, CHECK constraints, FK actions)
- `app/lib/encryption.ts` (key derivation, IV/Tag handling)

Each finding either gets a `security-patches/<ID>.patch` artifact (apply-ready) OR an explicit "manual-only — design discussion needed" tag in the report.

---

## 6. Output structure — `security-scan-report.md`

```
# Security Scan Report — Duotronics
[Run timestamp] — [Tool versions]

## Executive summary
- Severity histogram: High N / Medium M / Low L / Info I
- Top 5 issues (read this first)
- Launch verdict: GO / CONDITIONAL GO / NO-GO
- Estimated time to remediate all High findings

## Methodology
- npm audit (SCA)
- ESLint with security/no-unsanitized plugins (SAST)
- Custom architectural auditor (scripts/security-scan.ts)
- Manual review of: pipeline, encryption, schema, dev-store, auth/callback, all routes

## Findings table
| ID  | Sev | Title | File | Line | Patch |
|-----|-----|-------|------|------|-------|

## Per-finding sections
### H1 — /api/pipeline has no rate limit
- Severity: High
- Location: app/api/pipeline/route.ts (whole file)
- Description / exploit sketch
- Remediation: see security-patches/H1-pipeline-rate-limit.patch
- Notes: behavior of patch under Vercel serverless

### H2 ...
(repeat per finding)

## Out-of-scope notes
- CSS/theme — excluded by user
- Docs — excluded
- DAST — excluded
- Infra — excluded

## Automation-ready runbook (no CI wiring today)
```bash
# Re-run whole scan:
bash scripts/security-scan.sh

# Apply a single patch:
git apply security-patches/H1-pipeline-rate-limit.patch

# Dry-run all patches:
for f in security-patches/*.patch; do git apply --check "$f"; done
```

## Appendix
- npm audit output (formatted)
- ESLint output summary
- Custom scanner output summary
- Suppressions (false positives) with rationale
```

---

## 7. Patch artifacts (`security-patches/`)

Conventions:
- One `<ID>.patch` per High + Medium finding (Low + Info: optional).
- Format: unified diff with comments above the hunk explaining the change in plain language.
- Each patch must build cleanly with `git apply --check`.
- Patches must not alter files outside the in-scope list (§1.1) unless explicitly noted.
- Naming: `H1-pipeline-rate-limit.patch`, `M1-dev-store-encryption.patch`, etc.

Patch directory structure to be created during the scan (not now):

```
security-patches/
  H1-pipeline-rate-limit.patch
  H2-flag-preflight-fail.patch
  H3-dev-bypass-double-gate.patch
  H4-scrypt-async.patch   (if confirmed High after scan)
  H5-per-record-salt.patch (if confirmed High after scan)
  M1-dev-store-encryption.patch
  M2-session-key-shape.patch
  M3-prompt-delimiters.patch
  M4-rate-limit-supabase.patch
  M5-pipeline-rate-limit.patch
  M6-security-headers.patch
  M7-output-size-cap.patch
```

---

## 8. Acceptance criteria — when the scan is "done"

- [ ] Every file in §1.1 has been inspected; each file gets a row in the report's "Files reviewed" appendix.
- [ ] All High findings have at least one corresponding `security-patches/<ID>.patch` file that passes `git apply --check`.
- [ ] All Medium findings are either patched or have an explicit "manual-only — design decision" note in `security-scan-report.md`.
- [ ] `npm audit` was run and results are summarized (even if empty).
- [ ] ESLint output enumerated; false positives are documented and suppressed.
- [ ] `scripts/security-scan.ts` was run; its output is appended to the report.
- [ ] "Not statically determinable" findings are explicitly listed (no silent gaps).
- [ ] Launch verdict line is present in the executive summary.
- [ ] No findings in §4 are silently omitted; new findings are added in their own row to the table.

---

## 9. Stop conditions

The scan stops when ALL:

1. Every High finding is patched and patches pass `git apply --check`.
2. Every Medium finding is patched OR explicitly accepted with rationale.
3. `security-scan-report.md` is written with all sections in §6.
4. `scripts/security-scan.sh` is committed.
5. Launch verdict is delivered.

If at end of scan the user wants a specific patch *not* applied (e.g., rolls back to design discussion), that decision lives in `security-scan-report.md`'s "Triage decisions" appendix, NOT in code.

---

## 10. Notes for the operator

- **Don't trust automated verdicts for `x-dev-bypass`.** Static analysis cannot determine that `NODE_ENV` is `production` in prod. Operator must confirm via Vercel env settings + a manual `curl /api/pipeline` test without the header.
- **Static analysis is one frame.** Any conclusion labelled "exploitable" must include the precondition environment. Hobby deployment + open signups = different threat picture than enterprise.
- **Residual risk IS the deliverable.** The user said prompt-injection is "important, document residual risk". Don't promise a fix; promise mitigation + monitoring.
- **No silent suppressions.** Every ESLint false-positive is a known, named exclusion and lives in the report's "Suppressions" section.
- **Patch lay-of-the-land.** When patching, prefer changes that don't break the dev-mode flow, since the TestScript at Vercel preview likely depends on `x-dev-bypass`.

---

## Appendix A — File properties that the scan must NOT alter

- `app/space-age-general.css`, `app/duotronics-theme.css`, `app/space-age-templates.html` (excluded)
- README, CHANGELOG, DEVELOPER (excluded)
- `tsconfig.json` unless explicitly required for security (then mark `INFO`)
- ESLint configs

## Appendix B — Mapping table for advisors → rubric

| Source | Field | Maps to |
| --- | --- | --- |
| `npm audit` | `severity = critical` | High |
| `npm audit` | `severity = high` | High |
| `npm audit` | `severity = moderate` | Medium |
| `npm audit` | `severity = low` | Low |
| `npm audit` | `severity = info` | Info |
| ESLint | `severity = 2` (error) | rubrics per rule in §5.2 |
| Custom scanner | explicit `severity` assertion | as written |
| Manual | subjective | Hot/Med/Low/Info per analyst notes |

## Appendix C — Open questions deferred to user mid-scan

These should NOT be answered during the scan with assumptions — surface them when first encountered:

1. Is it acceptable to introduce an `ENCRYPTION_SECRET` v2 / re-encryption pass in this launch window, or must we keep v1 forever?
2. Is it acceptable to refuse `dev-mode` entirely on Vercel preview deployments? (Today `x-dev-bypass` does NOT depend on Vercel env.)
3. Are we OK adding a Supabase table for rate-limit records? (Adds schema drift to `migrations/001_initial_schema.sql`.)
4. Are we OK with Vercel Edge request-body ceiling as the outer bound, OR app-level enforcement?
5. Pinning `^` ranges — to tilde, or to exact? (Affects lockfile churn tolerance.)

---

*End of spec.*
