import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Hero, { type Mode } from './Hero'
import { BrowseBar, BrowseList, BrowseStats, useBrowse } from './Browse'
import { AccountBar, AccountContent, AccountStats, useAccount } from './Account'

type Rect = { x: number; y: number; w: number; h: number }
type Layout = {
  btn: Record<Mode, Rect> // hero buttons, document coords
  panel: { x: number; y: number; w: number }
}

const PANEL_BG = '#f1ecfd'
const BLEND_MS = 550

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

function docRect(el: Element): Rect {
  const r = el.getBoundingClientRect()
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height }
}

/** Rising tail from the panel's top edge (y = T) to the pill `a`, meeting its sides at mid-height.
 * Returned as path segments that start at the left foot and end at the right foot, both tangent to the edge. */
function tail(T: number, a: Rect, L: number, R: number) {
  const ax1 = a.x
  const ax2 = a.x + a.w
  const ay = a.y + a.h / 2
  const h = T - ay
  if (h <= 2) return null
  const sp = Math.min(h * 0.6, 180)
  const lf = Math.max(L + 28, ax1 - sp)
  const rf = Math.min(R - 28, ax2 + sp)
  return {
    lf,
    rf,
    // the two sides alone (no segment behind the button), for the dashed background bubble
    sides: `M${lf},${T} C${lf + (ax1 - lf) * 0.6},${T} ${ax1},${ay + h * 0.5} ${ax1},${ay} M${ax2},${ay} C${ax2},${ay + h * 0.5} ${rf - (rf - ax2) * 0.6},${T} ${rf},${T}`,
    d: `C${lf + (ax1 - lf) * 0.6},${T} ${ax1},${ay + h * 0.5} ${ax1},${ay} L${ax2},${ay} C${ax2},${ay + h * 0.5} ${rf - (rf - ax2) * 0.6},${T} ${rf},${T}`,
  }
}

/** Panel outline (viewport coords); the focused tail is part of the same stroke so it joins seamlessly. */
function outlinePath(L: number, R: number, T: number, B: number, t: ReturnType<typeof tail>) {
  const r = 28
  const top = t ? `H${t.lf} ${t.d} ` : ''
  return `M${L},${B} V${T + r} Q${L},${T} ${L + r},${T} ${top}H${R - r} Q${R},${T} ${R},${T + r} V${B} Z`
}

function App() {
  const browseBtn = useRef<HTMLButtonElement>(null)
  const accountBtn = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const browse = useBrowse()
  const account = useAccount()

  const [mode, setMode] = useState<Mode>('browse')
  const [m, setM] = useState(0) // animated blend: 0 = browse, 1 = account
  const [scroll, setScroll] = useState(window.scrollY)
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [layout, setLayout] = useState<Layout | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const panel = panelRef.current
      if (!panel || !browseBtn.current || !accountBtn.current) return
      const pr = docRect(panel)
      setLayout({
        btn: { browse: docRect(browseBtn.current), account: docRect(accountBtn.current) },
        panel: { x: pr.x, y: pr.y, w: pr.w },
      })
      setVp({ w: window.innerWidth, h: window.innerHeight })
    }
    measure()
    document.fonts?.ready.then(measure)
    // any layout shift (fonts, stats text, content swaps) moves the buttons — re-measure on all of them
    const ro = new ResizeObserver(() => measure())
    ro.observe(document.body)
    if (panelRef.current) ro.observe(panelRef.current)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScroll(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ---- mode blend animation (restartable mid-flight)
  const mRef = useRef(0)
  useEffect(() => {
    const from = mRef.current
    const to = mode === 'account' ? 1 : 0
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = clamp((now - t0) / BLEND_MS)
      mRef.current = lerp(from, to, ease(k))
      setM(mRef.current)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [mode])

  // ---- Tab switches page at any time (the Lean editor handles its own Tab)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.defaultPrevented) return
      e.preventDefault()
      ;(document.activeElement as HTMLElement | null)?.blur()
      setMode((x) => (x === 'browse' ? 'account' : 'browse'))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ---- speech bubbles: each button has its own fixed bubble. On Tab the focused one fades from
  // the filled foreground style to a dashed background outline, and the other does the reverse.
  const bubbles: { key: Mode; w: number; outline: string; ghost: string }[] = []
  let base = ''
  if (layout) {
    const L = layout.panel.x
    const R = L + layout.panel.w
    const T = layout.panel.y - scroll
    base = outlinePath(L, R, T, vp.h + 4, null) // keeps the panel opaque mid-fade
    for (const key of ['browse', 'account'] as Mode[]) {
      const b = layout.btn[key]
      const t = tail(T, { ...b, y: b.y - scroll }, L, R)
      bubbles.push({
        key,
        w: key === 'browse' ? 1 - m : m,
        outline: outlinePath(L, R, T, vp.h + 4, t),
        ghost: t ? t.sides : '',
      })
    }
    bubbles.sort((x, y) => x.w - y.w) // foreground drawn last
  }

  const pick = (next: Mode) => {
    setMode(next)
    if (layout) window.scrollTo({ top: layout.panel.y, behavior: 'smooth' })
  }
  // toolbars simply crossfade along with the page; only the focused one is interactive
  const barStyle = (which: Mode) => {
    const w = which === 'browse' ? 1 - m : m
    return { opacity: w, pointerEvents: w > 0.5 ? ('auto' as const) : ('none' as const) }
  }

  return (
    <>
      <svg className="bubble" width={vp.w} height={vp.h} aria-hidden>
        <path d={base} fill={PANEL_BG} stroke="#cfc4f2" strokeWidth={1.25} />
        {bubbles.map((bb) => (
          <g key={bb.key}>
            <path d={bb.ghost} fill="none" stroke="#b3aec4" strokeWidth={1.25} strokeDasharray="6 5" opacity={1 - bb.w} />
            <path d={bb.outline} fill={PANEL_BG} stroke="#cfc4f2" strokeWidth={1.25} strokeLinejoin="round" opacity={bb.w} />
          </g>
        ))}
      </svg>

      <Hero
        browseRef={browseBtn}
        accountRef={accountBtn}
        m={m}
        stats={
          <>
            <span style={{ opacity: 1 - m }}><BrowseStats /></span>
            <span style={{ opacity: m }}><AccountStats s={account} /></span>
          </>
        }
        onPick={pick}
      />

      <section className="panel" ref={panelRef}>
        <div className="list-head" ref={headRef}>
          <div className="bar" data-bar="browse" style={barStyle('browse')}>
            <BrowseBar s={browse} />
          </div>
          <div className="bar" data-bar="account" style={barStyle('account')}>
            <AccountBar s={account} />
          </div>
        </div>
        <div className="page" key={mode}>
          {mode === 'browse' ? <BrowseList s={browse} /> : <AccountContent s={account} />}
        </div>
      </section>
    </>
  )
}

export default App
