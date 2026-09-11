import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { decryptKey } from '@/app/lib/encryption'
import { runPipeline, QueryObject } from '@/app/lib/pipeline'
import { getDevConfig } from '@/app/lib/dev-store'
import { LEFT_MODELS, RIGHT_MODELS, Provider } from '@/app/lib/providers'

const isDev = process.env.NODE_ENV === 'development'
const DEV_USER_ID = 'dev-user'

function getUserId(req: NextRequest): string | null {
  if (isDev && req.headers.get('x-dev-bypass') === 'true') {
    return DEV_USER_ID
  }
  return null
}

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    return await handlePipeline(req)
  } catch (err: any) {
    console.error('[pipeline] unhandled error:', err?.message, err?.stack?.split('\n')[1] ?? '')
    const detail = err?.message ?? 'Unknown error'
    const status = detail.includes('ENCRYPTION_SECRET') || detail.includes('decrypt')
      ? 500
      : 502
    return NextResponse.json(
      { error: `Pipeline failed: ${detail}` },
      { status }
    )
  }
}

async function handlePipeline(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? getUserId(req)
  const isDevMode = userId === DEV_USER_ID
  
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const query: QueryObject = { q1: body.q1, q2: body.q2, q3: body.q3 }

  // Get config
  let config: any
  if (isDevMode) {
    config = getDevConfig()
    if (!config) {
      return NextResponse.json({ error: 'No configuration found. Complete the setup wizard first.' }, { status: 400 })
    }
  } else {
    const { data: dbConfig, error: configError } = await supabase
      .from('user_config')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (configError || !dbConfig) {
      return NextResponse.json({ error: 'No configuration found. Complete the setup wizard first.' }, { status: 400 })
    }
    config = {
      ...dbConfig,
      left_key: decryptKey(dbConfig.left_key_encrypted),
      right_key: decryptKey(dbConfig.right_key_encrypted),
    }
  }

  // Run pipeline
  const result = await runPipeline(
    query,
    { provider: config.left_provider, apiKey: config.left_key, model: LEFT_MODELS[config.left_provider as Provider] },
    { provider: config.right_provider, apiKey: config.right_key, model: RIGHT_MODELS[config.right_provider as Provider] }
  )

  // Save result (or mock in dev). Don't block returning the LLM output on DB errors.
  let resultId: string | null = 'dev-result-id'
  let sessionId: string | null = 'dev-session-id'
  let saveError: string | null = null

  if (!isDevMode) {
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        q1: query.q1,
        q2: query.q2,
        q3: query.q3,
        left_provider: config.left_provider,
        right_provider: config.right_provider,
      })
      .select()
      .single()

    if (sessionError || !session) {
      console.error('[pipeline] session insert failed:', sessionError?.message, sessionError?.details, sessionError?.hint)
      saveError = `Failed to save session: ${sessionError?.message ?? 'unknown'}`
    } else {
      sessionId = session.id

      const { data: savedResult, error: resultError } = await supabase
        .from('results')
        .insert({
          session_id: session.id,
          user_id: userId,
          left_output: result.leftOutput,
          final_output: result.finalOutput,
          preflight_sanity: result.preflightSanity,
          preflight_balance: result.preflightBalance,
          preflight_quality: result.preflightQuality,
          retry_count: result.retryCount,
          fault_origin: result.faultOrigin,
        })
        .select()
        .single()

      if (resultError || !savedResult) {
        console.error('[pipeline] result insert failed:', resultError?.message, resultError?.details, resultError?.hint)
        saveError = `Failed to save result: ${resultError?.message ?? 'unknown'}`
      } else {
        resultId = savedResult.id
      }
    }
  }

  return NextResponse.json({
    resultId,
    sessionId,
    saveError,
    ...result,
  })
}
