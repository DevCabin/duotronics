import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { encryptKey } from '@/app/lib/encryption'
import { setDevConfig, getDevConfig } from '@/app/lib/dev-store'

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
  
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leftProvider, rightProvider, leftKey, rightKey } = await req.json()

  if (!leftProvider || !rightProvider || !leftKey || !rightKey) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (leftProvider === rightProvider) {
    return NextResponse.json({ error: 'Left and Right providers must be different' }, { status: 400 })
  }

  // Dev mode: store in memory
  if (userId === DEV_USER_ID) {
    setDevConfig({
      left_provider: leftProvider,
      right_provider: rightProvider,
      left_key: leftKey, // plain in dev
      right_key: rightKey,
    })
    return NextResponse.json({ success: true })
  }

  const leftEncrypted = encryptKey(leftKey)
  const rightEncrypted = encryptKey(rightKey)

  const { error } = await supabase
    .from('user_config')
    .upsert({
      user_id: userId,
      left_provider: leftProvider,
      right_provider: rightProvider,
      left_key_encrypted: leftEncrypted,
      right_key_encrypted: rightEncrypted,
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: 'Failed to save config' }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? getUserId(req)
  
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Dev mode: return from memory
  if (userId === DEV_USER_ID) {
    const config = getDevConfig()
    return NextResponse.json({ 
      config: config ? {
        left_provider: config.left_provider,
        right_provider: config.right_provider,
        created_at: new Date().toISOString(),
      } : null 
    })
  }

  const { data: config } = await supabase
    .from('user_config')
    .select('left_provider, right_provider, created_at')
    .eq('user_id', userId)
    .single()

  return NextResponse.json({ config: config ?? null })
}
