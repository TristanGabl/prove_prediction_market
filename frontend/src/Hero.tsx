import type { CSSProperties, ReactNode, RefObject } from 'react'

type Shape = { x: number; y: number; s: number; r: number; lilac?: boolean }

const GLYPHS = ['∀', '∫', 'λ', '∑', '⊢', '∃', 'π', '→', '∞', '√', '≡', '∂', 'ℕ', '∘', '⊥', '∈']

// Positions in % of the title block; negative / >100 values sit just outside it.
const SHAPES: Shape[] = [
  // left cluster
  { x: -6, y: 8, s: 14, r: -8 },
  { x: -12, y: 30, s: 10, r: 10 },
  { x: -4, y: 42, s: 18, r: 6, lilac: true },
  { x: -18, y: 14, s: 8, r: 20 },
  { x: -14, y: 58, s: 16, r: -12 },
  { x: -7, y: 74, s: 11, r: 30, lilac: true },
  { x: -22, y: 44, s: 9, r: 4 },
  { x: -10, y: 92, s: 13, r: -6 },
  // right cluster
  { x: 102, y: 4, s: 12, r: 6 },
  { x: 109, y: 22, s: 18, r: -10 },
  { x: 118, y: 10, s: 9, r: 14, lilac: true },
  { x: 104, y: 46, s: 15, r: 4, lilac: true },
  { x: 114, y: 52, s: 11, r: 22 },
  { x: 122, y: 36, s: 8, r: -18 },
  { x: 108, y: 76, s: 17, r: 8, lilac: true },
  { x: 119, y: 88, s: 10, r: -14 },
]

export type Mode = 'browse' | 'account'

const mixBg = (dark: number) => `color-mix(in srgb, var(--ink) ${(clamp01(dark) * 100).toFixed(1)}%, var(--bg))`
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Welcome block. `m` blends between modes (0 = browse active, 1 = account active).
 * Once scrolling starts (`started`), the active button is replaced by the morphing pieces,
 * so it fades out while the inactive one stays as a ghost.
 */
export default function Hero({
  browseRef,
  accountRef,
  m,
  stats,
  onPick,
}: {
  browseRef: RefObject<HTMLButtonElement | null>
  accountRef: RefObject<HTMLButtonElement | null>
  m: number
  stats: ReactNode
  onPick: (mode: Mode) => void
}) {
  const btn = (dark: number): CSSProperties => ({
    background: mixBg(dark),
    color: dark > 0.5 ? 'var(--bg)' : 'var(--ink)',
  })
  return (
    <main className="hero">
      <div className="stage">
        {SHAPES.map((sh, i) => {
          const style = {
            left: `${sh.x}%`,
            top: `${sh.y}%`,
            fontSize: sh.s * 1.7,
            '--r': `${sh.r}deg`,
            '--dx': `${((i * 37) % 21) - 10}px`,
            '--dy': `${((i * 53) % 21) - 10}px`,
            '--dur': `${4 + (i % 4) * 1.3}s`,
            '--delay': `${-((i * 0.77) % 5)}s`,
          } as CSSProperties
          return (
            <span key={i} className={`shape${sh.lilac ? ' lilac' : ''}`} style={style}>
              {GLYPHS[i % GLYPHS.length]}
            </span>
          )
        })}
        <h1 className="title">
          Proof prediction
          <span className="market">market</span>
        </h1>
      </div>
      <p className="tagline">
        Bet on whether a theorem will be proven. Submissions are checked by <code>Lean</code>, and
        markets resolve the moment a proof compiles.
      </p>
      <div className="stats-line">{stats}</div>
      <div className="cta">
        <button ref={browseRef} className="btn" style={btn(1 - m)} onClick={() => onPick('browse')}>
          Browse markets
        </button>
        <button ref={accountRef} className="btn" style={btn(m)} onClick={() => onPick('account')}>
          Own account
        </button>
        <div className="tab-hint"><kbd>tab</kbd> to switch</div>
      </div>
    </main>
  )
}
