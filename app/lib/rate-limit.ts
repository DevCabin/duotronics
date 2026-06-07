// Simple in-memory rate limiting for demo purposes
// NOTE: This resets on server restart. For production, use Redis or similar.

interface RateLimitEntry {
  attempts: number
  lockoutUntil: number | null
  lockoutCount: number
}

const store = new Map<string, RateLimitEntry>()

const LOCKOUT_DURATIONS = [5 * 60 * 1000, 10 * 60 * 1000, 30 * 60 * 1000] // 5min, 10min, 30min

export function checkRateLimit(identifier: string): { allowed: boolean; message?: string; contactLink?: boolean } {
  const now = Date.now()
  const entry = store.get(identifier) || { attempts: 0, lockoutUntil: null, lockoutCount: 0 }

  // Check if currently locked out
  if (entry.lockoutUntil && now < entry.lockoutUntil) {
    const minutesLeft = Math.ceil((entry.lockoutUntil - now) / 60000)
    
    if (entry.lockoutCount >= 4) {
      return { 
        allowed: false, 
        message: "Come on... you're blocked. This is a limited-use demo. If you'd like to assist in peer review, reach out!",
        contactLink: true
      }
    }
    
    return { 
      allowed: false, 
      message: `Too many attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.` 
    }
  }

  // Clear expired lockout
  if (entry.lockoutUntil && now >= entry.lockoutUntil) {
    entry.lockoutUntil = null
    entry.attempts = 0
  }

  // Check if they hit the limit
  if (entry.attempts >= 3) {
    entry.lockoutCount++
    const duration = LOCKOUT_DURATIONS[Math.min(entry.lockoutCount - 1, LOCKOUT_DURATIONS.length - 1)]
    entry.lockoutUntil = now + duration
    entry.attempts = 0
    store.set(identifier, entry)

    const durationMinutes = Math.ceil(duration / 60000)
    
    if (entry.lockoutCount >= 4) {
      return { 
        allowed: false, 
        message: "Come on... you're blocked. This is a limited-use demo. If you'd like to assist in peer review, reach out!",
        contactLink: true
      }
    }

    return { 
      allowed: false, 
      message: `Too many attempts. Locked out for ${durationMinutes} minutes.` 
    }
  }

  return { allowed: true }
}

export function recordAttempt(identifier: string): void {
  const entry = store.get(identifier) || { attempts: 0, lockoutUntil: null, lockoutCount: 0 }
  entry.attempts++
  store.set(identifier, entry)
}

export function resetRateLimit(identifier: string): void {
  store.delete(identifier)
}