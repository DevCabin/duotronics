import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(origin)
}
