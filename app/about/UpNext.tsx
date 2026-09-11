export default function UpNext() {
  return (
    <section style={{
      padding: '0 24px 60px',
      maxWidth: 960,
      margin: '0 auto',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{
        background: 'var(--offwhite)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px',
        border: '1px dashed rgba(26,43,60,0.2)',
        position: 'relative'
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--rust)',
          display: 'block',
          marginBottom: 12
        }}>Up Next</span>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 24,
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--navy)',
          marginBottom: 16,
          lineHeight: 1.1
        }}>Expanding the experiment</h2>
        <p style={{
          fontSize: 15,
          lineHeight: 1.7,
          color: 'var(--navy)',
          opacity: 0.85,
          fontFamily: 'var(--font-body)',
          marginBottom: 20
        }}>
          Duotronics is an ongoing experiment. These are the next levers we're building to widen what can be tested.
        </p>
        <ul style={{
          margin: 0,
          paddingLeft: 18,
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          lineHeight: 1.8,
          color: 'var(--navy)',
          opacity: 0.9
        }}>
          <li>
            <strong>User-selectable models per hemisphere</strong> — choose the specific model under each chosen AI provider, instead of auto-assigned tiers, to broaden experiment parameters.
          </li>
        </ul>
      </div>
    </section>
  )
}