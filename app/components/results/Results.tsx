'use client'
import { useState } from 'react'

interface ResultsProps {
  resultId: string
  leftOutput: string
  finalOutput: string
  preflightSanity: boolean
  preflightBalance: boolean
  preflightQuality: boolean
  faultOrigin: 'left' | 'right' | 'ambiguous' | null
  retryCount: number
  onNewQuery: () => void
}

const STAR_LABELS = ['', 'Not helpful', 'Somewhat helpful', 'Pretty good', 'Really good', 'Excellent']

export default function Results({
  resultId, leftOutput, finalOutput,
  preflightSanity, preflightBalance, preflightQuality,
  faultOrigin, retryCount, onNewQuery
}: ResultsProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [showLeft, setShowLeft] = useState(false)
  const [ratingError, setRatingError] = useState('')

  const allPassed = preflightSanity && preflightBalance && preflightQuality

  const submitRating = async (val: number) => {
    if (submitted) return
    setRating(val)
    setSubmitted(true)
    try {
      await fetch('/api/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resultId, rating: val }),
      })
    } catch {
      setRatingError('Could not save rating.')
    }
  }

  const displayRating = submitted ? rating : hovered

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>Result</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'Sanity', pass: preflightSanity },
            { label: 'Balance', pass: preflightBalance },
            { label: 'Quality', pass: preflightQuality },
          ].map(({ label, pass }) => (
            <span key={label} style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 4,
              background: pass ? 'var(--dt-right-bg)' : '#FAEEDA',
              color: pass ? 'var(--dt-right-text)' : '#633806',
            }}>
              {pass ? '✓' : '!'} {label}
            </span>
          ))}
        </div>
      </div>

      {/* Flags */}
      {faultOrigin === 'ambiguous' && (
        <div className="warning-note">
          ⚠ The query may have been too ambiguous for a confident answer. Consider rephrasing and running again.
        </div>
      )}
      {retryCount > 0 && faultOrigin !== 'ambiguous' && (
        <div className="success-note">
          ↻ Pre-flight flagged an issue — auto-corrected in {retryCount === 1 ? '1 pass' : `${retryCount} passes`}.
        </div>
      )}

      {/* Final output */}
      <div style={{
        background: '#fff', border: '0.5px solid #c8c8c0',
        borderRadius: 8, padding: '1rem', marginBottom: '1rem'
      }}>
        <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--dt-right-text)', marginBottom: 8 }}>
          Final — dual hemisphere output
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.75, color: '#1a1a1a', whiteSpace: 'pre-wrap' }}>
          {finalOutput}
        </div>
      </div>

      {/* Toggle left draft */}
      <button onClick={() => setShowLeft(v => !v)} style={{
        fontSize: 12, color: 'var(--dt-left)', background: 'none', border: 'none',
        padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
        marginBottom: '1rem', fontFamily: 'inherit'
      }}>
        {showLeft ? '▲' : '▼'} {showLeft ? 'Hide' : 'Show'} Left hemisphere draft
      </button>

      {showLeft && (
        <div style={{
          background: 'var(--dt-left-bg)', border: '0.5px solid var(--dt-left-border)',
          borderRadius: 8, padding: '1rem', marginBottom: '1rem'
        }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--dt-left-label)', marginBottom: 8 }}>
            Left hemisphere — raw analytical draft
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--dt-left-body)', whiteSpace: 'pre-wrap' }}>
            {leftOutput}
          </div>
        </div>
      )}

      {/* Star rating */}
      <div style={{ borderTop: '0.5px solid #e8e8e0', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: '0.75rem' }}>
          Rate this result — how did the dual hemisphere approach do?
        </div>
        <div style={{ display: 'flex', gap: 4, marginBottom: '0.5rem' }}>
          {[1,2,3,4,5].map(val => (
            <span
              key={val}
              onClick={() => !submitted && submitRating(val)}
              onMouseEnter={() => !submitted && setHovered(val)}
              onMouseLeave={() => !submitted && setHovered(0)}
              style={{
                fontSize: 30,
                lineHeight: 1,
                cursor: submitted ? 'default' : 'pointer',
                color: val <= displayRating
                  ? (submitted ? 'var(--dt-star)' : 'var(--dt-star-hover)')
                  : '#d0d0c8',
                transition: 'color 0.1s, transform 0.1s',
                transform: (!submitted && val <= hovered) ? 'scale(1.15)' : 'scale(1)',
                display: 'inline-block',
                userSelect: 'none',
              }}
            >★</span>
          ))}
        </div>
        {!submitted && hovered > 0 && (
          <div style={{ fontSize: 13, color: '#666' }}>{STAR_LABELS[hovered]}</div>
        )}
        {submitted && (
          <div style={{ fontSize: 13, color: 'var(--dt-right-text)', fontWeight: 500 }}>
            {rating === 5 ? `★ ${STAR_LABELS[rating]} — thanks for validating the experiment!` : `${STAR_LABELS[rating]} — thanks, this helps.`}
          </div>
        )}
        {!submitted && hovered === 0 && (
          <div style={{ fontSize: 12, color: '#aaa' }}>Your rating helps validate the experiment.</div>
        )}
        {ratingError && <div style={{ fontSize: 12, color: '#A32D2D', marginTop: 4 }}>{ratingError}</div>}
      </div>

      <div className="btn-row">
        <button className="btn" onClick={onNewQuery}>↺ New query</button>
      </div>
    </div>
  )
}
