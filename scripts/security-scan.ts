#!/usr/bin/env node
/**
 * security-scan.ts — custom architectural auditor for Duotronics.
 *
 * Performs pattern-level checks ESLint cannot express:
 *   - x-dev-bypass must be paired with VERCEL_ENV guard (H3)
 *   - await req.json() without timeout pair racing is risky (H1)
 *   - Prompt template literals containing 'SYSTEM' / 'INSTRUCTIONS'
 *     alongside user interpolations — flag as M3 candidates
 *   - next.config.js must export a headers() function (M6)
 *   - package.json must contain at least one tilde-pinned prod dep
 *     or document caret rationale (L3)
 *   - encryption.ts must not use scryptSync (H4)
 *   - dev-store.ts must not hold plaintext left_key/right_key on its
 *     singleton (M1)
 *
 * Outputs findings as JSON, one per line.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const ROOT = process.cwd()

interface Finding {
  id: string
  rule: string
  severity: 'High' | 'Medium' | 'Low' | 'Info'
  file: string
  line: number
  message: string
}

const findings: Finding[] = []

function add(f: Finding) { findings.push(f) }
function fileLines(path: string): string[] {
  return readFileSync(join(ROOT, path), 'utf8').split('\n')
}
function findFirstLine(path: string, needle: string): number {
  const lines = fileLines(path)
  return lines.findIndex(l => l.includes(needle)) + 1
}

// H1 — await req.json() inside an /api route must be paired with a timeout
const apiRoutes = [
  'app/api/pipeline/route.ts',
  'app/api/session/route.ts',
  'app/api/rating/route.ts',
]
apiRoutes.forEach(f => {
  try {
    const lines = fileLines(f)
    const hasReqJson = lines.some(l => l.includes('await req.json()'))
    const hasRaceTimeout = lines.some(l =>
      l.includes('Promise.race') || l.includes('AbortController')
    )
    const hasRateLimit = lines.some(l => l.includes('checkRateLimit'))
    if (hasReqJson && !hasRaceTimeout) {
      add({
        id: 'H1',
        rule: 'no-timeout-on-req-json',
        severity: 'High',
        file: f,
        line: findFirstLine(f, 'await req.json()'),
        message: 'Await req.json() without Promise.race / AbortController — risk of stuck handler.',
      })
    }
    if (f.includes('pipeline') && !hasRateLimit) {
      add({
        id: 'H1', rule: 'no-rate-limit-on-cost-route', severity: 'High',
        file: f, line: findFirstLine(f, 'export async function POST'),
        message: 'Cost-bearing route lacks checkRateLimit before provider calls.',
      })
    }
  } catch {/* file may not exist */}
})

// H3 — dev-store / x-dev-bypass must be paired with VERCEL_ENV guard
try {
  const guardLines = fileLines('app/lib/dev-mode-guard.ts')
  const hasVercelEnvGuard = guardLines.some(l => l.includes('VERCEL_ENV'))
  if (!hasVercelEnvGuard) {
    add({
      id: 'H3', rule: 'missing-vercel-env-guard', severity: 'High',
      file: 'app/lib/dev-mode-guard.ts', line: 1,
      message: 'dev-mode-guard.ts must explicitly reject VERCEL_ENV=preview even if NODE_ENV=development.',
    })
  }
} catch {/* pre-patch state — file may not exist yet */}

// H4 — no scryptSync anywhere on the request path
try {
  const lines = fileLines('app/lib/encryption.ts')
  const syncIdx = lines.findIndex(l => l.includes('scryptSync'))
  if (syncIdx >= 0) {
    add({
      id: 'H4', rule: 'sync-kdf-on-request-path', severity: 'High',
      file: 'app/lib/encryption.ts', line: syncIdx + 1,
      message: 'scryptSync blocks the Node event loop on every encrypt/decrypt.',
    })
  }
} catch {}

// M3 — prompt template literals containing SYSTEM/INSTRUCTIONS and
// interpolating user-controlled variables
try {
  const lines = fileLines('app/lib/pipeline.ts')
  const userQueryRef = lines.findIndex(l =>
    l.includes('SYSTEM') || l.includes('INSTRUCTIONS')
  )
  if (userQueryRef >= 0 && lines.some(l => l.includes('${q.q1}') || l.includes('${q.q2}'))) {
    add({
      id: 'M3', rule: 'user-input-in-system-template', severity: 'Medium',
      file: 'app/lib/pipeline.ts', line: userQueryRef + 1,
      message: 'User input interpolated into system-prompt template without delimiter.',
    })
  }
} catch {}

// M6 — next.config.js must export a headers() function
try {
  const cfg = readFileSync(join(ROOT, 'next.config.js'), 'utf8')
  if (!cfg.includes('headers')) {
    add({
      id: 'M6', rule: 'missing-security-headers', severity: 'Medium',
      file: 'next.config.js', line: 1,
      message: 'No headers() function exported — CSP/HSTS/X-Frame-Options absent.',
    })
  }
} catch {}

// M1 — dev-store.ts must not store plaintext left_key/right_key on singleton
try {
  const lines = fileLines('app/lib/dev-store.ts')
  const hasPlaintextSingleton = lines.some(l =>
    /left_key:\s*string/.test(l) && /right_key:\s*string/.test(l)
  )
  if (hasPlaintextSingleton) {
    const lp = lines.findIndex(l => /left_key:\s*string/.test(l)) + 1
    add({
      id: 'M1', rule: 'plaintext-singleton', severity: 'Medium',
      file: 'app/lib/dev-store.ts', line: lp,
      message: 'Plaintext API keys on module-scope singleton — exfiltrate risk via console.log or memory dump.',
    })
  }
} catch {}

// L3 — package.json should pin security-sensitive prod deps to tilde
try {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const sensitive = ['@anthropic-ai/sdk', 'openai', '@supabase/ssr', '@google/generative-ai']
  sensitive.forEach(name => {
    const v = pkg.dependencies?.[name]
    if (typeof v === 'string' && v.startsWith('^')) {
      add({
        id: 'L3', rule: 'caret-on-sensitive-dep', severity: 'Low',
        file: 'package.json',
        line: 0,
        message: `${name} is pinned with caret ${v}; pin to tilde (~) for security-sensitive deps.`,
      })
    }
  })
} catch {}

// Emit
console.log(JSON.stringify({ findings }, null, 2))
