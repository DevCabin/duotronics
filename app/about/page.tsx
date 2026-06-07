export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
      {/* Grain overlay inherited from body */}
      
      {/* Top-right swoosh */}
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
      
      {/* Bottom-left swoosh - reversed */}
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

      {/* Navigation */}
      <nav style={{
        background: 'var(--navy)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'relative',
        zIndex: 10,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, var(--orange) 0%, var(--orange-lt) 33%, var(--teal-lt) 66%, var(--teal) 100%)'
        }} />
        <a href="/" style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 22,
          color: 'var(--offwhite)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textDecoration: 'none'
        }}>
          Duotronics
        </a>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href="/" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'rgba(242,237,224,0.65)',
            textDecoration: 'none',
            transition: 'color 0.2s'
          }}>
            App
          </a>
          <a href="/about" style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--orange-lt)',
            textDecoration: 'none'
          }}>
            About
          </a>
        </div>
      </nav>

      {/* Stripe rule */}
      <div style={{
        height: 8,
        background: 'repeating-linear-gradient(90deg, var(--orange) 0px, var(--orange) 60px, var(--orange-lt) 60px, var(--orange-lt) 120px, var(--teal-lt) 120px, var(--teal-lt) 180px, var(--teal) 180px, var(--teal) 240px)',
        position: 'relative',
        zIndex: 1
      }} />

      {/* Hero Section */}
      <section style={{
        padding: '80px 24px 60px',
        maxWidth: 960,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--teal)',
          display: 'block',
          marginBottom: 16
        }}>✦ Research Program</span>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(44px, 7vw, 88px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
          lineHeight: 0.95,
          color: 'var(--navy)',
          marginBottom: 24
        }}>
          About<br/>
          <span style={{ fontStyle: 'italic', fontWeight: 400, fontSize: '0.6em', color: 'var(--rust)' }}>This</span><br/>
          Project
        </h1>
      </section>

      {/* Lead Block */}
      <section style={{
        padding: '0 24px 60px',
        maxWidth: 960,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: 'var(--offwhite)',
          border: '1px solid rgba(26,43,60,0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: 'var(--synthesis)'
          }} />
          <p style={{
            fontSize: 20,
            lineHeight: 1.65,
            color: 'var(--navy)',
            fontFamily: 'var(--font-body)',
            margin: 0,
            fontWeight: 500
          }}>
            Duotronics is an experimental AI architecture designed to explore a simple question:
          </p>
          <p style={{
            fontSize: 24,
            lineHeight: 1.4,
            color: 'var(--navy)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            marginTop: 24,
            marginBottom: 0,
            fontStyle: 'italic'
          }}>
            "Can multiple AI systems working through specialized cognitive stages produce better results than a single AI model working alone?"
          </p>
        </div>
      </section>

      {/* Stripe rule */}
      <div style={{
        height: 4,
        background: 'repeating-linear-gradient(90deg, var(--orange) 0px, var(--orange) 60px, var(--orange-lt) 60px, var(--orange-lt) 120px, var(--teal-lt) 120px, var(--teal-lt) 180px, var(--teal) 180px, var(--teal) 240px)',
        maxWidth: 960,
        margin: '0 auto 60px',
        position: 'relative',
        zIndex: 1
      }} />

      {/* Split Panels */}
      <section style={{
        padding: '0 24px 60px',
        maxWidth: 960,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          border: '1px solid rgba(26,43,60,0.1)'
        }}>
          {/* Left panel */}
          <div style={{
            padding: 40,
            background: 'var(--offwhite)',
            borderRight: '1px solid rgba(26,43,60,0.08)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'rgba(26,43,60,0.2)'
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'rgba(26,43,60,0.5)',
              display: 'block',
              marginBottom: 12,
              marginTop: 4
            }}>The Traditional Way</span>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--navy)',
              marginBottom: 16,
              lineHeight: 1.1
            }}>One Model<br/>One Pass</h3>
            <p style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: 'var(--navy)',
              opacity: 0.8,
              fontFamily: 'var(--font-body)',
              margin: 0
            }}>
              Most modern AI applications rely on a single model generating a response in one pass. Ask a question, get an answer. Simple, fast, but limited to one perspective and one round of processing.
            </p>
          </div>

          {/* Right panel */}
          <div style={{
            padding: 40,
            background: 'var(--offwhite)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'var(--synthesis)'
            }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--synthesis)',
              display: 'block',
              marginBottom: 12,
              marginTop: 4
            }}>The Duotronics Way</span>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 24,
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--navy)',
              marginBottom: 16,
              lineHeight: 1.1
            }}>Multiple<br/>Stages</h3>
            <p style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: 'var(--navy)',
              opacity: 0.8,
              fontFamily: 'var(--font-body)',
              margin: 0
            }}>
              An analytical system performs initial reasoning. A second system reviews, refines, and synthesizes. A final quality stage validates. Each step can catch what the previous missed.
            </p>
          </div>
        </div>
      </section>

      {/* Research Context Card */}
      <section style={{
        padding: '0 24px 60px',
        maxWidth: 960,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: 'var(--navy)',
          borderRadius: 'var(--radius-lg)',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
        }}>
          <div style={{
            position: 'absolute',
            bottom: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            boxShadow: '0 0 0 18px rgba(244,161,53,0.18), 0 0 0 36px rgba(224,104,32,0.13), 0 0 0 54px rgba(91,175,203,0.09)',
            pointerEvents: 'none'
          }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--orange-lt)',
            display: 'block',
            marginBottom: 16,
            position: 'relative',
            zIndex: 1
          }}>DevCabin Research</span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--offwhite)',
            marginBottom: 20,
            lineHeight: 1,
            position: 'relative',
            zIndex: 1
          }}>An Open<br/>Experiment</h2>
          <p style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: 'rgba(242,237,224,0.75)',
            fontFamily: 'var(--font-body)',
            maxWidth: 600,
            margin: '0 auto 24px',
            position: 'relative',
            zIndex: 1
          }}>
            Duotronics is the first active research program within DevCabin Research. All findings, successes, failures, revisions, and critiques are part of the research process and documented publicly.
          </p>
          <p style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: 'rgba(242,237,224,0.75)',
            fontFamily: 'var(--font-body)',
            maxWidth: 600,
            margin: '0 auto',
            position: 'relative',
            zIndex: 1
          }}>
            The goal is not to prove a predetermined conclusion. The goal is to test ideas, measure outcomes, invite criticism, and learn what actually works.
          </p>
        </div>
      </section>

      {/* Human Summary Blockquote */}
      <section style={{
        padding: '0 24px 60px',
        maxWidth: 960,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          borderLeft: '6px solid var(--orange)',
          padding: '24px 32px',
          background: 'rgba(224,104,32,0.06)',
          borderRadius: '0 var(--radius-lg) var(--radius-lg) 0'
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--orange)',
            display: 'block',
            marginBottom: 16
          }}>Human Summary</span>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            fontStyle: 'italic',
            color: 'var(--rust)',
            marginBottom: 16,
            lineHeight: 1.3
          }}>
            "Most AI tools ask one model one question and return the answer. Duotronics asks whether assigning different jobs to different AI systems—analysis, review, refinement, and validation—can produce better results than a single model acting alone."
          </p>
          <p style={{
            fontSize: 15,
            lineHeight: 1.75,
            color: 'var(--navy)',
            opacity: 0.7,
            fontFamily: 'var(--font-body)',
            margin: 0
          }}>
            The answer may ultimately be yes, no, or somewhere in between. This project exists to find out.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '0 24px 80px',
        maxWidth: 960,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          margin: '40px 0',
          position: 'relative'
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(26,43,60,0.14)' }} />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--tan)',
            whiteSpace: 'nowrap'
          }}>Learn More</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(26,43,60,0.14)' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontSize: 17,
            lineHeight: 1.65,
            color: 'var(--navy)',
            fontFamily: 'var(--font-body)',
            marginBottom: 28,
            fontWeight: 500
          }}>
            Interested in the research behind Duotronics?
          </p>
          <p style={{
            fontSize: 15,
            lineHeight: 1.75,
            color: 'var(--navy)',
            opacity: 0.7,
            fontFamily: 'var(--font-body)',
            marginBottom: 28
          }}>
            Visit the DevCabin Research page for methodology, research notes, active experiments, and project updates.
          </p>
          <a 
            href="https://devcabin.com/research"
            target="_blank" 
            rel="noreferrer"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              padding: '16px 36px',
              borderRadius: 'var(--radius)',
              background: 'var(--orange)',
              color: 'var(--offwhite)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s'
            }}
          >
            Visit DevCabin Research →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'var(--navy)',
        color: 'rgba(242,237,224,0.55)',
        padding: '56px 24px 32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: '50%',
          boxShadow: '0 0 0 18px rgba(244,161,53,0.18), 0 0 0 36px rgba(224,104,32,0.13), 0 0 0 54px rgba(91,175,203,0.09)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: 960, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 26,
            textTransform: 'uppercase',
            color: 'var(--offwhite)',
            marginBottom: 8
          }}>
            Duotronics
          </div>
          <p style={{ color: 'rgba(242,237,224,0.4)', fontSize: 13, fontFamily: 'var(--font-body)' }}>
            Dual hemisphere AI processing — an experiment.
          </p>
          <div style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: '1px solid rgba(242,237,224,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'rgba(242,237,224,0.28)'
          }}>
            <span>© {new Date().getFullYear()} DevCabin Research</span>
            <a href="https://github.com/DevCabin/duotronics" style={{ color: 'rgba(242,237,224,0.5)' }}>GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}