'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase'

interface AuthProps {
  onAuth: () => void
}

export default function Auth({ onAuth }: AuthProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [rateLimitInfo, setRateLimitInfo] = useState<{ message: string; contactLink?: boolean } | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)
  const supabase = createClient()

  // Check rate limit on mount and when email changes
  useEffect(() => {
    if (!email) return
    checkRateLimit()
  }, [email])

  const checkRateLimit = async () => {
    try {
      const res = await fetch(`/api/rate-limit?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (!data.allowed) {
        setRateLimitInfo({ message: data.message, contactLink: data.contactLink })
      } else {
        setRateLimitInfo(null)
      }
    } catch {}
  }

  const handleEmail = async () => {
    setError(''); setLoading(true)
    
    // Check rate limit first
    const checkRes = await fetch(`/api/rate-limit?email=${encodeURIComponent(email)}`)
    const checkData = await checkRes.json()
    if (!checkData.allowed) {
      setRateLimitInfo({ message: checkData.message, contactLink: checkData.contactLink })
      setLoading(false)
      return
    }
    
    try {
      if (mode === 'signup') {
        const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: redirectTo }
        })
        if (error) { 
          // Record failed attempt
          await fetch('/api/rate-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          })
          setAttemptCount(c => c + 1)
          setError(error.message)
          await checkRateLimit()
          return 
        }
        setMessage('Check your email to confirm your account.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { 
          // Record failed attempt
          await fetch('/api/rate-limit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          })
          setAttemptCount(c => c + 1)
          setError(error.message)
          await checkRateLimit()
          return 
        }
        onAuth()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ 
      background: 'var(--offwhite)', 
      border: '1px solid rgba(26,43,60,0.1)', 
      borderRadius: 'var(--radius-lg)',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Card top accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'var(--orange)'
      }} />
      
      <h2 style={{ 
        fontFamily: 'var(--font-display)', 
        fontSize: 28, 
        fontWeight: 900, 
        textTransform: 'uppercase',
        letterSpacing: '-0.01em',
        color: 'var(--navy)',
        marginBottom: '0.5rem',
        marginTop: 4
      }}>Welcome</h2>
      <p style={{ 
        fontSize: 15, 
        color: 'var(--navy)', 
        opacity: 0.7,
        lineHeight: 1.6, 
        marginBottom: '1.5rem',
        fontFamily: 'var(--font-body)'
      }}>
        Sign in to get started. Your API keys and preferences are saved securely.
      </p>

      <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--navy)', marginBottom: 6, display: 'block' }}>Email</label>
      <input 
        type="email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        placeholder="you@example.com"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          padding: '11px 14px',
          border: '2px solid rgba(26,43,60,0.18)',
          borderRadius: 'var(--radius)',
          background: 'var(--offwhite)',
          color: 'var(--navy)',
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
          marginBottom: 16
        }}
      />
      <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--navy)', marginBottom: 6, display: 'block' }}>Password</label>
      <input 
        type="password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
        placeholder="••••••••" 
        onKeyDown={e => e.key === 'Enter' && handleEmail()}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          padding: '11px 14px',
          border: '2px solid rgba(26,43,60,0.18)',
          borderRadius: 'var(--radius)',
          background: 'var(--offwhite)',
          color: 'var(--navy)',
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
          marginBottom: 16
        }}
      />

      {error && <div className="error-note" style={{ borderLeft: '5px solid var(--rust)', background: 'rgba(139,58,28,0.08)', borderRadius: '0 var(--radius) var(--radius) 0' }}>{error}</div>}
      {message && <div className="success-note">{message}</div>}
      {rateLimitInfo && (
        <div style={{ 
          borderLeft: '5px solid var(--orange)', 
          background: 'rgba(199,108,36,0.08)', 
          borderRadius: '0 var(--radius) var(--radius) 0',
          padding: '12px 16px',
          marginBottom: 16,
          fontSize: 14,
          color: 'var(--navy)'
        }}>
          {rateLimitInfo.message}
          {rateLimitInfo.contactLink && (
            <>{' '}<a href="mailto:george@devcabin.com" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>george@devcabin.com</a></>
          )}
        </div>
      )}

      <div className="btn-row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        <button onClick={() => setMode(m => m === 'signin' ? 'signup' : 'signin')}
          style={{ fontSize: 12, color: 'var(--navy)', opacity: 0.6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
          {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
        <button 
          onClick={handleEmail} 
          disabled={loading}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '12px 28px',
            borderRadius: 'var(--radius)',
            transition: 'all 0.15s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--orange)',
            color: 'var(--offwhite)',
            opacity: loading ? 0.5 : 1
          }}
        >
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign In →' : 'Sign Up →'}
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <>
          <div className="retro-divider" style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,43,60,0.14)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--tan)' }}>Dev</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,43,60,0.14)' }} />
          </div>
          <button onClick={onAuth} style={{
            width: '100%', 
            padding: '12px', 
            border: '2px dashed rgba(26,43,60,0.25)', 
            borderRadius: 'var(--radius)',
            cursor: 'pointer', 
            fontSize: 13, 
            background: 'transparent', 
            color: 'var(--navy)',
            opacity: 0.7,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}>
            Skip Auth (Dev Mode) →
          </button>
        </>
      )}
    </div>
  )
}
