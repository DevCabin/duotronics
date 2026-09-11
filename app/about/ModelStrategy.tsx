export default function ModelStrategy() {
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
        padding: '48px',
        border: '1px solid rgba(26,43,60,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: 'linear-gradient(90deg, var(--orange) 0%, var(--teal) 100%)'
        }} />
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--teal)',
          display: 'block',
          marginBottom: 16,
          marginTop: 4
        }}>Model Strategy</span>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 28,
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--navy)',
          marginBottom: 20,
          lineHeight: 1.1
        }}>Cheap Left. Capable Right.</h2>
        <p style={{
          fontSize: 16,
          lineHeight: 1.75,
          color: 'var(--navy)',
          opacity: 0.85,
          fontFamily: 'var(--font-body)',
          marginBottom: 24
        }}>
          Duotronics pairs two different models from two different providers. The Left Hemisphere is a cheap-but-passable chat model that drafts the analytical answer. The Right Hemisphere is a highly capable model — one or two tiers below frontier — that checks accuracy against the original query and humanizes the response.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 32
        }}>
          <div style={{
            background: 'rgba(224,104,32,0.06)',
            border: '1px solid rgba(224,104,32,0.15)',
            borderRadius: 'var(--radius)',
            padding: '24px'
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--orange)',
              display: 'block',
              marginBottom: 12
            }}>Left Hemisphere</span>
            <p style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: 'var(--navy)',
              opacity: 0.85,
              fontFamily: 'var(--font-body)',
              margin: 0
            }}>
              Logic, structure, accuracy. Uses the cheapest passable chat model for each provider so the first draft is fast and inexpensive.
            </p>
          </div>
          <div style={{
            background: 'rgba(46,127,163,0.06)',
            border: '1px solid rgba(46,127,163,0.15)',
            borderRadius: 'var(--radius)',
            padding: '24px'
          }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--teal)',
              display: 'block',
              marginBottom: 12
            }}>Right Hemisphere</span>
            <p style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: 'var(--navy)',
              opacity: 0.85,
              fontFamily: 'var(--font-body)',
              margin: 0
            }}>
              Quality control and voice. Uses a strong, non-frontier model to verify accuracy, re-process if confidence is below 85%, and then humanize the final output.
            </p>
          </div>
        </div>

        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--navy)',
          marginBottom: 16
        }}>Current Model Pairing</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            color: 'var(--navy)'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(26,43,60,0.15)' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700 }}>Provider</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700 }}>Left (cheap)</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700 }}>Right (capable)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(26,43,60,0.08)' }}>
                <td style={{ padding: '10px 8px' }}>Anthropic</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>claude-3-5-haiku-20241022</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>claude-sonnet-4-5-latest</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(26,43,60,0.08)' }}>
                <td style={{ padding: '10px 8px' }}>OpenAI</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>gpt-4o-mini</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>gpt-4o</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(26,43,60,0.08)' }}>
                <td style={{ padding: '10px 8px' }}>Google</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>gemini-2.0-flash</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>gemini-2.5-flash</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(26,43,60,0.08)' }}>
                <td style={{ padding: '10px 8px' }}>Moonshot</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>moonshot-v1-8k</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>moonshot-v1-32k</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 8px' }}>xAI</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>grok-2-mini</td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontSize: 13 }}>grok-2-1212</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
