'use client'

interface MarqueeProps {
  items: string[]
  dotChar?: string
  speed?: string
}

export function Marquee({ items, dotChar = '✦', speed = '30s' }: MarqueeProps) {
  const repeated = [...items, ...items]

  return (
    <>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-scroll ${speed} linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div style={{ overflow: 'hidden', width: '100%' }} aria-hidden="true">
        <div className="marquee-track">
          {repeated.map((item, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0 1.5rem',
                whiteSpace: 'nowrap',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: 'rgba(196,132,26,0.6)', fontSize: '8px' }}>{dotChar}</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
