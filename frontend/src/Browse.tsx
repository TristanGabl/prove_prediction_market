import { useMemo, useState } from 'react'
import { FIELDS, MARKETS, type Field, type Market, type Status } from './data'

const SORTS = {
  volume: { label: 'Volume', fn: (a: Market, b: Market) => b.volume - a.volume },
  trending: { label: 'Trending', fn: (a: Market, b: Market) => Math.abs(b.change24h) - Math.abs(a.change24h) },
  closing: { label: 'Closing soon', fn: (a: Market, b: Market) => +new Date(a.closes) - +new Date(b.closes) },
  bounty: { label: 'Bounty', fn: (a: Market, b: Market) => b.bounty - a.bounty },
  probHigh: { label: 'Most likely', fn: (a: Market, b: Market) => b.prob - a.prob },
  probLow: { label: 'Least likely', fn: (a: Market, b: Market) => a.prob - b.prob },
  newest: { label: 'Newest', fn: (a: Market, b: Market) => +new Date(b.created) - +new Date(a.created) },
} as const
type SortKey = keyof typeof SORTS

const STATUSES: { key: Status | 'all'; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'proven', label: 'Proven' },
  { key: 'disproven', label: 'Disproven' },
  { key: 'all', label: 'All' },
]

const money = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
export const usd = (n: number) => `$${money.format(n)}`

function closesIn(m: Market) {
  if (m.status === 'proven') return '✓ proven'
  if (m.status === 'disproven') return '✗ disproven'
  if (m.status === 'expired') return 'expired'
  const days = Math.round((+new Date(m.closes) - Date.now()) / 864e5)
  if (days < 60) return `${days}d`
  if (days < 730) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}

export function useBrowse() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status | 'all'>('open')
  const [field, setField] = useState<Field | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('volume')
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MARKETS.filter(
      (m) =>
        (!q || m.title.toLowerCase().includes(q) || m.statement.toLowerCase().includes(q)) &&
        (status === 'all' || m.status === status) &&
        (field === 'all' || m.field === field),
    ).sort(SORTS[sort].fn)
  }, [query, status, field, sort])
  return { query, setQuery, status, setStatus, field, setField, sort, setSort, results }
}
type BrowseState = ReturnType<typeof useBrowse>

export function BrowseStats() {
  const open = MARKETS.filter((m) => m.status === 'open').length
  const vol = MARKETS.reduce((s, m) => s + m.volume, 0)
  const subs = MARKETS.reduce((s, m) => s + m.submissions, 0)
  const proven = MARKETS.filter((m) => m.status === 'proven').length
  return <>{open} open · {usd(vol)} volume · {subs} proofs submitted · {proven} verified by Lean</>
}

/** Exactly four direct children: each is the landing spot of one morph piece. */
export function BrowseBar({ s }: { s: BrowseState }) {
  return (
    <>
      <input className="search" placeholder="⌕ Search markets…" value={s.query} onChange={(e) => s.setQuery(e.target.value)} />
      <div className="seg">
        {STATUSES.map((st) => (
          <button key={st.key} className={s.status === st.key ? 'on' : ''} onClick={() => s.setStatus(st.key)}>
            {st.label}
          </button>
        ))}
      </div>
      <select value={s.field} onChange={(e) => s.setField(e.target.value as Field | 'all')}>
        <option value="all">All fields</option>
        {FIELDS.map((f) => (
          <option key={f}>{f}</option>
        ))}
      </select>
      <select value={s.sort} onChange={(e) => s.setSort(e.target.value as SortKey)}>
        {(Object.keys(SORTS) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            Sort: {SORTS[k].label}
          </option>
        ))}
      </select>
    </>
  )
}

export function BrowseList({ s }: { s: BrowseState }) {
  return (
    <ul className="list">
      {s.results.map((m) => {
        const pct = Math.round(m.prob * 100)
        return (
          <li key={m.id} className={m.status !== 'open' ? 'resolved' : ''}>
            <div className="name">
              <span className="t">{m.title}</span>
              <code>{m.statement}</code>
            </div>
            <span className="fld">{m.field}</span>
            <span className="pct">
              {pct}%
              <i style={{ width: `${pct}%` }} />
            </span>
            <span className="num">{usd(m.volume)}</span>
            <span className="num when">{closesIn(m)}</span>
          </li>
        )
      })}
      {s.results.length === 0 && <li className="empty">No markets match ∅</li>}
    </ul>
  )
}
