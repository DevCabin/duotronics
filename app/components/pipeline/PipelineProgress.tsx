'use client'

export type StageId =
  | 'left-analyze'
  | 'left-check'
  | 'handoff'
  | 'right-refine'
  | 'right-check'
  | 'preflight'

export type StageStatus = 'pending' | 'active' | 'done' | 'error'

export interface StageState {
  id: StageId
  label: string
  sub: string
  hemi: 'left' | 'right' | 'neutral'
  status: StageStatus
}

export const INITIAL_STAGES: StageState[] = [
  { id: 'left-analyze', label: 'Left hemisphere — analysis', sub: 'Structuring facts and logic', hemi: 'left', status: 'pending' },
  { id: 'left-check', label: 'Left self-check', sub: 'Find the flaw, not confirm', hemi: 'left', status: 'pending' },
  { id: 'handoff', label: 'Handoff payload', sub: 'Answer + reasoning stub', hemi: 'neutral', status: 'pending' },
  { id: 'right-refine', label: 'Right hemisphere — refinement', sub: 'Warmth, voice, humanity', hemi: 'right', status: 'pending' },
  { id: 'right-check', label: 'Right self-check', sub: 'Substance preserved?', hemi: 'right', status: 'pending' },
  { id: 'preflight', label: 'Pre-flight scan', sub: 'Sanity · Balance · Quality', hemi: 'neutral', status: 'pending' },
]

interface PipelineProgressProps {
  stages: StageState[]
  subtitle: string
}

const HEMI_COLORS = {
  left: { border: 'var(--dt-left)', bg: 'var(--dt-left-bg)', icon: 'var(--dt-left)' },
  right: { border: 'var(--dt-right)', bg: 'var(--dt-right-bg)', icon: 'var(--dt-right)' },
  neutral: { border: 'var(--dt-accent)', bg: 'var(--dt-accent-bg)', icon: 'var(--dt-accent)' },
}

const STAGE_ICONS: Record<StageId, string> = {
  'left-analyze': '◈',
  'left-check': '⟳',
  'handoff': '→',
  'right-refine': '◑',
  'right-check': '⟳',
  'preflight': '✦',
}

export default function PipelineProgress({ stages, subtitle }: PipelineProgressProps) {
  return (
    <div className="card">
      <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: '0.25rem' }}>Processing</h2>
      <p style={{ fontSize: 14, color: '#666', marginBottom: '1.5rem' }}>{subtitle}</p>

      <div>
        {stages.map((stage, i) => {
          const isActive = stage.status === 'active'
          const isDone = stage.status === 'done'
          const colors = HEMI_COLORS[stage.hemi]

          return (
            <div key={stage.id}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0.875rem 1rem',
                border: isActive ? `0.5px solid ${colors.border}` : isDone ? '0.5px solid var(--dt-right-border)' : '0.5px solid #e8e8e0',
                borderRadius: 8,
                background: isActive ? colors.bg : isDone ? '#f8fdf9' : '#fff',
                opacity: stage.status === 'pending' ? 0.45 : 1,
                transition: 'all 0.3s',
              }}>
                <div style={{
                  fontSize: 16,
                  width: 20,
                  textAlign: 'center',
                  color: isDone ? 'var(--dt-right)' : isActive ? colors.icon : '#bbb',
                  flexShrink: 0,
                }}>
                  {isDone ? '✓' : STAGE_ICONS[stage.id]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{stage.label}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{stage.sub}</div>
                </div>
                <div style={{
                  fontSize: 12,
                  color: isDone ? 'var(--dt-right-text)' : isActive ? colors.icon : '#bbb',
                  fontWeight: isDone ? 500 : 400,
                }}>
                  {stage.status === 'pending' ? 'waiting' : stage.status === 'active' ? 'running...' : stage.status === 'done' ? 'done' : 'error'}
                </div>
              </div>
              {i < stages.length - 1 && (
                <div style={{ width: 1, height: 10, background: '#e0e0d8', margin: '0 0 0 30px' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
