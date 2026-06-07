import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, recordAttempt } from '@/app/lib/rate-limit'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ allowed: true })
  }

  const result = checkRateLimit(email.toLowerCase().trim())
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const email = body.email
  
  if (email) {
    recordAttempt(email.toLowerCase().trim())
  }

  return NextResponse.json({ success: true })
}