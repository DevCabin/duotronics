'use client'
import { useState } from 'react'

interface IntakeFormProps {
  onSubmit: (q1: string, q2: string, q3: string) => void
  loading: boolean
}

export default function IntakeForm({ onSubmit, loading }: IntakeFormProps) {
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [q3, setQ3] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!q1.trim() || !q2.trim() || !q3.trim()) {
      setError('Please answer all three questions before continuing.')
      return
    }
    setError('')
    onSubmit(q1.trim(), q2.trim(), q3.trim())
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: '0.5rem' }}>What do you need?</h2>
      <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Three questions so both hemispheres have a clear target to work toward.
      </p>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
          1. What do you want to achieve?
        </label>
        <p style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>
          Be specific. "Help me write a rejection email to a job applicant" beats "help with email."
        </p>
        <textarea value={q1} onChange={e => setQ1(e.target.value)}
          placeholder="Describe your goal..." disabled={loading} />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
          2. Who is this for, and what's the context?
        </label>
        <p style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>
          Audience, setting, tone expectations — anything that shapes the output.
        </p>
        <textarea value={q2} onChange={e => setQ2(e.target.value)}
          placeholder="Audience and context..." disabled={loading} />
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
          3. What does a good answer look like to you?
        </label>
        <p style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>
          Format, length, what to include or avoid.
        </p>
        <textarea value={q3} onChange={e => setQ3(e.target.value)}
          placeholder="What success looks like..." disabled={loading} />
      </div>

      {error && <div className="error-note">{error}</div>}

      <div className="btn-row">
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Running hemispheres...' : 'Run both hemispheres →'}
        </button>
      </div>
    </div>
  )
}
