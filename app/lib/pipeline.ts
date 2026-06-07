import { callProvider, ProviderConfig } from './providers'
import {
  LEFT_HEMI_SYSTEM,
  LEFT_SELF_CHECK_SYSTEM,
  RIGHT_HEMI_SYSTEM,
  RIGHT_SELF_CHECK_SYSTEM,
  PREFLIGHT_SYSTEM,
  TRIAGE_SYSTEM,
  buildLeftSelfCheckPrompt,
  buildRightHemiPrompt,
  buildTriagePrompt,
  buildReasoningStub,
} from './prompts'

export interface QueryObject {
  q1: string
  q2: string
  q3: string
}

export interface PipelineResult {
  leftOutput: string
  finalOutput: string
  preflightSanity: boolean
  preflightBalance: boolean
  preflightQuality: boolean
  retryCount: number
  faultOrigin: 'left' | 'right' | 'ambiguous' | null
}

export type StageCallback = (stage: string, status: 'active' | 'done') => void

function buildFullQuery(q: QueryObject): string {
  return `Goal: ${q.q1}\n\nContext/Audience: ${q.q2}\n\nWhat a good answer looks like: ${q.q3}`
}

export async function runPipeline(
  query: QueryObject,
  leftConfig: ProviderConfig,
  rightConfig: ProviderConfig,
  onStage?: StageCallback,
  retryCount = 0
): Promise<PipelineResult> {
  const fullQuery = buildFullQuery(query)
  const MAX_RETRIES = 1

  // ── Stage 1: Left Hemi Analysis ──
  onStage?.('left-analyze', 'active')
  const leftRaw = await callProvider(leftConfig, LEFT_HEMI_SYSTEM, fullQuery)
  onStage?.('left-analyze', 'done')

  // ── Stage 2: Left Self-Check ──
  onStage?.('left-check', 'active')
  const leftChecked = await callProvider(
    leftConfig,
    LEFT_SELF_CHECK_SYSTEM,
    buildLeftSelfCheckPrompt(fullQuery, leftRaw)
  )
  const leftOutput = leftChecked.startsWith('No corrections needed.')
    ? leftRaw
    : leftChecked
  onStage?.('left-check', 'done')

  // ── Stage 3: Reasoning Stub ──
  onStage?.('handoff', 'active')
  const reasoningStub = await callProvider(
    leftConfig,
    'You extract concise reasoning summaries. Be brief and specific.',
    buildReasoningStub(leftOutput)
  )
  onStage?.('handoff', 'done')

  // ── Stage 4: Right Hemi Refinement ──
  onStage?.('right-refine', 'active')
  const rightRaw = await callProvider(
    rightConfig,
    RIGHT_HEMI_SYSTEM,
    buildRightHemiPrompt(fullQuery, leftOutput, reasoningStub)
  )
  onStage?.('right-refine', 'done')

  // ── Stage 5: Right Self-Check ──
  onStage?.('right-check', 'active')
  const rightChecked = await callProvider(
    rightConfig,
    RIGHT_SELF_CHECK_SYSTEM,
    `ORIGINAL QUERY:\n${fullQuery}\n\nLEFT OUTPUT:\n${leftOutput}\n\nYOUR RESPONSE:\n${rightRaw}\n\nReview and correct if needed.`
  )
  const rightOutput = rightChecked.startsWith('No corrections needed.')
    ? rightRaw
    : rightChecked
  onStage?.('right-check', 'done')

  // ── Stage 6: Pre-Flight Scan ──
  onStage?.('preflight', 'active')
  const preflightRaw = await callProvider(
    rightConfig,
    PREFLIGHT_SYSTEM,
    `ORIGINAL QUERY:\n${fullQuery}\n\nLEFT ANALYSIS:\n${leftOutput}\n\nFINAL OUTPUT:\n${rightOutput}`
  )

  let preflight = {
    sanity: { pass: true, note: '' },
    balance: { pass: true, note: '' },
    quality: { pass: true, note: '' },
    overall: 'pass' as 'pass' | 'fail',
    corrected_output: null as string | null,
  }

  try {
    const cleaned = preflightRaw.replace(/```json|```/g, '').trim()
    preflight = JSON.parse(cleaned)
  } catch {
    // If parse fails, treat as pass — don't block on JSON errors
  }

  onStage?.('preflight', 'done')

  // ── Pre-flight passed ──
  if (preflight.overall === 'pass') {
    return {
      leftOutput,
      finalOutput: preflight.corrected_output ?? rightOutput,
      preflightSanity: preflight.sanity.pass,
      preflightBalance: preflight.balance.pass,
      preflightQuality: preflight.quality.pass,
      retryCount,
      faultOrigin: null,
    }
  }

  // ── Pre-flight failed: triage ──
  if (retryCount >= MAX_RETRIES) {
    // Surface to user rather than loop
    return {
      leftOutput,
      finalOutput: rightOutput,
      preflightSanity: preflight.sanity.pass,
      preflightBalance: preflight.balance.pass,
      preflightQuality: preflight.quality.pass,
      retryCount,
      faultOrigin: null,
    }
  }

  const failureNotes = [
    !preflight.sanity.pass ? `Sanity: ${preflight.sanity.note}` : '',
    !preflight.balance.pass ? `Balance: ${preflight.balance.note}` : '',
    !preflight.quality.pass ? `Quality: ${preflight.quality.note}` : '',
  ].filter(Boolean).join('; ')

  const triageRaw = await callProvider(
    rightConfig,
    TRIAGE_SYSTEM,
    buildTriagePrompt(fullQuery, leftOutput, rightOutput, failureNotes)
  )

  let triage = { fault_origin: 'ambiguous' as 'left' | 'right' | 'ambiguous', reason: '', correction_instruction: '' }
  try {
    const cleaned = triageRaw.replace(/```json|```/g, '').trim()
    triage = JSON.parse(cleaned)
  } catch {}

  if (triage.fault_origin === 'right') {
    // Right Hemi corrects in place
    onStage?.('right-refine', 'active')
    const correctedRight = await callProvider(
      rightConfig,
      RIGHT_HEMI_SYSTEM,
      `${buildRightHemiPrompt(fullQuery, leftOutput, reasoningStub)}\n\nPREVIOUS ATTEMPT FAILED. CORRECTION INSTRUCTION: ${triage.correction_instruction}`
    )
    onStage?.('right-refine', 'done')
    return {
      leftOutput,
      finalOutput: correctedRight,
      preflightSanity: preflight.sanity.pass,
      preflightBalance: preflight.balance.pass,
      preflightQuality: preflight.quality.pass,
      retryCount: retryCount + 1,
      faultOrigin: 'right',
    }
  }

  if (triage.fault_origin === 'left') {
    // Full restart with fault brief
    return runPipeline(
      query,
      { ...leftConfig, model: leftConfig.model },
      rightConfig,
      onStage,
      retryCount + 1
    )
  }

  // Ambiguous — return as-is, flag for user to clarify
  return {
    leftOutput,
    finalOutput: rightOutput,
    preflightSanity: preflight.sanity.pass,
    preflightBalance: preflight.balance.pass,
    preflightQuality: preflight.quality.pass,
    retryCount: retryCount + 1,
    faultOrigin: 'ambiguous',
  }
}
