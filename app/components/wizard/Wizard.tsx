'use client'
import { useState } from 'react'
import { Provider, PROVIDER_LABELS, PROVIDER_KEY_LINKS } from '@/app/lib/providers'

const PROVIDERS: Provider[] = ['anthropic', 'openai', 'google', 'moonshot', 'xai']

const PROVIDER_ICONS: Record<Provider, string> = {
  anthropic: '◈',
  openai: '◎',
  google: '⬡',
  moonshot: '◑',
  xai: '✦',
}

interface WizardProps {
  onComplete: () => void
}

export default function Wizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(1)
  const [leftProvider, setLeftProvider] = useState<Provider | null>(null)
  const [rightProvider, setRightProvider] = useState<Provider | null>(null)
  const [leftKey, setLeftKey] = useState('')
  const [rightKey, setRightKey] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const goNext = () => { setError(''); setStep(s => s + 1) }
  const goBack = () => { setError(''); setStep(s => s - 1) }

  const validateStep1 = () => {
    if (!leftProvider) { setError('Please select a provider for the Left hemisphere.'); return false }
    if (!leftKey.trim()) { setError('Please enter an API key.'); return false }
    return true
  }

  const validateStep2 = () => {
    if (!rightProvider) { setError('Please select a provider for the Right hemisphere.'); return false }
    if (!rightKey.trim()) { setError('Please enter an API key.'); return false }
    if (rightProvider === leftProvider) { setError('Right hemisphere must be a different provider than Left.'); return false }
    return true
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-dev-bypass': process.env.NODE_ENV === 'development' ? 'true' : 'false'
        },
        body: JSON.stringify({ leftProvider, rightProvider, leftKey, rightKey }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to save.'); return }
      setSaved(true)
      setTimeout(onComplete, 1000)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const progressWidth = `${(step / 3) * 100}%`

  const cardStyle = {
    background: 'var(--offwhite)',
    border: '1px solid rgba(26,43,60,0.1)',
    borderRadius: 'var(--radius-lg)',
    padding: '32px',
    position: 'relative' as const,
    overflow: 'hidden'
  }

  const accentColor = step === 1 ? 'var(--orange)' : step === 2 ? 'var(--teal)' : 'var(--synthesis)'

  return (
    <div style={cardStyle}>
      {/* Card top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: accentColor }} />
      
      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.5rem', marginTop: 4 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < step ? 'var(--teal)' : i === step ? 'var(--orange)' : 'rgba(26,43,60,0.15)',
            transition: 'background 0.2s'
          }} />
        ))}
        <span style={{ 
          fontSize: 11, 
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--navy)',
          opacity: 0.5,
          marginLeft: 8
        }}>Step {step} of 3</span>
      </div>
      
      <div style={{ height: 2, background: 'rgba(26,43,60,0.08)', borderRadius: 1, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: progressWidth, background: accentColor, borderRadius: 1, transition: 'width 0.4s ease' }} />
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--orange)', display: 'block', marginBottom: 10 }}>◐ Analytical Hemisphere</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--navy)', marginBottom: '0.75rem', lineHeight: 1 }}>Choose Your<br/>Logic Model</h2>
          <p style={{ fontSize: 15, color: 'var(--navy)', opacity: 0.7, lineHeight: 1.6, marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>
            This hemisphere handles structure, accuracy, and reasoning.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
            {PROVIDERS.map(p => (
              <button key={p} onClick={() => setLeftProvider(p)} style={{
                border: leftProvider === p ? '2px solid var(--orange)' : '1.5px solid rgba(26,43,60,0.15)',
                background: leftProvider === p ? 'rgba(224,104,32,0.08)' : 'var(--offwhite)',
                borderRadius: 'var(--radius)', 
                padding: '14px 10px', 
                textAlign: 'center', 
                cursor: 'pointer',
                transition: 'all 0.15s', 
                fontFamily: 'var(--font-body)'
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{PROVIDER_ICONS[p]}</div>
                <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{PROVIDER_LABELS[p].split(' ')[0]}</div>
              </button>
            ))}
          </div>
          {leftProvider && (
            <>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--navy)', marginBottom: 6, display: 'block' }}>
                API Key for {PROVIDER_LABELS[leftProvider]}{' '}
                <a href={PROVIDER_KEY_LINKS[leftProvider]} target="_blank" rel="noreferrer" style={{ color: 'var(--orange)', textDecoration: 'none' }}>Get Key ↗</a>
              </label>
              <input 
                type="password" 
                value={leftKey} 
                onChange={e => setLeftKey(e.target.value)}
                placeholder="Paste your API key here"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  padding: '11px 14px',
                  border: '2px solid rgba(26,43,60,0.18)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--offwhite)',
                  color: 'var(--navy)',
                  outline: 'none',
                  width: '100%',
                  marginBottom: 16
                }}
              />
            </>
          )}
          {error && (
            <div style={{ 
              fontSize: 12, 
              padding: '12px 16px', 
              borderRadius: '0 var(--radius) var(--radius) 0', 
              background: 'rgba(139,58,28,0.08)', 
              borderLeft: '5px solid var(--rust)',
              color: 'var(--rust)',
              marginBottom: 16
            }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button 
              onClick={() => { if (validateStep1()) goNext() }}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 28px',
                borderRadius: 'var(--radius)',
                background: 'var(--orange)',
                color: 'var(--offwhite)',
                transition: 'all 0.15s'
              }}
            >Next →</button>
          </div>
        </>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--teal)', display: 'block', marginBottom: 10 }}>◑ Creative Hemisphere</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--navy)', marginBottom: '0.75rem', lineHeight: 1 }}>Choose Your<br/>Voice Model</h2>
          <p style={{ fontSize: 15, color: 'var(--navy)', opacity: 0.7, lineHeight: 1.6, marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>
            Adds warmth and humanity to the logic model's output. Must be a different provider.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
            {PROVIDERS.map(p => {
              const isBlocked = p === leftProvider
              return (
                <button key={p} onClick={() => !isBlocked && setRightProvider(p)} disabled={isBlocked} style={{
                  border: rightProvider === p ? '2px solid var(--teal)' : '1.5px solid rgba(26,43,60,0.15)',
                  background: rightProvider === p ? 'rgba(46,127,163,0.08)' : 'var(--offwhite)',
                  borderRadius: 'var(--radius)', 
                  padding: '14px 10px', 
                  textAlign: 'center',
                  cursor: isBlocked ? 'not-allowed' : 'pointer',
                  opacity: isBlocked ? 0.35 : 1,
                  transition: 'all 0.15s', 
                  fontFamily: 'var(--font-body)'
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{PROVIDER_ICONS[p]}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{PROVIDER_LABELS[p].split(' ')[0]}</div>
                </button>
              )
            })}
          </div>
          {rightProvider && (
            <>
              <label style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--navy)', marginBottom: 6, display: 'block' }}>
                API Key for {PROVIDER_LABELS[rightProvider]}{' '}
                <a href={PROVIDER_KEY_LINKS[rightProvider]} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)', textDecoration: 'none' }}>Get Key ↗</a>
              </label>
              <input 
                type="password" 
                value={rightKey} 
                onChange={e => setRightKey(e.target.value)}
                placeholder="Paste your API key here"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 15,
                  padding: '11px 14px',
                  border: '2px solid rgba(26,43,60,0.18)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--offwhite)',
                  color: 'var(--navy)',
                  outline: 'none',
                  width: '100%',
                  marginBottom: 16
                }}
              />
            </>
          )}
          {error && (
            <div style={{ 
              fontSize: 12, 
              padding: '12px 16px', 
              borderRadius: '0 var(--radius) var(--radius) 0', 
              background: 'rgba(139,58,28,0.08)', 
              borderLeft: '5px solid var(--rust)',
              color: 'var(--rust)',
              marginBottom: 16
            }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button 
              onClick={goBack}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: '2px solid rgba(26,43,60,0.18)',
                cursor: 'pointer',
                padding: '12px 28px',
                borderRadius: 'var(--radius)',
                background: 'transparent',
                color: 'var(--navy)',
                transition: 'all 0.15s'
              }}
            >← Back</button>
            <button 
              onClick={() => { if (validateStep2()) goNext() }}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: 'pointer',
                padding: '12px 28px',
                borderRadius: 'var(--radius)',
                background: 'var(--teal)',
                color: 'var(--offwhite)',
                transition: 'all 0.15s'
              }}
            >Next →</button>
          </div>
        </>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--synthesis)', display: 'block', marginBottom: 10 }}>✦ Configuration Complete</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--navy)', marginBottom: '0.75rem', lineHeight: 1 }}>Ready to<br/>Launch</h2>
          <p style={{ fontSize: 15, color: 'var(--navy)', opacity: 0.7, lineHeight: 1.6, marginBottom: '1.5rem', fontFamily: 'var(--font-body)' }}>
            Keys are encrypted and saved — you won't be asked again.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(224,104,32,0.08)', border: '1.5px solid rgba(224,104,32,0.2)', borderRadius: 'var(--radius)', padding: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--orange)', borderRadius: 'var(--radius) var(--radius) 0 0' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--orange)', marginTop: 4, marginBottom: 8 }}>◐ LEFT</div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--navy)' }}>{leftProvider ? PROVIDER_LABELS[leftProvider] : ''}</div>
              <div style={{ fontSize: 12, color: 'var(--navy)', opacity: 0.5, marginTop: 4, fontFamily: 'var(--font-body)' }}>Analytical</div>
            </div>
            <div style={{ background: 'rgba(46,127,163,0.08)', border: '1.5px solid rgba(46,127,163,0.2)', borderRadius: 'var(--radius)', padding: '20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--teal)', borderRadius: 'var(--radius) var(--radius) 0 0' }} />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--teal)', marginTop: 4, marginBottom: 8 }}>◑ RIGHT</div>
              <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-body)', color: 'var(--navy)' }}>{rightProvider ? PROVIDER_LABELS[rightProvider] : ''}</div>
              <div style={{ fontSize: 12, color: 'var(--navy)', opacity: 0.5, marginTop: 4, fontFamily: 'var(--font-body)' }}>Creative</div>
            </div>
          </div>
          
          {saved && (
            <div style={{ 
              fontSize: 12, 
              padding: '12px 16px', 
              borderRadius: 'var(--radius)', 
              background: 'rgba(46,127,163,0.12)', 
              borderLeft: '5px solid var(--teal)',
              color: 'var(--navy)',
              marginBottom: 16
            }}>Saved! Setting up your workspace...</div>
          )}
          {error && (
            <div style={{ 
              fontSize: 12, 
              padding: '12px 16px', 
              borderRadius: '0 var(--radius) var(--radius) 0', 
              background: 'rgba(139,58,28,0.08)', 
              borderLeft: '5px solid var(--rust)',
              color: 'var(--rust)',
              marginBottom: 16
            }}>{error}</div>
          )}
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button 
              onClick={goBack}
              disabled={saving || saved}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: '2px solid rgba(26,43,60,0.18)',
                cursor: (saving || saved) ? 'not-allowed' : 'pointer',
                padding: '12px 28px',
                borderRadius: 'var(--radius)',
                background: 'transparent',
                color: 'var(--navy)',
                opacity: (saving || saved) ? 0.5 : 1,
                transition: 'all 0.15s'
              }}
            >← Back</button>
            <button 
              onClick={handleSave} 
              disabled={saving || saved}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: (saving || saved) ? 'not-allowed' : 'pointer',
                padding: '12px 28px',
                borderRadius: 'var(--radius)',
                background: 'var(--synthesis)',
                color: 'var(--offwhite)',
                opacity: (saving || saved) ? 0.5 : 1,
                transition: 'all 0.15s'
              }}
            >{saving ? 'Saving...' : '✓ Save and Start'}</button>
          </div>
        </>
      )}
    </div>
  )
}