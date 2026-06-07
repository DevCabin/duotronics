import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { decryptKey } from '@/app/lib/encryption'
import { runPipeline, QueryObject } from '@/app/lib/pipeline'
import { getDevConfig } from '@/app/lib/dev-store'

const isDev = process.env.NODE_ENV === 'development'
const DEV_USER_ID = 'dev-user'

function getUserId(req: NextRequest): string | null {
  if (isDev && req.headers.get('x-dev-bypass') === 'true') {
    return DEV_USER_ID
  }
  return null
}

export async function POST(req: NextRequest) {
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
    { provider: config.left_provider, apiKey: config.left_key },
    { provider: config.right_provider, apiKey: config.right_key }
  )

  // Save result (or mock in dev)
  let resultId = 'dev-result-id'
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
      return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
    }

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
      return NextResponse.json({ error: 'Failed to save result' }, { status: 500 })
    }
    resultId = savedResult.id
  }

  return NextResponse.json({
    resultId,
    sessionId: isDevMode ? 'dev-session-id' : undefined,
    ...result,
  })
}
