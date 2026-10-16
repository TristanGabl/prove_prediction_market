import { useMemo, useRef, useState } from 'react'
import { MARKETS, ME, MY_POSITIONS, MY_SUBMISSIONS, type Submission } from './data'
import { usd } from './Browse'

type Tab = 'submit' | 'submissions' | 'positions'
const TABS: { key: Tab; label: string }[] = [
  { key: 'submit', label: 'Submit proof' },
  { key: 'submissions', label: 'Submissions' },
  { key: 'positions', label: 'Positions' },
]
const OPEN = MARKETS.filter((m) => m.status === 'open')
const byId = (id: string) => MARKETS.find((m) => m.id === id)!

const template = (id: string) => {
  const m = byId(id)
  return `import Mathlib\n\n-- ${m.title}\ntheorem ${m.id.replace(/-/g, '_')} :\n    ${m.statement} := by\n  sorry\n`
}

export function useAccount() {
  const [tab, setTab] = useState<Tab>('submit')
  const [query, setQuery] = useState('')
  const [market, setMarket] = useState(OPEN[0].id)
  const [submissions, setSubmissions] = useState(MY_SUBMISSIONS)
  return { tab, setTab, query, setQuery, market, setMarket, submissions, setSubmissions }
}
type AccountState = ReturnType<typeof useAccount>

export function AccountStats({ s }: { s: AccountState }) {
  const verified = s.submissions.filter((x) => x.status === 'verified')
  const earned = verified.reduce((t, x) => t + x.payout, 0)
  return (
    <>
      @{ME.handle} · {s.submissions.length} proofs submitted · {verified.length} verified · {usd(earned)} earned · {MY_POSITIONS.length} open positions
    </>
  )
}

/** Exactly four direct children, mirroring BrowseBar, so the morph pieces line up. */
export function AccountBar({ s }: { s: AccountState }) {
  return (
    <>
      <input className="search" placeholder="⌕ Search your activity…" value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
      <div className="seg">
        {TABS.map((t) => (
          <button key={t.key} className={s.tab === t.key ? 'on' : ''} onClick={() => s.setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <select value={s.market} onChange={(e) => s.setMarket(e.target.value)}>
        {OPEN.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>
      <button className="btn pill" onClick={() => s.setTab('submit')}>
        + New proof
      </button>
    </>
  )
}

export function AccountContent({ s }: { s: AccountState }) {
  if (s.tab === 'submit') return <SubmitDraft s={s} key={s.market} />
  const q = s.query.trim().toLowerCase()
  const match = (id: string) => !q || byId(id).title.toLowerCase().includes(q)
  if (s.tab === 'submissions')
    return (
      <ul className="list">
        {s.submissions.filter((x) => match(x.market)).map((x) => (
          <li key={x.id} className="row-sub">
            <div className="name">
              <span className="t">{byId(x.market).title}</span>
              <code>{x.note}</code>
            </div>
            <span className="fld">{x.submitted}</span>
            <span className="num">{x.lines} lines</span>
            <span className={`badge ${x.status}`}>{x.status === 'verified' ? '✓ verified' : x.status === 'failed' ? '✗ failed' : '◌ checking'}</span>
            <span className="num">{x.payout ? usd(x.payout) : '—'}</span>
          </li>
        ))}
      </ul>
    )
  return (
    <ul className="list">
      {MY_POSITIONS.filter((p) => match(p.market)).map((p) => {
        const m = byId(p.market)
        const now = p.side === 'Yes' ? m.prob : 1 - m.prob
        const pnl = (now - p.avg) * p.shares
        return (
          <li key={p.market} className="row-pos">
            <div className="name">
              <span className="t">{m.title}</span>
              <code>{m.statement}</code>
            </div>
            <span className={`side ${p.side}`}>{p.side}</span>
            <span className="num">{p.shares} @ {Math.round(p.avg * 100)}¢</span>
            <span className="num">now {Math.round(now * 100)}¢</span>
            <span className={`num ${pnl >= 0 ? 'up' : 'down'}`}>{pnl >= 0 ? '+' : '−'}{usd(Math.abs(pnl))}</span>
          </li>
        )
      })}
    </ul>
  )
}

type Check = { state: 'idle' | 'running' | 'ok' | 'fail'; log: string[] }

function SubmitDraft({ s }: { s: AccountState }) {
  const m = byId(s.market)
  const [code, setCode] = useState(() => template(s.market))
  const [stake, setStake] = useState(0)
  const [check, setCheck] = useState<Check>({ state: 'idle', log: [] })
  const timers = useRef<number[]>([])
  const lineCount = useMemo(() => code.split('\n').length, [code])

  const run = () => {
    timers.current.forEach(clearTimeout)
    const fail = /\bsorry\b|\badmit\b/.test(code) ? "error: declaration uses 'sorry'" : !code.includes(m.statement) ? 'error: theorem statement does not match the market statement' : null
    const steps = ['› lake env lean Submission.lean', '  resolving Mathlib @ v4.24.0…', '  elaborating…', '  type-checking kernel terms…']
    setCheck({ state: 'running', log: [] })
    steps.forEach((l, i) => timers.current.push(window.setTimeout(() => setCheck((c) => ({ ...c, log: [...c.log, l] })), 350 * (i + 1))))
    timers.current.push(
      window.setTimeout(() => {
        setCheck((c) => ({
          state: fail ? 'fail' : 'ok',
          log: [...c.log, fail ?? '✓ no errors · axioms: propext, Classical.choice, Quot.sound'],
        }))
        const sub: Submission = {
          id: `s${Date.now()}`,
          market: m.id,
          submitted: new Date().toISOString().slice(0, 16).replace('T', ' '),
          status: fail ? 'failed' : 'verified',
          lines: lineCount,
          note: fail ?? 'axioms: propext, Classical.choice, Quot.sound',
          payout: fail ? 0 : m.bounty,
        }
        s.setSubmissions((xs) => [sub, ...xs])
      }, 350 * (steps.length + 1) + 300),
    )
  }

  return (
    <div className="draft">
      <div className="draft-head">
        <div>
          <span className="fld">{m.field} · bounty {usd(m.bounty)} · market at {Math.round(m.prob * 100)}%</span>
          <h2>{m.title}</h2>
        </div>
        <span className="fld">draft · autosaved</span>
      </div>

      <div className="editor">
        <div className="gutter">{Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
        <textarea
          spellCheck={false}
          value={code}
          rows={Math.max(12, lineCount + 1)}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            // Tab indents inside the editor instead of switching pages
            if (e.key !== 'Tab') return
            e.preventDefault()
            const t = e.currentTarget
            const { selectionStart: a, selectionEnd: b } = t
            setCode(code.slice(0, a) + '  ' + code.slice(b))
            requestAnimationFrame(() => t.setSelectionRange(a + 2, a + 2))
          }}
        />
      </div>

      {check.log.length > 0 && (
        <pre className={`console ${check.state}`}>{check.log.join('\n')}{check.state === 'running' ? '\n▍' : ''}</pre>
      )}

      <div className="draft-foot">
        <label className="stake">
          <span>Back your own proof with <b>{usd(stake)}</b> on Yes</span>
          <input type="range" min={0} max={5000} step={100} value={stake} onChange={(e) => setStake(+e.target.value)} />
        </label>
        <button className="btn ghost" onClick={() => setCode(template(s.market))}>Reset</button>
        <button className="btn" disabled={check.state === 'running'} onClick={run}>
          {check.state === 'running' ? 'Checking…' : 'Verify & submit'}
        </button>
      </div>
    </div>
  )
}
