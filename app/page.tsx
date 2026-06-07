'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase'
import Auth from '@/app/components/Auth'
import Wizard from '@/app/components/wizard/Wizard'
import IntakeForm from '@/app/components/intake/IntakeForm'
import PipelineProgress, { INITIAL_STAGES, StageState, StageId } from '@/app/components/pipeline/PipelineProgress'
import Results from '@/app/components/results/Results'

type Screen = 'loading' | 'auth' | 'wizard' | 'intake' | 'processing' | 'results'

interface PipelineResult {
  resultId: string
  leftOutput: string
  finalOutput: string
  preflightSanity: boolean
  preflightBalance: boolean
  preflightQuality: boolean
  faultOrigin: 'left' | 'right' | 'ambiguous' | null
  retryCount: number
}

const STAGE_SUBTITLES: Record<string, string> = {
  'left-analyze': 'Left hemisphere is analyzing your query...',
  'left-check': 'Left hemisphere is checking its own work...',
  'handoff': 'Packaging reasoning context for handoff...',
  'right-refine': 'Right hemisphere is refining and warming the output...',
  'right-check': 'Right hemisphere is verifying substance was preserved...',
  'preflight': 'Running pre-flight scan — sanity, balance, quality...',
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [stages, setStages] = useState<StageState[]>(INITIAL_STAGES)
  const [subtitle, setSubtitle] = useState('Starting up...')
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [pipelineError, setPipelineError] = useState('')
  const supabase = createClient()

  const isDevBypass = process.env.NODE_ENV === 'development'

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && !isDevBypass) { setScreen('auth'); return }

      // Check if wizard is complete
      const res = await fetch('/api/session', {
        headers: isDevBypass ? { 'x-dev-bypass': 'true' } : {}
      })
      const data = await res.json()
      setScreen(data.config ? 'intake' : 'wizard')
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isDevBypass) setScreen('auth')
    })
    return () => subscription.unsubscribe()
  }, [isDevBypass])

  const handleAuth = async () => {
    const res = await fetch('/api/session', {
      headers: isDevBypass ? { 'x-dev-bypass': 'true' } : {}
    })
    const data = await res.json()
    setScreen(data.config ? 'intake' : 'wizard')
  }

  const updateStage = (id: StageId, status: 'active' | 'done') => {
    setSubtitle(STAGE_SUBTITLES[id] ?? '')
    setStages(prev => prev.map(s => {
      if (s.id === id) return { ...s, status }
      if (status === 'active' && s.status === 'active') return { ...s, status: 'done' }
      return s
    }))
  }

  const handleIntakeSubmit = async (q1: string, q2: string, q3: string) => {
    setScreen('processing')
    setStages(INITIAL_STAGES)
    setPipelineError('')
    setSubtitle('Left hemisphere is analyzing your query...')

    // Kick off the first stage visually
    updateStage('left-analyze', 'active')

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(isDevBypass ? { 'x-dev-bypass': 'true' } : {})
        },
        body: JSON.stringify({ q1, q2, q3 }),
      })
      const data = await res.json()

      if (!res.ok) {
        setPipelineError(data.error ?? 'Something went wrong.')
        setScreen('intake')
        return
      }

      // Mark all stages done for visual completion
      setStages(prev => prev.map(s => ({ ...s, status: 'done' })))
      setTimeout(() => {
        setResult(data)
        setScreen('results')
      }, 500)
    } catch {
      setPipelineError('Network error. Please try again.')
      setScreen('intake')
    }
  }

  if (screen === 'loading') {
    return (
      <div className="app-shell">
        <div className="logo" style={{ position: 'relative' }}>
          <div className="logo-mark" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span className="left">◐</span> DUOTRONICS <span className="right">◑</span>
          </div>
          <div className="logo-sub" style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--navy)', opacity: 0.5 }}>dual hemisphere AI processing</div>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--navy)', fontSize: 14, opacity: 0.5, fontFamily: 'var(--font-display)' }}>LOADING...</div>
      </div>
    )
  }

  return (
    <div className="app-shell" style={{ position: 'relative' }}>
      {/* Top-right swoosh - orange outside, teal inside (original) */}
      <div style={{
        position: 'absolute',
        top: -80,
        right: -80,
        width: 340,
        height: 340,
        borderRadius: '50%',
        boxShadow: '0 0 0 20px var(--orange-lt), 0 0 0 40px var(--orange), 0 0 0 60px var(--teal-lt), 0 0 0 80px var(--teal)',
        opacity: 0.35,
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      {/* Bottom-left swoosh - reversed: teal outside, orange inside */}
      <div style={{
        position: 'absolute',
        bottom: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: '50%',
        boxShadow: '0 0 0 20px var(--teal-lt), 0 0 0 40px var(--teal), 0 0 0 60px var(--orange-lt), 0 0 0 80px var(--orange)',
        opacity: 0.35,
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1, marginBottom: '2.5rem' }}>
        <div className="logo">
          <div className="logo-mark" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 32, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--navy)' }}>
            <span className="left" style={{ color: 'var(--left)' }}>◐</span> DUOTRONICS <span className="right" style={{ color: 'var(--right)' }}>◑</span>
          </div>
          <div className="logo-sub" style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--navy)', opacity: 0.5, marginTop: 8 }}>dual hemisphere AI processing</div>
        </div>
        <a 
          href="/about" 
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--navy)',
            opacity: 0.6,
            textDecoration: 'none',
            padding: '8px 16px',
            border: '1.5px solid rgba(26,43,60,0.2)',
            borderRadius: 'var(--radius)',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.borderColor = 'var(--orange)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6'
            e.currentTarget.style.borderColor = 'rgba(26,43,60,0.2)'
          }}
        >
          About
        </a>
      </div>

      {/* Star field footer row - moved above context banner */}
      <div style={{
        background: '#0a0a0a',
        height: 44,
        position: 'relative',
        zIndex: 1,
        backgroundImage: 'radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.3), transparent), radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.25), transparent), radial-gradient(2px 2px at 90px 40px, rgba(255,255,255,0.35), transparent), radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 160px 20px, rgba(255,255,255,0.25), transparent), radial-gradient(2px 2px at 50px 90px, rgba(255,255,255,0.2), transparent)',
        backgroundSize: '180px 100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 16px',
        borderRadius: 'var(--radius-sm)'
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.8)'
        }}>
          A Research Project By DevCabin
        </span>
      </div>

      {/* Gap */}
      <div style={{ height: 20 }} />

      {/* Context banner */}
      <div style={{
        background: 'var(--offwhite)',
        border: '1px solid rgba(26,43,60,0.1)',
        borderRadius: 'var(--radius)',
        padding: '12px 16px',
        position: 'relative',
        zIndex: 1,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        <p style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: 'var(--navy)',
          opacity: 0.85,
          fontFamily: 'var(--font-body)',
          margin: 0
        }}>
          Configure two AI providers to analyze and refine your queries through a six-stage pipeline.
        </p>
        <a 
          href="/about"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--teal)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          Learn More →
        </a>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {screen === 'auth' && <Auth onAuth={handleAuth} />}
        {screen === 'wizard' && <Wizard onComplete={() => setScreen('intake')} />}
        {screen === 'intake' && (
          <>
            {pipelineError && <div className="error-note">{pipelineError}</div>}
            <IntakeForm onSubmit={handleIntakeSubmit} loading={false} />
          </>
        )}
        {screen === 'processing' && (
          <PipelineProgress stages={stages} subtitle={subtitle} />
        )}
        {screen === 'results' && result && (
          <Results
            {...result}
            onNewQuery={() => {
              setResult(null)
              setScreen('intake')
            }}
          />
        )}
      </div>
    </div>
  )
}
