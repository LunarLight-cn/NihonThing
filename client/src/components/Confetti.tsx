import React from 'react'

// Pure-CSS confetti burst for success moments. Every piece uses a theme token
// so the palette follows the Japanese red/white theme in both modes.
const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary-foreground))']
const BITS = [
  { left: '10%', color: COLORS[0], delay: '0s' },
  { left: '25%', color: COLORS[1], delay: '0.15s' },
  { left: '40%', color: COLORS[2], delay: '0.05s' },
  { left: '55%', color: COLORS[0], delay: '0.2s' },
  { left: '70%', color: COLORS[1], delay: '0.1s' },
  { left: '85%', color: COLORS[2], delay: '0.25s' },
  { left: '18%', color: COLORS[1], delay: '0.3s' },
  { left: '62%', color: COLORS[0], delay: '0.35s' },
  { left: '78%', color: COLORS[2], delay: '0.18s' }
]

export const Confetti: React.FC = () => (
  <div className="pointer-events-none absolute inset-x-0 -top-4 h-32 overflow-hidden" aria-hidden="true">
    {BITS.map((b, i) => (
      <span
        key={i}
        className="absolute top-0 w-2 h-3 rounded-sm"
        style={{ left: b.left, backgroundColor: b.color, animation: `nt-confetti 1.1s ease-in ${b.delay} forwards` }}
      />
    ))}
  </div>
)
