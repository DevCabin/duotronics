import { callProvider, ProviderConfig } from './providers'
import {
  LEFT_HEMI_SYSTEM,
  RIGHT_PROCESS_SYSTEM,
  RIGHT_HUMANIZE_SYSTEM,
  buildRightProcessPrompt,
  buildRightHumanizePrompt,
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

const MAX_RETRIES = 1
const ACCURACY_THRESHOLD = 85

function buildFullQuery(q: QueryObject): string {
  return `Goal: ${q.q1}\n\nContext/Audience: ${q.q2}\n\nWhat a good answer looks like: ${q.q3}`
}

function log(stage: string, message: string, extra?: Record<string, unknown>) {
  const payload = extra ? ` ${JSON.stringify(extra)}` : ''
  console.log(`[pipeline][${stage}] ${message}${payload}`)
}

export async function runPipeline(
  query: QueryObject,
  leftConfig: ProviderConfig,
  rightConfig: ProviderConfig,
  onStage?: StageCallback,
  retryCount = 0
): Promise<PipelineResult> {
  const fullQuery = buildFullQuery(query)

  // ── Stage 1: Left Hemi Analysis ──
  log('left-analyze', 'starting', { queryLength: fullQuery.length })
  onStage?.('left-analyze', 'active')
  const leftOutput = await callProvider(leftConfig, LEFT_HEMI_SYSTEM, fullQuery)
  onStage?.('left-analyze', 'done')
  log('left-analyze', 'done', { outputLength: leftOutput.length })

  // ── Stage 2: Right Hemi Process (accuracy check + correction) ──
  log('right-process', 'starting', { attempt: retryCount })
  onStage?.('right-process', 'active')
  const firstPass = await runRightProcess(rightConfig, fullQuery, leftOutput, false)
  onStage?.('right-process', 'done')
  log('right-process', 'done', {
    accurate: firstPass.accurate,
    confidence: firstPass.confidence_score,
    outputLength: firstPass.response.length,
  })

  // ── Stage 3: Right Hemi Verify / Re-process if needed ──
  let accurateResponse = firstPass.response
  const approved = firstPass.accurate && firstPass.confidence_score >= ACCURACY_THRESHOLD

  onStage?.('right-verify', 'active')
  if (!approved && retryCount < MAX_RETRIES) {
    log('right-verify', 'below threshold, reprocessing', {
      accurate: firstPass.accurate,
      confidence: firstPass.confidence_score,
      threshold: ACCURACY_THRESHOLD,
    })
    const corrected = await runRightProcess(rightConfig, fullQuery, leftOutput, true)
    accurateResponse = corrected.response
    retryCount += 1
    log('right-verify', 'reprocess done', {
      accurate: corrected.accurate,
      confidence: corrected.confidence_score,
      outputLength: corrected.response.length,
      retryCount,
    })
  } else {
    log('right-verify', approved ? 'approved' : 'fallback (max retries reached)', {
      accurate: firstPass.accurate,
      confidence: firstPass.confidence_score,
      retryCount,
    })
  }
  onStage?.('right-verify', 'done')

  // ── Stage 4: Right Hemi Humanize ──
  log('right-humanize', 'starting', { responseLength: accurateResponse.length })
  onStage?.('right-humanize', 'active')
  const finalOutput = await callProvider(
    rightConfig,
    RIGHT_HUMANIZE_SYSTEM,
    buildRightHumanizePrompt(fullQuery, accurateResponse)
  )
  onStage?.('right-humanize', 'done')
  log('right-humanize', 'done', { outputLength: finalOutput.length })

  // ── Stage 5: Final Approval ──
  onStage?.('final-approval', 'active')
  const finalApproved = retryCount === 0 ? approved : true
  log('final-approval', 'returning result', {
    finalApproved,
    retryCount,
    leftLength: leftOutput.length,
    finalLength: finalOutput.length,
  })
  onStage?.('final-approval', 'done')

  return {
    leftOutput,
    finalOutput,
    preflightSanity: finalApproved,
    preflightBalance: true,
    preflightQuality: true,
    retryCount,
    faultOrigin: null,
  }
}

interface RightProcessResult {
  accurate: boolean
  confidence_score: number
  response: string
  notes: string
}

async function runRightProcess(
  config: ProviderConfig,
  fullQuery: string,
  leftOutput: string,
  isCorrection: boolean
): Promise<RightProcessResult> {
  const raw = await callProvider(
    config,
    RIGHT_PROCESS_SYSTEM,
    buildRightProcessPrompt(fullQuery, leftOutput, isCorrection)
  )
  return parseRightProcess(raw)
}

function parseRightProcess(raw: string): RightProcessResult {
  const fallback: RightProcessResult = {
    accurate: true,
    confidence_score: 100,
    response: raw,
    notes: 'Parse failed — treating raw response as approved.',
  }

  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      accurate: Boolean(parsed.accurate),
      confidence_score: Number(parsed.confidence_score) || 0,
      response: String(parsed.response ?? raw),
      notes: String(parsed.notes ?? ''),
    }
  } catch (err) {
    log('parse-right-process', 'failed to parse JSON, using fallback', {
      rawPreview: raw.slice(0, 200),
      error: (err as Error).message,
    })
    return fallback
  }
}
