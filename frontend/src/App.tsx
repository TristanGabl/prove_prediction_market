import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import Hero, { type Mode } from './Hero'
import { BrowseBar, BrowseList, BrowseStats, useBrowse } from './Browse'
import { AccountBar, AccountContent, AccountStats, useAccount } from './Account'

type Rect = { x: number; y: number; w: number; h: number }
type Target = Rect & { label: string; dark: number }
type Layout = {
  btn: Record<Mode, Rect>
  bars: Record<Mode, Target[]>
  end: number // scroll offset at which the toolbar docks at the top
  panel: { x: number; y: number; w: number }
}

const PIECES = 4
const SPLIT_AT = 0.1 // scroll progress at which the flying button splits
const STAGGER = 0.015
const TRAVEL = 0.15
const LAND = SPLIT_AT + STAGGER * (PIECES - 1) + TRAVEL // all pieces sit on their controls
const MIN_MORPH_S = 0.5 // fastest the morph may play; faster scrolling just waits for it
const MAX_RATE = LAND / MIN_MORPH_S // progress units per second
const PANEL_BG = '#faf9f5'
const BLEND_MS = 450

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const lerpRect = <R extends Rect>(a: R, b: R, t: number): Rect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
})

function docRect(el: Element): Rect {
  const r = el.getBoundingClientRect()
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height }
}

/** Panel outline in viewport coords; when `anchor` sits above the panel, the top edge rises
 * into a speech-bubble tail that meets the anchor's sides. */
function bubblePath(L: number, R: number, T: number, B: number, anchor: Rect | null) {
  const r = 28
  let mid = ''
  if (anchor) {
    const ax1 = anchor.x - 6
    const ax2 = anchor.x + anchor.w + 6
    const ay = anchor.y + anchor.h / 2
    const h = T - ay
    if (h > 2) {
      const sp = Math.min(h * 0.8, 260)
      const lf = Math.max(L + r, ax1 - sp)
      const rf = Math.min(R - r, ax2 + sp)
      mid = `H${lf} C${lf + (ax1 - lf) * 0.6},${T} ${ax1},${ay + h * 0.5} ${ax1},${ay} L${ax2},${ay} C${ax2},${ay + h * 0.5} ${rf - (rf - ax2) * 0.6},${T} ${rf},${T}`
    }
  }
  return `M${L},${B} V${T + r} Q${L},${T} ${L + r},${T} ${mid} H${R - r} Q${R},${T} ${R},${T + r} V${B} Z`
}

function App() {
  const browseBtn = useRef<HTMLButtonElement>(null)
  const accountBtn = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const browse = useBrowse()
  const account = useAccount()

  const [mode, setMode] = useState<Mode>('browse')
  const [m, setM] = useState(0) // animated blend: 0 = browse, 1 = account
  const [scroll, setScroll] = useState(window.scrollY)
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [layout, setLayout] = useState<Layout | null>(null)

  // ---- measuring (document coords; the sticky header is measured at its in-flow slot)
  useLayoutEffect(() => {
    const measure = () => {
      const panel = panelRef.current
      if (!panel || !browseBtn.current || !accountBtn.current) return
      const stats = docRect(panel.querySelector('.stats-line')!)
      const head = panel.querySelector('.list-head')!.getBoundingClientRect()
      const headY = stats.y + stats.h
      const bar = (mode: Mode): Target[] =>
        Array.from(panel.querySelectorAll(`[data-bar=${mode}] > *`)).map((el) => {
          const r = el.getBoundingClientRect()
          const label =
            el instanceof HTMLSelectElement ? `${el.selectedOptions[0]?.text ?? ''}  ⌄`
            : el instanceof HTMLInputElement ? el.placeholder
            : el.children.length ? Array.from(el.children, (c) => c.textContent).join('   ') : el.textContent ?? ''
          return { x: r.left, y: headY + (r.top - head.top), w: r.width, h: r.height, label, dark: el.matches('.btn') ? 1 : 0 }
        })
      const pr = docRect(panel)
      setLayout({
        btn: { browse: docRect(browseBtn.current), account: docRect(accountBtn.current) },
        bars: { browse: bar('browse'), account: bar('account') },
        end: headY,
        panel: { x: pr.x, y: pr.y, w: pr.w },
      })
      setVp({ w: window.innerWidth, h: window.innerHeight })
    }
    measure()
    document.fonts?.ready.then(measure)
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
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

  const end = layout ? Math.max(1, layout.end) : 1
  const target = clamp(scroll / end)

  // animated progress chases the scroll position, but never faster than MAX_RATE — gives the pieces weight
  const [p, setP] = useState(target)
  const pRef = useRef(target)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const d = target - pRef.current
      if (Math.abs(d) < 1e-4) {
        pRef.current = target
        setP(target)
        return
      }
      pRef.current += Math.sign(d) * Math.min(Math.abs(d), MAX_RATE * dt)
      setP(pRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target])
  const settled = m === 0 || m === 1
  const landed = p >= LAND
  const showPieces = !!layout && p > 0 && !(landed && settled)

  // ---- morph pieces: the active button splits into 4 slices that fly to the toolbar controls
  let pieces: { rect: Rect; dark: number; labels: [string, string]; labelOpacity: number; rot: number; radius: string; seam: boolean; seamR: boolean }[] = []
  let anchor: Rect | null = null
  let wholeRect: Rect | null = null
  let caption: { text: string; opacity: number } | null = null
  if (layout) {
    const btn = lerpRect(layout.btn.browse, layout.btn.account, m)
    if (showPieces) {
      // One continuous flight: the whole button travels toward the toolbar the entire time,
      // and after SPLIT_AT each slice gradually peels off toward its own control.
      const targets = Array.from({ length: PIECES }, (_, k) => lerpRect(layout.bars.browse[k], layout.bars.account[k], m))
      const tx1 = Math.min(...targets.map((q) => q.x))
      const tx2 = Math.max(...targets.map((q) => q.x + q.w))
      const g = ease(clamp(p / LAND))
      const whole = lerpRect(btn, { x: (tx1 + tx2) / 2 - btn.w / 2, y: targets[0].y, w: btn.w, h: btn.h }, g)
      const split = clamp((p - SPLIT_AT) / 0.04)
      wholeRect = { ...whole, y: whole.y - scroll }
      caption = { text: m < 0.5 ? 'Browse markets' : 'Own account', opacity: 1 - clamp((p - SPLIT_AT + 0.01) / 0.05) }
      if (p < SPLIT_AT) {
        pieces = []
      } else {
        const gap = split * 8
        const sw = (whole.w - gap * (PIECES - 1)) / PIECES
        pieces = Array.from({ length: PIECES }, (_, k) => {
          const a = layout.bars.browse[k]
          const b = layout.bars.account[k]
          const start = { x: whole.x + k * (sw + gap) + (k - 1.5) * split * 6, y: whole.y, w: sw, h: whole.h }
          const tk = ease(clamp((p - SPLIT_AT - k * STAGGER) / TRAVEL))
          const r = lerpRect(start, targets[k], tk)
          const arc = Math.sin(Math.PI * tk)
          const outer = 999
          const inner = split * 999
          return {
            rect: { ...r, x: r.x + arc * (k - 1.5) * 40, y: r.y - scroll },
            dark: lerp(1, lerp(a.dark, b.dark, m), tk),
            labels: [a.label, b.label],
            labelOpacity: clamp(tk * 1.8 - 0.15),
            rot: arc * (k - 1.5) * -5,
            radius: `${k === 0 ? outer : inner}px ${k === PIECES - 1 ? outer : inner}px ${k === PIECES - 1 ? outer : inner}px ${k === 0 ? outer : inner}px`,
            seam: split > 0 || k === 0,
            seamR: split > 0 || k === PIECES - 1,
          }
        })
      }
      if (!landed) {
        const xs = pieces.length ? pieces.map((q) => q.rect) : [wholeRect!]
        const x1 = Math.min(...xs.map((q) => q.x))
        const y1 = Math.min(...xs.map((q) => q.y))
        const x2 = Math.max(...xs.map((q) => q.x + q.w))
        const y2 = Math.max(...xs.map((q) => q.y + q.h))
        anchor = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
      }
    } else if (p === 0) {
      anchor = { ...btn, y: btn.y - scroll }
    }
  }

  const panelTop = layout ? layout.panel.y - scroll : vp.h
  const path = layout ? bubblePath(layout.panel.x, layout.panel.x + layout.panel.w, panelTop, vp.h + 4, anchor) : ''
  const pick = (next: Mode) => {
    setMode(next)
    window.scrollTo({ top: end, behavior: 'smooth' })
  }
  const shown = (which: Mode): CSSProperties => ({
    visibility: (which === 'browse' ? m < 0.5 : m >= 0.5) && landed && settled ? 'visible' : 'hidden',
  })

  return (
    <>
      <svg className="bubble" width={vp.w} height={vp.h} aria-hidden>
        <path d={path} fill={PANEL_BG} stroke="#e4e1d9" strokeWidth={1} strokeLinejoin="round" />
      </svg>

      <Hero browseRef={browseBtn} accountRef={accountBtn} m={m} started={p > 0} fade={clamp(p / 0.06)} onPick={pick} />

      <section className="panel" ref={panelRef}>
        <div className="stats-line">
          <span style={{ opacity: 1 - m }}><BrowseStats /></span>
          <span style={{ opacity: m }}><AccountStats s={account} /></span>
        </div>
        <div className="list-head">
          <div className="bar" data-bar="browse" style={shown('browse')}><BrowseBar s={browse} /></div>
          <div className="bar" data-bar="account" style={shown('account')}><AccountBar s={account} /></div>
        </div>
        <div className="page" key={mode}>
          {mode === 'browse' ? <BrowseList s={browse} /> : <AccountContent s={account} />}
        </div>
      </section>

      {pieces.map((q, k) => (
        <div
          key={k}
          className="morph"
          style={{
            left: q.rect.x,
            top: q.rect.y,
            width: q.rect.w,
            height: q.rect.h,
            background: `color-mix(in srgb, var(--ink) ${q.dark * 100}%, #fff)`,
            color: q.dark > 0.5 ? 'var(--bg)' : 'var(--ink)',
            transform: `rotate(${q.rot}deg)`,
            borderRadius: q.radius,
            borderLeftWidth: q.seam ? undefined : 0,
            borderRightWidth: q.seamR ? undefined : 0,
          }}
        >
          <span style={{ opacity: q.labelOpacity * (1 - m) }}>{q.labels[0]}</span>
          <span style={{ opacity: q.labelOpacity * m }}>{q.labels[1]}</span>
        </div>
      ))}
      {wholeRect && caption && (
        <div
          className={`morph whole${pieces.length ? ' ghosted' : ''}`}
          style={{ left: wholeRect.x, top: wholeRect.y, width: wholeRect.w, height: wholeRect.h }}
        >
          <span style={{ opacity: caption.opacity }}>{caption.text}</span>
        </div>
      )}
    </>
  )
}

export default App
