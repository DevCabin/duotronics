# Duotronics — Prioritised To-Do

Ordered by priority. Updated 2026-10-28 after verifying the patch set against `HEAD`.
Work follows `cline_instructions.md`: changes on `dev`, small descriptive commits, pushed to GitHub, `CHANGELOG.md` kept current.

**State at session end:** application code untouched since `357e286`. Security scan, its 11 patches and migrations
`002` / `005` are committed on `dev` (`fc7a530`, pushed). **No security patch has been applied. The app is exactly as
vulnerable as the scan found it.** Five of the 11 patches do not apply and must be regenerated before anything lands.

---

## NEXT SESSION — START HERE

The whole security queue is blocked on step 1. Do not apply patches out of order.

### Step 1 — Regenerate the five stale patches

These reject with `patch does not apply` because they were cut before the last four commits (non-blocking result save,
tiered `LEFT_MODELS` / `RIGHT_MODELS`, reset-config `DELETE`, client stage logging):

| Patch | Must preserve | Must add |
| --- | --- | --- |
| `pipeline-route-consolidated.patch` | `model: LEFT_MODELS[...]` / `RIGHT_MODELS[...]` in both `runPipeline` configs — the old hunk deletes them and silently reverts tiered selection to `DEFAULT_MODELS` | `preflight_overall_pass` insert; keep the non-blocking `saveError` save path |
| `session-route-consolidated.patch` | the `DELETE` handler and `clearDevConfig` import | nothing — but see the missing exports below |
| `M1-dev-store-encrypted.patch` | `clearDevConfig()` export — the old hunk rewrites the file wholesale and drops it, which breaks the reset-config button | decide the no-secret behaviour (see decisions) |
| `M3-prompt-delimiters.patch` | current `buildFullQuery` / prompt builders | `<user_query>` delimiters in `pipeline.ts` + `prompts.ts` |
| `L1-callback-error-handling.patch` | current `app/auth/callback/route.ts` | `?auth_error=` handling |

**Missing exports (blocks M2):** `session-route-consolidated.patch` imports `PROVIDER_KEY_PATTERNS` and `MAX_KEY_LENGTH`
from `app/lib/providers.ts`, and **no patch defines them**. Add both to that patch (or a new `create-provider-key-patterns.patch`)
or the build fails: Anthropic `^sk-ant-`, OpenAI `^sk-`, Google `^AIza`, Moonshot `^sk-`, xAI `^xai-`, plus a length ceiling.

### Step 2 — Apply in this order

`create-dev-mode-guard.patch` must go first: both route patches import from the module it creates.

```bash
git apply --check security-patches/create-dev-mode-guard.patch        # must pass before applying
git apply         security-patches/create-dev-mode-guard.patch
git apply         security-patches/pipeline-route-consolidated.patch
git apply         security-patches/session-route-consolidated.patch
git apply         security-patches/M1-dev-store-encrypted.patch
git apply         security-patches/M6-security-headers.patch
```

Never force a rejected hunk. A rejection means the regeneration in step 1 missed something.

### Step 3 — Migrations, in the Supabase SQL editor

Paste in this order. **002 before the patched pipeline route is deployed**, or every result save fails — and because
saves are non-blocking that appears only as a quiet `saveError`, not a visible error.

1. `supabase/migrations/002_add_preflight_overall_pass.sql`
2. `supabase/migrations/005_rate_limit_state.sql`

Both are idempotent (re-runnable). 005 enables RLS on `rate_limit_state`; the original patch did not, which would have
left the table readable and writable by anyone holding the anon key.

### Step 4 — Verify before committing

- [ ] `npx tsc --noEmit`
- [ ] `npx next lint`
- [ ] Dev-mode run end-to-end: skip auth → wizard → intake → results
- [ ] `x-dev-bypass` refused when `NODE_ENV !== development`
- [ ] 4th rapid `/api/pipeline` call returns 429
- [ ] `/about` loads with security headers and no CSP violations in the console
- [ ] A result saves (proves migration 002 ran)

### Step 5 — Commit on `dev` and push

Small descriptive message, `CHANGELOG.md` updated, then `git push origin dev`. Only open a `dev` → `main` PR once this
is tested — `main` deploys straight to production.

---

## Blocked on your decisions

1. **Next 15.x upgrade, or signed risk acceptance?** `next@14.2.3` carries the Critical middleware authz-bypass advisory
   (GHSA-7gfc-8cq8-jh5f) plus six High advisories. No patch here fixes them. Longest lead time of anything on this list.
2. **Hobby/peer-review, or public launch?** Decides how hard M4–M7 and I1 need to be pushed.
3. **What should M1 do when `ENCRYPTION_SECRET` is unset in dev?** Today `npm run dev` works with no Supabase and no
   secret. After M1 the wizard throws on save unless the secret is set. Options: throw with a clear message (safest),
   or skip encryption when `NODE_ENV === 'development'` and no secret is present (keeps the zero-config dev path).

## What I cannot do for you

- **Run the migrations.** No Supabase credentials, and `.env.local` is off-limits. They must be pasted into the dashboard.
- **The Next 15 decision.** It is an owner call, and an upgrade would touch `middleware.ts` and every route's session
  handling — worth settling before investing further in the rest.
- **Apply patches to a production project.** Everything above happens on `dev` and is tested before `main`.

---

## P0 — Blockers

- [ ] **P0.1** Decide Next 15 vs. risk acceptance (see decisions).
- [ ] **P0.2** Regenerate the five stale patches + add the missing provider key exports — **step 1 above**.
- [ ] **P0.3** Apply H1 / H3 / M1 + `M6` — **step 2 above**.
- [ ] **P0.4** Run migrations 002 + 005 — **step 3 above**. Numbering gap: there is no 003 or 004; the report's
      "migration 003" never existed.
- [ ] **P0.5** Verify — **step 4 above**.
- [ ] **P0.6** `M6-security-headers.patch` — applies clean; `next.config.js` is still `{}`.

## P1 — Remaining security work

- [ ] **P1.1** `M3-prompt-delimiters.patch` (regenerate first). Mitigation, not a fix; residual risk documented.
- [ ] **P1.2** `L1-callback-error-handling.patch` (regenerate first).
- [ ] **P1.3** `L2-cookie-helper-logging.patch` — applies clean.
- [ ] **P1.4** `L3-dep-pinning.patch` — applies clean.
- [ ] **P1.5** `M4-rate-limit-supabase.patch` — applies clean, and is **inert**: it only adds
      `app/lib/rate-limit-supabase.ts`, which nothing imports. `/api/rate-limit` still uses the in-memory limiter;
      switching it over is a code change no patch covers.
- [ ] **P1.6** `encryption-consolidated.patch` (H4 + H5) — applies clean and is **safe**: `decryptKey` keeps the legacy
      3-part `iv:tag:enc` path, so existing `user_config` rows work and upgrade on next write. No migration, no downtime.
      It caches the scrypt key rather than going async, so still no per-`key_version` cache.
- [ ] **P1.7** `npm dedupe --force` for DEPS-3 (`form-data`). Confirm the lockfile diff stays limited to `form-data` + tree.
- [ ] **P1.8** `key_version` / secret rotation (I1) — unaddressed by any patch.

## P2 — Product and correctness

- [ ] **P2.1** User-selectable models per hemisphere. Only open roadmap item and the biggest lever on the experiment.
      (Note: `pipeline-route-consolidated` currently deletes the `model:` argument — regenerate it first, or this gets harder.)
- [ ] **P2.2** Fix the fail-open accuracy gate: unparseable JSON in `parseRightProcess` falls back to
      `accurate: true, confidence_score: 100`. Should fall back to `false` so the permitted re-process fires.
- [ ] **P2.3** Per-call `AbortController`. `maxDuration = 60` is declared but no provider call can be cancelled; the
      patch's 90s `Promise.race` returns a clean 504 but does not stop the underlying calls.
- [ ] **P2.4** Version drift: `package.json` says `0.2.0`, `CHANGELOG.md` is at `0.3.1` + Unreleased.
- [ ] **P2.5** Vestigial fields: `preflightBalance` / `preflightQuality` hardcoded `true`, `faultOrigin` always `null`,
      yet three DB columns and the `low_rated_results` view expect them.
- [ ] **P2.6** Real stage telemetry: the client marks every stage done when the single response lands; server `onStage`
      is not wired over HTTP. The progress UI is theatre.

## P3 — Hygiene

- [ ] **P3.1** First tests. None exist. Best targets: `parseRightProcess`, the accuracy/retry gate, and
      `encryptKey`/`decryptKey` round-trip including the legacy 3-part path.
- [ ] **P3.2** CI gate: `scripts/security-scan.sh` + the patch `--check` loop + `tsc --noEmit`. Wire it only after P0.2,
      otherwise it fails on day one.
- [ ] **P3.3** CHANGELOG entry for whatever security work actually lands.
- [ ] **P3.4** Docs: `DEVELOPER.md` Security section; note that M1 makes `ENCRYPTION_SECRET` mandatory in dev.

---

## Reference

Patch status as of `fc7a530` — 6 clean, 5 stale:

```bash
for f in security-patches/*.patch; do git apply --check "$f" && echo "PASS $f" || echo "FAIL $f"; done
```

- Clean: `create-dev-mode-guard`, `encryption-consolidated`, `M4`, `M6`, `L2`, `L3`
- Stale: `pipeline-route-consolidated`, `session-route-consolidated`, `M1`, `M3`, `L1`
- `create-preflight-migration.patch` was deleted — its migration is now a real file, and keeping it would collide on apply.
- `M4-rate-limit-supabase.patch` had its SQL hunk stripped for the same reason. Migration 005 is the source of truth.
