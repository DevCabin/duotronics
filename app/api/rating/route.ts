import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { resultId, rating } = await req.json()

  if (!resultId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  const { error } = await supabase
    .from('results')
    .update({ rating, rated_at: new Date().toISOString() })
    .eq('id', resultId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })

  return NextResponse.json({ success: true })
}
