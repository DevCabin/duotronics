# Duotronics — Prioritised To-Do

Ordered by priority. Updated 2026-10-28 after verifying the patch set against `HEAD`.
Work follows `cline_instructions.md`: changes on `dev`, small descriptive commits, pushed to GitHub, `CHANGELOG.md` kept current.

**State right now:** application code is untouched since `357e286`. The security scan, its 11 patches and migrations
`002` / `005` are committed on `dev`. Five of those patches do not apply and must be regenerated first.

---

## P0 — Blockers

- [ ] **P0.1 — Decide: Next 15.x upgrade, or signed risk acceptance.**
      `next@14.2.3` carries the Critical middleware authz-bypass advisory (GHSA-7gfc-8cq8-jh5f) plus six High advisories. No patch here fixes them. Mitigating fact: routes authenticate via server-side `supabase.auth.getUser()`, not middleware alone.

- [ ] **P0.2 — Regenerate the five stale patches.** *(discovered today — this now blocks P0.3)*
      These reject with `patch does not apply` because they were cut before the last four commits (non-blocking result save, tiered `LEFT_MODELS`/`RIGHT_MODELS`, reset-config `DELETE`, client stage logs):
      - `pipeline-route-consolidated.patch`
      - `session-route-consolidated.patch`
      - `M1-dev-store-encrypted.patch`
      - `M3-prompt-delimiters.patch`
      - `L1-callback-error-handling.patch`

      Regenerating is not a mechanical rebase — the stale hunks also drop features that landed after the scan. See "Regeneration hazards" below.

- [ ] **P0.3 — Apply the mandated fixes: H1, H3, M1.**
      Order: `create-dev-mode-guard.patch` → both route patches → `M1-dev-store-encrypted.patch`. Then `tsc --noEmit`.

- [ ] **P0.4 — Run migrations 002 + 005 in the Supabase dashboard** (files are committed but no project has run them yet).
      Files are written and ready to paste: [002_add_preflight_overall_pass.sql](supabase/migrations/002_add_preflight_overall_pass.sql), [005_rate_limit_state.sql](supabase/migrations/005_rate_limit_state.sql).
      - [ ] 002 **must** run before the patched pipeline route deploys, or every result save fails — and because saves are non-blocking, it surfaces only as a quiet `saveError`.
      - [ ] 005 enables RLS on `rate_limit_state` (the original patch did not — that table would have been anon-readable through PostgREST).
      - [ ] Numbering gap: there is no 003 or 004. The report's "migration 003" never existed.

- [ ] **P0.5 — Verify.** `npx tsc --noEmit`, `npx next lint`, a dev-mode run end-to-end, `x-dev-bypass` refused when `NODE_ENV !== development`, and a 4th rapid `/api/pipeline` call returning 429.

- [ ] **P0.6 — Apply `M6-security-headers.patch`.** `next.config.js` is still `{}`. Cheap; check `/about` for CSP violations.

---

## P1 — Remaining security work

- [ ] **P1.1 — `M3-prompt-delimiters.patch`** (regenerate first). Wrap user input in `<user_query>` + ignore-embedded-instructions. Mitigation, not a fix.
- [ ] **P1.2 — `L1-callback-error-handling.patch`** (regenerate first). Auth callback swallows code-exchange failures.
- [ ] **P1.3 — `L2-cookie-helper-logging.patch`.** Applies clean.
- [ ] **P1.4 — `L3-dep-pinning.patch`.** Applies clean.
- [ ] **P1.5 — `M4-rate-limit-supabase.patch`.** Applies clean, but note: it only *adds* `app/lib/rate-limit-supabase.ts`. Nothing imports it — `/api/rate-limit` still uses the in-memory limiter. Dead code until that route is switched over, which is a code change no patch covers.
- [ ] **P1.6 — H4 + H5 (`encryption-consolidated.patch`).** Applies clean. **Correction to the earlier note in this file: this is safe to apply.** The patch keeps a legacy 3-part `iv:tag:enc` decrypt path, so existing `user_config` rows keep working and upgrade on next write. No migration, no downtime. It also stays synchronous — it caches the derived key rather than going async, so there is no per-`key_version` cache.
- [ ] **P1.7 — `npm dedupe --force` for DEPS-3 (`form-data`).** Verify the lockfile diff stays limited to `form-data` + tree.
- [ ] **P1.8 — `key_version` / secret rotation (I1).** Still unaddressed by any patch. Blocks clean `ENCRYPTION_SECRET` rotation indefinitely.

---

## P2 — Product and correctness

- [ ] **P2.1 — User-selectable models per hemisphere.** Only open roadmap item, and the biggest lever on the experiment. Patch `pipeline-route-consolidated` currently deletes the `model: LEFT_MODELS[...]` argument, which would silently revert tiered selection — regenerate it keeping models, then build the UI.
- [ ] **P2.2 — Fix the fail-open accuracy gate.** Unparseable JSON in `parseRightProcess` falls back to `accurate: true, confidence_score: 100` — the most optimistic reading of a broken response. Should fall back to `false` so the one permitted re-process fires.
- [ ] **P2.3 — Per-call `AbortController`.** `maxDuration = 60` is declared but no provider call can be cancelled; one slow model eats the budget and surfaces as a platform timeout. The patch's 90s `Promise.race` returns a clean 504 but does not stop the underlying calls.
- [ ] **P2.4 — Fix version drift.** `package.json` says `0.2.0`; `CHANGELOG.md` is at `0.3.1` + Unreleased.
- [ ] **P2.5 — Vestigial pipeline fields.** `preflightBalance` / `preflightQuality` hardcoded `true`, `faultOrigin` always `null`, but three DB columns and `low_rated_results` expect them. Make honest or drop.
- [ ] **P2.6 — Real stage telemetry.** Client marks every stage done when the single `/api/pipeline` response lands; server `onStage` isn't wired over HTTP. The progress UI is theatre.

---

## P3 — Hygiene

- [ ] **P3.1 — First tests.** None exist. Best first targets: `parseRightProcess` JSON handling, the accuracy/retry gate, `encryptKey`/`decryptKey` round-trip (including the legacy 3-part path).
- [ ] **P3.2 — CI gate.** `scripts/security-scan.sh` + the patch `--check` loop + `tsc --noEmit`. Worth wiring only after P0.2 lands, otherwise it fails on day one.
- [ ] **P3.3 — CHANGELOG entry** for whatever security work actually lands.
- [ ] **P3.4 — Docs.** `DEVELOPER.md` Security section, plus note that dev mode will require `ENCRYPTION_SECRET` once M1 lands.

---

## Regeneration hazards (for P0.2)

These are not stale-context noise — each patch, if naively re-cut from the old version, silently undoes shipped work:

1. **`pipeline-route-consolidated` drops `model:`** from both `runPipeline` configs, reverting tiered `LEFT_MODELS` / `RIGHT_MODELS` to `DEFAULT_MODELS`.
2. **`session-route-consolidated` imports `PROVIDER_KEY_PATTERNS` and `MAX_KEY_LENGTH`** from `providers.ts`, but **no patch defines them**. Applying it as-is is a type error.
3. **`M1-dev-store-encrypted` rewrites `dev-store.ts` wholesale and deletes `clearDevConfig`**, which `/api/session`'s `DELETE` handler (reset-config button) now imports.
4. **M1 also makes `ENCRYPTION_SECRET` mandatory in dev.** Today `npm run dev` works with no Supabase and no secret; after M1 the wizard throws on save unless the secret is set. Needs a docs line or a dev fallback.
5. **`M4`'s new lib is unreferenced** — applying it changes nothing until `/api/rate-limit` is migrated.

---

## Open questions for you

1. **Next 15 upgrade or risk acceptance?** Longest lead time, and the only item the patches can't address.
2. **Hobby/peer-review or public launch?** Decides how hard P1.5–P1.8 need to be pushed.
3. **Regenerate the five stale patches now,** or take the product work (P2.1) first and leave security for later?
