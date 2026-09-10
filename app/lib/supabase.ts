import { createBrowserClient } from '@supabase/ssr'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    console.error(
      '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Set them in Vercel → Project → Settings → Environment Variables (Production) and redeploy.'
    )
  }
  return { url: url ?? '', anonKey: anonKey ?? '' }
}

export function createClient() {
  const { url, anonKey } = getSupabaseConfig()
  return createBrowserClient(url, anonKey)
}
