import { useMemo, useState } from 'react'
import { MARKETS, type Market } from './data'
import { usd } from './Browse'

// ---- deterministic fake data per market (stable across reloads)
function rng(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/** Random walk that ends exactly at the current price. */
function history(m: Market, n = 90) {
  const r = rng(m.id)
  const pts = [m.prob]
  for (let i = 1; i < n; i++) {
    const prev = pts[i - 1]
    pts.push(Math.min(0.99, Math.max(0.01, prev + (r() - 0.5) * 0.06)))
  }
  return pts.reverse()
}

const HANDLES = ['lemma_llama', 'tactic_goblin', 'ω-agent-7', 'simp_only', 'norm_num_enjoyer', 'aesop_fan', 'ring_nf', 'decide_or_die']
const FAILS = ["declaration uses 'sorry'", 'unsolved goals', 'statement mismatch', 'timeout (maxHeartbeats)', 'unknown identifier']

function submissions(m: Market) {
  const r = rng(m.id + 'subs')
  const n = Math.min(m.submissions, 6)
  return Array.from({ length: n }, (_, i) => {
    const verified = m.status === 'proven' && i === 0
    return {
      who: HANDLES[Math.floor(r() * HANDLES.length)],
      ago: `${1 + Math.floor(r() * 20) + i * 9}d ago`,
      lines: 40 + Math.floor(r() * 3000),
      verified,
      note: verified ? 'axioms: propext, Classical.choice, Quot.sound' : FAILS[Math.floor(r() * FAILS.length)],
    }
  })
}

function Chart({ pts }: { pts: number[] }) {
  const W = 600
  const H = 160
  const x = (i: number) => (i / (pts.length - 1)) * W
  const y = (v: number) => H - v * H
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Probability over the last 90 days">
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={0} x2={W} y1={y(g)} y2={y(g)} />
      ))}
      <path className="area" d={`${line} L${W},${H} L0,${H} Z`} />
      <path className="ln" d={line} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function MarketPage({ id, onBack, onProve }: { id: string; onBack: () => void; onProve: (id: string) => void }) {
  const m = MARKETS.find((x) => x.id === id)
  const [side, setSide] = useState<'Yes' | 'No'>('Yes')
  const [amount, setAmount] = useState(100)
  const [placed, setPlaced] = useState<string | null>(null)
  const pts = useMemo(() => (m ? history(m) : []), [m])
  const subs = useMemo(() => (m ? submissions(m) : []), [m])
  if (!m) return <p className="empty">Market not found ∅ <button className="link" onClick={onBack}>Back</button></p>

  const pct = Math.round(m.prob * 100)
  const open = m.status === 'open'
  const price = side === 'Yes' ? m.prob : 1 - m.prob
  const shares = amount / Math.max(price, 0.01)
  const closes = new Date(m.closes).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <article className="market">
      <button className="link back" onClick={onBack}>← All markets</button>

      <header className="mk-head">
        <span className="fld">{m.field} · difficulty {'◆'.repeat(m.difficulty)}{'◇'.repeat(5 - m.difficulty)}</span>
        <h2>{m.title}</h2>
        <pre className="mk-stmt">theorem {m.id.replace(/-/g, '_')} :{'\n'}    {m.statement}</pre>
      </header>

      <div className="mk-grid">
        <section className="mk-main">
          <div className="mk-price">
            <span className="big">{pct}%</span>
            <span className="fld">chance a proof compiles before {closes}</span>
            {open && m.change24h !== 0 && (
              <span className={m.change24h > 0 ? 'up' : 'down'}>
                {m.change24h > 0 ? '▲' : '▼'} {Math.abs(m.change24h).toFixed(1)} today
              </span>
            )}
            {!open && <span className={`badge ${m.status === 'proven' ? 'verified' : 'failed'}`}>{m.status === 'proven' ? '✓ resolved YES · proven in Lean' : m.status === 'disproven' ? '✗ resolved NO · disproven' : 'expired · resolved NO'}</span>}
          </div>
          <Chart pts={pts} />

          <dl className="mk-stats">
            <div><dt>Volume</dt><dd>{usd(m.volume)}</dd></div>
            <div><dt>Liquidity</dt><dd>{usd(m.liquidity)}</dd></div>
            <div><dt>Bounty</dt><dd>{usd(m.bounty)}</dd></div>
            <div><dt>Submissions</dt><dd>{m.submissions}</dd></div>
          </dl>

          <h3>Resolution</h3>
          <p className="mk-rules">
            Resolves <b>YES</b> as soon as a submitted Lean 4 file proves exactly the statement above, compiled
            against the pinned Mathlib version, with no <code>sorry</code> and no axioms beyond{' '}
            <code>propext</code>, <code>Classical.choice</code> and <code>Quot.sound</code>. Resolves <b>NO</b> if no
            such proof is verified by {closes}, or if a verified proof of the negation is submitted. The first
            verified prover receives the bounty.
          </p>

          <h3>Recent submissions</h3>
          <ul className="list mk-subs">
            {subs.map((x, i) => (
              <li key={i}>
                <div className="name">
                  <span className="t">@{x.who}</span>
                  <code>{x.note}</code>
                </div>
                <span className="num">{x.lines} lines</span>
                <span className={`badge ${x.verified ? 'verified' : 'failed'}`}>{x.verified ? '✓ verified' : '✗ rejected'}</span>
                <span className="num when">{x.ago}</span>
              </li>
            ))}
            {subs.length === 0 && <li className="empty">No submissions yet — be the first.</li>}
          </ul>
        </section>

        <aside className="mk-side">
          {open ? (
            <div className="trade-box">
              <div className="seg full">
                {(['Yes', 'No'] as const).map((s) => (
                  <button key={s} className={side === s ? 'on' : ''} onClick={() => { setSide(s); setPlaced(null) }}>
                    {s} {Math.round((s === 'Yes' ? m.prob : 1 - m.prob) * 100)}¢
                  </button>
                ))}
              </div>
              <label className="amt">
                Amount
                <input type="number" min={1} value={amount} onChange={(e) => { setAmount(Math.max(0, +e.target.value)); setPlaced(null) }} />
              </label>
              <div className="quote">
                <span>{shares.toFixed(0)} shares</span>
                <span>pays {usd(shares)} if {side}</span>
              </div>
              <button className="btn" onClick={() => setPlaced(`Order placed: ${usd(amount)} on ${side} (demo)`)}>Buy {side}</button>
              {placed && <p className="fld">{placed}</p>}
            </div>
          ) : (
            <div className="trade-box"><p className="fld">This market is closed for trading.</p></div>
          )}
          {open && (
            <div className="trade-box prove">
              <p>Have a proof? Submitting it resolves the market and claims the {usd(m.bounty)} bounty.</p>
              <button className="btn ghost" onClick={() => onProve(m.id)}>Submit a proof →</button>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
