'use client'
/**
 * gameKit — shared presentation + instrument library for the 12–14 PLAYABLE
 * GAMES (the "Sale Day" template, generalized). ShopRush was the first, fully
 * self-contained build; this kit lifts its proven bits so the other 11 chapters
 * are a thin *data* file (palette + task pools + demo) over `GameShell`.
 *
 * Everything is palette-parameterized (each world re-tints `Palette`), pointer-
 * driven (touch + mouse), and responsive (clamp-based sizing). No MCQ anywhere —
 * every instrument produces a value by manipulation; grading compares it to the
 * task answer (see GameShell).
 */
import { useRef, useState } from 'react'
import { shuffle, pick } from '@/core/rand'
import { disp } from '@/core/fmt'

// ── palette (each world supplies its own; shape matches ShopRush's P) ─────────
export interface Palette {
  nightTop: string; nightBot: string
  cream: string; creamSoft: string
  inkOnPaper: string; mutedOnPaper: string
  gold: string; goldDeep: string
  coral: string; coralDeep: string; mint: string
  glass: string; glassBorder: string
}

// ── number helpers ────────────────────────────────────────────────────────────
export const tidy = (n: number) => Math.round(n * 1000) / 1000
export const money = (n: number) => `$${tidy(n).toFixed(tidy(n) % 1 === 0 ? 0 : 2)}`
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b))
export function reduce(n: number, d: number): string { const g = gcd(n, d) || 1; return `${n / g}/${d / g}` }
export const signed = (n: number) => (n < 0 ? `negative ${Math.abs(n)}` : `${n}`)

/** Animate a numeric instrument from→to (used on a wrong answer to reveal it). */
export function glideNumber(from: number, to: number, setValue: (n: number) => void, later: (fn: () => void, ms: number) => void, steps = 16) {
  for (let i = 1; i <= steps; i++) later(() => setValue(tidy(from + ((to - from) * i) / steps)), 480 + i * 80)
}

// ── themed styles (functions of palette) ──────────────────────────────────────
// Sizes use clamp(mobilePx, vw-term, maxPx): phones stay at the mobile floor, but on
// a roomy laptop the vw term wins so everything scales up to fill the wide screen.
export const headerChip = (P: Palette): React.CSSProperties => ({
  background: P.glass, border: `1px solid ${P.glassBorder}`, borderRadius: 8, color: P.creamSoft,
  fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 'clamp(13px, 1.2vw, 17px)', padding: '6px 12px', cursor: 'pointer',
})
export const bigBtn = (P: Palette): React.CSSProperties => ({
  padding: 'clamp(13px, 1.4vw, 19px) clamp(34px, 3.6vw, 56px)', borderRadius: 14, background: `linear-gradient(${P.coral}, ${P.coralDeep})`,
  border: 'none', color: '#fff', fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: 'clamp(16px, 1.6vw, 24px)',
  letterSpacing: '0.05em', cursor: 'pointer', boxShadow: `0 6px 20px ${P.coralDeep}66`,
})
const ticketStyle = (P: Palette): React.CSSProperties => ({
  position: 'relative', width: '100%', maxWidth: 'clamp(340px, 46vw, 560px)', background: P.cream, borderRadius: 12,
  padding: 'clamp(10px, 1.2vw, 18px) clamp(16px, 2vw, 28px) clamp(14px, 1.5vw, 22px)', boxSizing: 'border-box', color: P.inkOnPaper,
  boxShadow: '0 10px 28px rgba(0,0,0,0.42)', transform: 'rotate(-0.6deg)',
})

// ── presentation components ───────────────────────────────────────────────────
export function Ticket({ P, children }: { P: Palette; children: React.ReactNode }) {
  return <div className="gk-ticket" style={ticketStyle(P)}>{children}</div>
}
export function TicketHead({ P, n, label }: { P: Palette; n: number; label: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${P.mutedOnPaper}`, paddingBottom: 6, fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px, 1vw, 15px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: P.mutedOnPaper }}>
      <span>#{String(n).padStart(2, '0')}</span><span>{label}</span>
    </div>
  )
}
export function Row({ P, title, price, badge, tone = 'a', struck }: { P: Palette; title: string; price?: string; badge: string; tone?: 'a' | 'b'; struck?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 'clamp(10px, 1.2vw, 16px)', padding: '8px 0 2px', flexWrap: 'wrap' }}>
      <span style={{ fontWeight: 700, fontSize: 'clamp(16px, 1.6vw, 23px)' }}>{title}</span>
      {price && <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(24px, 2.5vw, 36px)', textDecoration: struck ? 'line-through' : 'none', color: struck ? P.mutedOnPaper : P.inkOnPaper }}>{price}</span>}
      <span style={{ fontSize: 'clamp(12px, 1.15vw, 17px)', fontWeight: 800, color: '#fff', background: tone === 'b' ? '#7a6bb5' : P.coral, borderRadius: 16, padding: '4px 12px', whiteSpace: 'nowrap' }}>{badge}</span>
    </div>
  )
}
export function Says({ P, text }: { P: Palette; text: string }) {
  return <div style={{ width: '100%', maxWidth: 'clamp(460px, 56vw, 680px)', background: P.glass, border: `1px solid ${P.glassBorder}`, borderRadius: 12, padding: 'clamp(9px, 1.1vw, 16px) clamp(14px, 1.6vw, 24px)', fontWeight: 600, fontSize: 'clamp(15px, 1.5vw, 22px)', lineHeight: 1.45, color: P.cream, minHeight: 40, boxSizing: 'border-box', textAlign: 'center', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>{text}</div>
}
export function Readout({ P, text, reveal }: { P: Palette; text: string; reveal?: boolean }) {
  return <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(26px, 4.4vw, 50px)', fontWeight: 800, color: reveal ? P.mint : P.gold, textShadow: `0 0 18px ${(reveal ? '#3fa77c' : P.goldDeep)}55` }}>{text}</div>
}
export function CommitBtn({ P, label, onClick, disabled }: { P: Palette; label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ ...bigBtn(P), opacity: disabled ? 0.5 : 1 }}>{label}</button>
}
function Nudge({ P, label, onClick, disabled }: { P: Palette; label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{ width: 'clamp(44px, 4.4vw, 60px)', height: 'clamp(44px, 4.4vw, 60px)', borderRadius: '50%', border: `1px solid ${P.glassBorder}`, background: P.glass, color: P.cream, fontFamily: 'var(--font-numeric)', fontWeight: 700, fontSize: 'clamp(22px, 2.2vw, 30px)', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 }}>{label}</button>
}

// ══════════════════════════════════════════════════════════════════════════════
// INSTRUMENTS — each produces a value by manipulation, calls onCommit(value).
// ══════════════════════════════════════════════════════════════════════════════

/** Horizontal value dial (the workhorse — slide/nudge to a number, then commit). */
export function SlideValue({
  P, value, setValue, min, max, step = 1, disabled, reveal, onCommit, commitLabel = 'CONFIRM ✓', format,
}: {
  P: Palette; value: number; setValue: (n: number) => void; min: number; max: number; step?: number
  disabled?: boolean; reveal?: boolean; onCommit: (n: number) => void; commitLabel?: string; format?: (n: number) => string
}) {
  const fmt = format ?? ((n: number) => `${tidy(n)}`)
  const clamp = (n: number) => Math.min(max, Math.max(min, tidy(n)))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: '100%', maxWidth: 'clamp(400px, 52vw, 620px)', height: 'clamp(34px, 3.4vw, 46px)', accentColor: P.gold, cursor: disabled ? 'default' : 'pointer' }} aria-label="value dial" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setValue(clamp(value - step))} />
        <div style={{ minWidth: 120, textAlign: 'center' }}><Readout P={P} text={fmt(value)} reveal={reveal} /></div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setValue(clamp(value + step))} />
      </div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

/** Vertical thermometer — pull the mercury up/down a signed track (drag or ± tap). */
export function VThermo({
  P, value, setValue, min, max, disabled, reveal, onCommit, commitLabel = 'LOCK IN ✓', unit = '°',
}: {
  P: Palette; value: number; setValue: (n: number) => void; min: number; max: number
  disabled?: boolean; reveal?: boolean; onCommit: (n: number) => void; commitLabel?: string; unit?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const frac = (value - min) / (max - min)         // 0 bottom … 1 top
  const zeroFrac = (0 - min) / (max - min)
  const fill = reveal ? P.mint : P.coral
  const fromY = (clientY: number) => {
    const el = trackRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    const f = 1 - Math.min(1, Math.max(0, (clientY - r.top) / r.height))
    setValue(Math.round(min + f * (max - min)))
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 14 }}>
        <div
          ref={trackRef}
          onPointerDown={(e) => { if (disabled) return; dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromY(e.clientY) }}
          onPointerMove={(e) => { if (dragging.current) fromY(e.clientY) }}
          onPointerUp={() => { dragging.current = false }}
          style={{ position: 'relative', width: 'clamp(46px, 5.4vw, 72px)', height: 'clamp(210px, 27vh, 270px)', borderRadius: 24, background: P.glass, border: `1px solid ${P.glassBorder}`, touchAction: 'none', cursor: disabled ? 'default' : 'ns-resize' }}
        >
          {/* zero tick */}
          <div style={{ position: 'absolute', left: -6, right: -6, bottom: `${zeroFrac * 100}%`, height: 2, background: P.glassBorder }} />
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, height: `calc(${frac * 100}% - 16px)`, minHeight: 6, borderRadius: 16, background: `linear-gradient(${fill}, ${fill}cc)`, transition: 'height 90ms' }} />
          {/* knob */}
          <div style={{ position: 'absolute', left: '50%', bottom: `calc(${frac * 100}% - 12px)`, transform: 'translateX(-50%)', width: 30, height: 24, borderRadius: 8, background: P.cream, boxShadow: '0 2px 8px rgba(0,0,0,0.4)', transition: 'bottom 90ms' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
          <Nudge P={P} label="+" disabled={disabled} onClick={() => setValue(Math.min(max, value + 1))} />
          <Readout P={P} text={`${value}${unit}`} reveal={reveal} />
          <Nudge P={P} label="−" disabled={disabled} onClick={() => setValue(Math.max(min, value - 1))} />
        </div>
      </div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

/** Vertical lift shaft — a signed number line you read at a glance: floors ABOVE
 *  the ground line are positive, basements BELOW it are negative. Drag the car
 *  up/down (or ± tap). No fill bar (unlike VThermo) so the two vertical chapters
 *  stay visually distinct. */
export function ElevatorShaft({
  P, value, setValue, min, max, disabled, reveal, onCommit, commitLabel = 'GO ✓',
}: {
  P: Palette; value: number; setValue: (n: number) => void; min: number; max: number
  disabled?: boolean; reveal?: boolean; onCommit: (n: number) => void; commitLabel?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const span = max - min
  const frac = (value - min) / span                 // 0 bottom … 1 top
  const zeroFrac = (0 - min) / span
  const car = reveal ? P.mint : P.cream
  const fromY = (clientY: number) => {
    const el = trackRef.current; if (!el) return
    const r = el.getBoundingClientRect()
    const f = 1 - Math.min(1, Math.max(0, (clientY - r.top) / r.height))
    setValue(Math.round(min + f * span))
  }
  // Marker lines every 5 floors (+ the ground line) — enough to orient the eye
  // without turning the shaft into a barcode. The car still steps by 1.
  const floors: number[] = []
  for (let n = min; n <= max; n++) if (n % 5 === 0) floors.push(n)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 14 }}>
        <div
          ref={trackRef}
          onPointerDown={(e) => { if (disabled) return; dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromY(e.clientY) }}
          onPointerMove={(e) => { if (dragging.current) fromY(e.clientY) }}
          onPointerUp={() => { dragging.current = false }}
          style={{ position: 'relative', width: 'clamp(58px, 6.4vw, 88px)', height: 'clamp(210px, 27vh, 270px)', borderRadius: 10, background: P.glass, border: `1px solid ${P.glassBorder}`, overflow: 'hidden', touchAction: 'none', cursor: disabled ? 'default' : 'ns-resize' }}
        >
          {/* below-ground shade → negatives read as "underground" */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${zeroFrac * 100}%`, background: 'rgba(0,0,0,0.3)' }} />
          {/* floor lines: ground (0) bold gold, every-5th medium, rest faint */}
          {floors.map((n) => (
            <div key={n} style={{ position: 'absolute', left: 0, right: 0, bottom: `${((n - min) / span) * 100}%`, height: n === 0 ? 3 : 1, background: n === 0 ? P.gold : P.glassBorder, opacity: n === 0 ? 1 : n % 5 === 0 ? 0.5 : 0.22 }} />
          ))}
          <div style={{ position: 'absolute', right: 5, bottom: `calc(${zeroFrac * 100}% + 2px)`, fontFamily: 'var(--font-numeric)', fontSize: 10, fontWeight: 800, color: P.gold, letterSpacing: '0.06em' }}>G</div>
          {/* the lift car (the knob) — split doors so it reads as an elevator */}
          <div style={{ position: 'absolute', left: '50%', bottom: `calc(${frac * 100}% - 15px)`, transform: 'translateX(-50%)', width: '72%', height: 30, borderRadius: 6, background: car, boxShadow: '0 2px 9px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'bottom 90ms' }}>
            <div style={{ width: 2, height: '68%', background: 'rgba(0,0,0,0.22)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
          <Nudge P={P} label="+" disabled={disabled} onClick={() => setValue(Math.min(max, value + 1))} />
          <Readout P={P} text={`${value}`} reveal={reveal} />
          <Nudge P={P} label="−" disabled={disabled} onClick={() => setValue(Math.max(min, value - 1))} />
        </div>
      </div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

/** Percent paint grid — a 10×10 board (100 squares). Drag across to fill `value`
 *  squares (0..100 = a percentage). Reads out the count as percent = fraction =
 *  decimal. Used by the Store Checkout chapter to "shade the percent". */
export function PaintGrid({
  P, value, setValue, disabled, reveal, onCommit, commitLabel = 'SHADE IT ✓',
}: {
  P: Palette; value: number; setValue: (n: number) => void
  disabled?: boolean; reveal?: boolean; onCommit: (n: number) => void; commitLabel?: string
}) {
  const painting = useRef(false)
  const set = (i: number) => { if (!disabled) setValue(i + 1) }
  const fill = reveal ? P.mint : P.gold
  const rim = reveal ? '#3fa77c' : P.goldDeep
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        onPointerUp={() => { painting.current = false }}
        onPointerLeave={() => { painting.current = false }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2, width: 'min(72vw, 380px)', padding: 8, borderRadius: 12, background: P.glass, border: `1px solid ${P.glassBorder}`, touchAction: 'none', userSelect: 'none' }}
      >
        {Array.from({ length: 100 }, (_, i) => {
          const on = i < value
          return (
            <div key={i}
              onPointerDown={() => { if (disabled) return; painting.current = true; set(i) }}
              onPointerEnter={() => { if (painting.current) set(i) }}
              style={{ aspectRatio: '1', borderRadius: 2, background: on ? fill : 'rgba(255,244,221,0.10)', border: `1px solid ${on ? rim : 'rgba(255,244,221,0.18)'}`, cursor: disabled ? 'default' : 'pointer', transition: 'background 90ms' }} />
          )
        })}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px, 2vw, 30px)', fontWeight: 800, color: fill, textShadow: `0 0 16px ${rim}55` }}>
        {value}% = {reduce(value, 100)} = {tidy(value / 100)}
      </div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

/** Segmented bar — shade `count` of `segments` parts (fractions / part-of-part). */
export function BarShade({
  P, count, setCount, segments, disabled, reveal, onCommit, commitLabel = 'CONFIRM ✓', label,
}: {
  P: Palette; count: number; setCount: (n: number) => void; segments: number
  disabled?: boolean; reveal?: boolean; onCommit: (n: number) => void; commitLabel?: string; label?: string
}) {
  const painting = useRef(false)
  const fill = reveal ? P.mint : P.gold
  const rim = reveal ? '#3fa77c' : P.goldDeep
  const set = (i: number) => { if (!disabled) setCount(i + 1) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
      <div
        onPointerUp={() => { painting.current = false }}
        onPointerLeave={() => { painting.current = false }}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${segments}, 1fr)`, gap: 3, width: 'min(86vw, 540px)', padding: 8, borderRadius: 12, background: P.glass, border: `1px solid ${P.glassBorder}`, touchAction: 'none', userSelect: 'none' }}
      >
        {Array.from({ length: segments }, (_, i) => {
          const on = i < count
          return (
            <div key={i}
              onPointerDown={() => { if (disabled) return; painting.current = true; set(i) }}
              onPointerEnter={() => { if (painting.current) set(i) }}
              style={{ height: 54, borderRadius: 4, background: on ? fill : 'rgba(255,244,221,0.10)', border: `1px solid ${on ? rim : 'rgba(255,244,221,0.18)'}`, cursor: disabled ? 'default' : 'pointer', transition: 'background 90ms' }} />
          )
        })}
      </div>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(20px, 2vw, 29px)', fontWeight: 800, color: fill }}>{count}/{segments}{count > 0 ? ` = ${reduce(count, segments)}` : ''}</div>
      {label && <div style={{ fontSize: 12, color: P.creamSoft }}>{label}</div>}
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(count)} />
    </div>
  )
}

/** A GRAB-AND-TURN rotary crank — the kid holds the handle and physically turns
 *  the gear. One full turn forward = one ×base crank; turning BACK = ÷base (undo),
 *  floored at `floor` (default 1) so it can't slip below the start into fractions.
 *  The gear also spins when `value` is set programmatically (so the tutorial demo
 *  visibly rotates it). Pointer-driven → works with touch + mouse. */
const CRANK_DEG = 360   // degrees of turn per one ×base crank (one full revolution)
export function CrankGear({
  P, value, setValue, base, disabled, reveal, onCommit, commitLabel = 'RUN IT ✓', floor = 1,
}: {
  P: Palette; value: number; setValue: (n: number) => void; base: number
  disabled?: boolean; reveal?: boolean; onCommit: (n: number) => void; commitLabel?: string; floor?: number
}) {
  const ref = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const lastA = useRef(0)
  const acc = useRef(0)                 // accumulated turn since the last crank tick
  const valRef = useRef(value); valRef.current = value
  const [dragRot, setDragRot] = useState<number | null>(null)
  const fill = reveal ? P.mint : P.gold
  const rim = reveal ? '#3fa77c' : P.goldDeep

  // how many ×base cranks from the floor we are at → drives the resting rotation
  const turns = value > floor ? Math.round(Math.log(value / floor) / Math.log(base)) : 0
  const restRot = turns * CRANK_DEG
  const rot = dragRot ?? restRot

  const angle = (x: number, y: number) => {
    const el = ref.current; if (!el) return 0
    const r = el.getBoundingClientRect()
    return (Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * 180) / Math.PI
  }
  const applyTicks = (n: number) => {
    let v = valRef.current
    if (n > 0) { for (let i = 0; i < n; i++) v = tidy(v * base) }
    else { for (let i = 0; i < -n; i++) { const b = tidy(v / base); if (b < floor - 1e-9) break; v = b } }
    valRef.current = v; setValue(v)
  }
  const onDown = (e: React.PointerEvent) => {
    if (disabled) return
    dragging.current = true; acc.current = 0; lastA.current = angle(e.clientX, e.clientY)
    setDragRot(restRot); try { (e.currentTarget as Element).setPointerCapture(e.pointerId) } catch {}
  }
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const a = angle(e.clientX, e.clientY)
    let d = a - lastA.current; if (d > 180) d -= 360; if (d < -180) d += 360
    lastA.current = a; acc.current += d
    setDragRot((r) => (r ?? restRot) + d)
    let ticks = 0
    while (acc.current >= CRANK_DEG) { acc.current -= CRANK_DEG; ticks++ }
    while (acc.current <= -CRANK_DEG) { acc.current += CRANK_DEG; ticks-- }
    if (ticks) applyTicks(ticks)
  }
  const onUp = () => { dragging.current = false; acc.current = 0; setDragRot(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg ref={ref} viewBox="0 0 100 100"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={{ width: 'min(56vw, 300px)', height: 'min(56vw, 300px)', touchAction: 'none', cursor: disabled ? 'default' : 'grab', userSelect: 'none' }}>
        <g transform={`rotate(${rot} 50 50)`} style={{ transition: dragging.current ? 'none' : 'transform 340ms cubic-bezier(.2,1.05,.35,1)' }}>
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={46} y={1} width={8} height={15} rx={2} fill={fill} transform={`rotate(${i * 45} 50 50)`} />
          ))}
          <circle cx={50} cy={50} r={34} fill={P.glass} stroke={rim} strokeWidth={2} />
          <circle cx={50} cy={50} r={7} fill={rim} />
          {/* the grab handle — sits on the rim so it clearly reads as "turn me" */}
          <circle cx={50} cy={18} r={8} fill={fill} stroke="#fff" strokeWidth={1.5} />
          <circle cx={50} cy={18} r={3} fill={rim} />
        </g>
      </svg>
      <Readout P={P} text={`${tidy(value)}`} reveal={reveal} />
      {!disabled && <div style={{ fontSize: 12, color: P.creamSoft, textAlign: 'center' }}>grab the handle &amp; turn — ×{base} each turn, back to undo</div>}
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

export interface XY { x: number; y: number }
/** Tap the coordinate grid to drop a pin at (x, y). Four quadrants. */
export function PlotGrid({
  P, point, setPoint, range = 6, disabled, reveal, onCommit, commitLabel = 'DELIVER ✓',
}: {
  P: Palette; point: XY | null; setPoint: (p: XY) => void; range?: number
  disabled?: boolean; reveal?: boolean; onCommit: (p: XY) => void; commitLabel?: string
}) {
  const S = 300, pad = 16, span = 2 * range
  const cell = (S - 2 * pad) / span
  const toPx = (v: number) => pad + (v + range) * cell
  const dotColor = reveal ? P.mint : P.gold
  const onTap = (e: React.PointerEvent<SVGSVGElement>) => {
    if (disabled) return
    const r = e.currentTarget.getBoundingClientRect()
    const gx = Math.round(((e.clientX - r.left) / r.width * S - pad) / cell - range)
    const gy = Math.round(range - ((e.clientY - r.top) / r.height * S - pad) / cell)
    setPoint({ x: Math.max(-range, Math.min(range, gx)), y: Math.max(-range, Math.min(range, gy)) })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg viewBox={`0 0 ${S} ${S}`} onPointerDown={onTap} style={{ width: 'min(80vw, 34vh)', height: 'min(80vw, 34vh)', touchAction: 'none', background: P.glass, border: `1px solid ${P.glassBorder}`, borderRadius: 12, cursor: disabled ? 'default' : 'crosshair' }}>
        {Array.from({ length: span + 1 }, (_, i) => (
          <g key={i}>
            <line x1={toPx(-range) + i * cell} y1={pad} x2={toPx(-range) + i * cell} y2={S - pad} stroke={P.glassBorder} strokeWidth={i === range ? 1.6 : 0.6} />
            <line x1={pad} y1={pad + i * cell} x2={S - pad} y2={pad + i * cell} stroke={P.glassBorder} strokeWidth={i === range ? 1.6 : 0.6} />
          </g>
        ))}
        {point && (
          <g>
            <line x1={toPx(point.x)} y1={toPx(0)} x2={toPx(point.x)} y2={S - toPx(point.y)} stroke={`${dotColor}66`} strokeDasharray="3 3" />
            <circle cx={toPx(point.x)} cy={S - toPx(point.y)} r={7} fill={dotColor} stroke="#fff" strokeWidth={1.5} />
          </g>
        )}
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(20px, 2vw, 29px)', fontWeight: 800, color: dotColor }}>{point ? `(${point.x}, ${point.y})` : 'tap the map'}</div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled || !point} onClick={() => point && onCommit(point)} />
    </div>
  )
}

export interface Line { m: number; b: number }
/** Set a line's slope & intercept with two dials; live line drawn on a grid. */
export function LineSetter({
  P, line, setLine, range = 6, disabled, reveal, onCommit, commitLabel = 'SET LINE ✓', labels,
}: {
  P: Palette; line: Line; setLine: (l: Line) => void; range?: number
  disabled?: boolean; reveal?: boolean; onCommit: (l: Line) => void; commitLabel?: string
  /** Dial captions. Default 'slope'/'start' — override so the control speaks the
   *  chapter's OWN vocabulary (Water Tank teaches "fill rate", and a child hunting
   *  for the word the prompt used must find it on the dial, not a synonym). */
  labels?: { m?: string; b?: string }
}) {
  const S = 260, pad = 14, span = 2 * range
  const cell = (S - 2 * pad) / span
  const toPx = (v: number) => pad + (v + range) * cell
  const yAt = (x: number) => line.m * x + line.b
  const col = reveal ? P.mint : P.gold
  const clampY = (y: number) => Math.max(-range - 2, Math.min(range + 2, y))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: 'min(80vw, 40vh)', height: 'min(80vw, 40vh)', background: P.glass, border: `1px solid ${P.glassBorder}`, borderRadius: 12 }}>
        {Array.from({ length: span + 1 }, (_, i) => (
          <g key={i}>
            <line x1={pad + i * cell} y1={pad} x2={pad + i * cell} y2={S - pad} stroke={P.glassBorder} strokeWidth={i === range ? 1.6 : 0.5} />
            <line x1={pad} y1={pad + i * cell} x2={S - pad} y2={pad + i * cell} stroke={P.glassBorder} strokeWidth={i === range ? 1.6 : 0.5} />
          </g>
        ))}
        <line x1={toPx(-range)} y1={S - toPx(clampY(yAt(-range)))} x2={toPx(range)} y2={S - toPx(clampY(yAt(range)))} stroke={col} strokeWidth={3} strokeLinecap="round" />
        <circle cx={toPx(0)} cy={S - toPx(clampY(line.b))} r={5} fill={col} stroke="#fff" strokeWidth={1.4} />
      </svg>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        <DialCol P={P} label={labels?.m ?? 'slope'} value={line.m} col={col} disabled={disabled} onDown={() => setLine({ ...line, m: Math.max(-5, line.m - 1) })} onUp={() => setLine({ ...line, m: Math.min(5, line.m + 1) })} />
        <DialCol P={P} label={labels?.b ?? 'start'} value={line.b} col={col} disabled={disabled} onDown={() => setLine({ ...line, b: Math.max(-range, line.b - 1) })} onUp={() => setLine({ ...line, b: Math.min(range, line.b + 1) })} />
      </div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(line)} />
    </div>
  )
}
function DialCol({ P, label, value, col, disabled, onDown, onUp }: { P: Palette; label: string; value: number; col: string; disabled?: boolean; onDown: () => void; onUp: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.creamSoft }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={onDown} />
        <span style={{ minWidth: 40, textAlign: 'center', fontFamily: 'var(--font-numeric)', fontSize: 'clamp(26px, 2.6vw, 38px)', fontWeight: 800, color: col }}>{value}</span>
        <Nudge P={P} label="+" disabled={disabled} onClick={onUp} />
      </div>
    </div>
  )
}

/** Balance beam — slide x; the beam tips until left(x) == right, then it's level. */
export function BalanceBeam({
  P, x, setX, min, max, leftOf, right, leftExpr, disabled, reveal, onCommit, commitLabel = 'BALANCE ✓',
}: {
  P: Palette; x: number; setX: (n: number) => void; min: number; max: number
  leftOf: (x: number) => number; right: number; leftExpr: string
  disabled?: boolean; reveal?: boolean; onCommit: (n: number) => void; commitLabel?: string
}) {
  const diff = leftOf(x) - right
  // While the kid is still setting x (active), the beam stays LEVEL and the left pan
  // shows the expression (e.g. 2x), not its value — so they must actually solve for x,
  // not just wiggle until it looks straight. It only tips AFTER they weigh (disabled),
  // and in the teaching walkthrough (also disabled) so Milo can demo it tilting.
  const active = !disabled
  const balanced = Math.abs(diff) < 1e-6
  const tilt = active ? 0 : Math.max(-14, Math.min(14, -diff * 2))   // tips toward the heavier side
  const col = reveal ? P.mint : P.gold
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
      <svg viewBox="0 0 260 120" style={{ width: 'min(84vw, 440px)', height: 'auto' }}>
        <g transform="translate(130 40)">
          <g transform={`rotate(${tilt})`} style={{ transition: 'transform 200ms' }}>
            <rect x={-110} y={-4} width={220} height={8} rx={4} fill={col} />
            <rect x={-104} y={-40} width={64} height={30} rx={6} fill={P.glass} stroke={P.glassBorder} />
            <rect x={40} y={-40} width={64} height={30} rx={6} fill={P.glass} stroke={P.glassBorder} />
            <text x={-72} y={-20} textAnchor="middle" fontFamily="var(--font-numeric)" fontWeight={800} fontSize={active ? 13 : 15} fill={P.cream}>{active ? leftExpr : tidy(leftOf(x))}</text>
            <text x={72} y={-20} textAnchor="middle" fontFamily="var(--font-numeric)" fontWeight={800} fontSize={15} fill={P.cream}>{right}</text>
          </g>
          <polygon points="0,4 -14,56 14,56" fill={P.glassBorder} />
        </g>
      </svg>
      {/* neutral while setting x; the weigh RESULT (over / under / balanced) once committed */}
      <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 16, fontWeight: 700, minHeight: 22, color: active ? P.creamSoft : balanced ? P.mint : P.coral }}>
        {active ? 'Set x, then weigh' : balanced ? 'Balanced ✓' : diff > 0 ? 'Overweight — too heavy' : 'Underweight — too light'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'center' }}>
        <Nudge P={P} label="−" disabled={disabled} onClick={() => setX(Math.max(min, tidy(x - 1)))} />
        <div style={{ minWidth: 90, textAlign: 'center' }}><Readout P={P} text={`x = ${tidy(x)}`} reveal={reveal} /></div>
        <Nudge P={P} label="+" disabled={disabled} onClick={() => setX(Math.min(max, tidy(x + 1)))} />
      </div>
      <input type="range" min={min} max={max} step={1} value={x} disabled={disabled} onChange={(e) => setX(Number(e.target.value))} style={{ width: '100%', maxWidth: 'clamp(360px, 46vw, 560px)', height: 'clamp(30px, 3vw, 44px)', accentColor: P.gold }} aria-label="x dial" />
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(x)} />
    </div>
  )
}

export interface Mix { a: number; b: number }
/** Two taps filling one tank — set both pours; grade the one the task asks for. */
export function TwoTaps({
  P, mix, setMix, max, labelA, labelB, fixed, disabled, reveal, onCommit, commitLabel = 'POUR ✓',
}: {
  P: Palette; mix: Mix; setMix: (m: Mix) => void; max: number; labelA: string; labelB: string
  fixed?: 'a' | 'b'; disabled?: boolean; reveal?: boolean; onCommit: (m: Mix) => void; commitLabel?: string
}) {
  const col = reveal ? P.mint : P.gold
  const Tank = ({ v, label, tint, lock }: { v: number; label: string; tint: string; lock?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 'clamp(46px, 5.4vw, 72px)', height: 'clamp(150px, 22vh, 210px)', borderRadius: 10, background: P.glass, border: `1px solid ${P.glassBorder}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(v / max) * 100}%`, background: tint, transition: 'height 120ms' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-numeric)', fontWeight: 800, fontSize: 'clamp(18px, 1.9vw, 27px)', color: lock ? P.creamSoft : col }}>{v}</span>
      <span style={{ fontSize: 'clamp(12px, 1.1vw, 16px)', color: P.creamSoft }}>{label}{lock ? ' 🔒' : ''}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <div style={{ display: 'flex', gap: 26 }}>
        <Tank v={mix.a} label={labelA} tint={P.gold} lock={fixed === 'a'} />
        <Tank v={mix.b} label={labelB} tint={P.coral} lock={fixed === 'b'} />
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {fixed !== 'a' && <SmallStepper P={P} label={labelA} value={mix.a} disabled={disabled} onDown={() => setMix({ ...mix, a: Math.max(0, mix.a - 1) })} onUp={() => setMix({ ...mix, a: Math.min(max, mix.a + 1) })} />}
        {fixed !== 'b' && <SmallStepper P={P} label={labelB} value={mix.b} disabled={disabled} onDown={() => setMix({ ...mix, b: Math.max(0, mix.b - 1) })} onUp={() => setMix({ ...mix, b: Math.min(max, mix.b + 1) })} />}
      </div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(mix)} />
    </div>
  )
}
function SmallStepper({ P, label, value, disabled, onDown, onUp }: { P: Palette; label: string; value: number; disabled?: boolean; onDown: () => void; onUp: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Nudge P={P} label="−" disabled={disabled} onClick={onDown} />
      <span style={{ minWidth: 54, textAlign: 'center', fontSize: 12, color: P.creamSoft }}>{label}<br /><b style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(18px, 1.8vw, 26px)', color: P.cream }}>{value}</b></span>
      <Nudge P={P} label="+" disabled={disabled} onClick={onUp} />
    </div>
  )
}

// ── tutorial hand cue — an animated finger showing the gesture ──
//    drag = horizontal · dragV = vertical (up/down) · tap · crank (rotate)
export type HandKind = 'drag' | 'dragV' | 'tap' | 'crank'
export function HandCue({ P, kind, label }: { P: Palette; kind: HandKind; label?: string }) {
  const text = label ?? (kind === 'tap' ? 'tap' : kind === 'crank' ? 'turn' : 'drag')
  return (
    <div className={`hc hc-${kind}`} aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 8, color: P.creamSoft, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>
      <span className="hc-hand" style={{ fontSize: 26, display: 'inline-block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>👆</span>
      <span>{text}</span>
      <style>{`
        .hc-drag .hc-hand { animation: hcDrag 1.5s ease-in-out infinite; }
        @keyframes hcDrag { 0%,100% { transform: translateX(-14px) } 50% { transform: translateX(14px) } }
        .hc-dragV .hc-hand { animation: hcDragV 1.5s ease-in-out infinite; }
        @keyframes hcDragV { 0%,100% { transform: translateY(-12px) } 50% { transform: translateY(12px) } }
        .hc-tap .hc-hand { animation: hcTap 1s ease-in-out infinite; }
        @keyframes hcTap { 0%,100% { transform: translateY(0) scale(1) } 45% { transform: translateY(5px) scale(0.82) } }
        .hc-crank .hc-hand { animation: hcCrank 1.6s linear infinite; transform-origin: 50% 50%; }
        @keyframes hcCrank { from { transform: rotate(0deg) translateX(9px) rotate(0deg) } to { transform: rotate(360deg) translateX(9px) rotate(-360deg) } }
        @media (prefers-reduced-motion: reduce) { .hc-hand { animation: none !important } }
      `}</style>
    </div>
  )
}

// ── QuestionBoard — the chalkboard that always shows the current QUESTION during
//    practice/guided (pinned top-left by GameShell). The expression sits big; a
//    second line shows "= ?" while solving, then "= answer" (green on correct,
//    warm on reveal). `expr` is a node so a chapter can highlight a portion. ──────
export function QuestionBoard({ P, title, prompt, context, instruction, expr, answer, answerLabel = '=', tone = 'ask', cue, compact, testHooks }: {
  P: Palette; title?: string; prompt?: React.ReactNode; context?: React.ReactNode; instruction?: React.ReactNode; expr: React.ReactNode; answer?: React.ReactNode; tone?: 'ask' | 'reveal' | 'ok'; cue?: string
  /** Short frame (landscape phone): drop the px floors so the board fits above the
   *  answer controls. The long context/instruction lines are NEVER truncated — a
   *  child must be able to answer from the board alone — only shrunk and reflowed. */
  compact?: boolean
  /** What sits left of the answer. Defaults to '='. A chapter whose `expr` is ALREADY
   *  a full equation must override it (BalanceBench: 'x =') — otherwise the board
   *  reads "x + 1 = 4" then "= ?", which is a broken equation chain. */
  answerLabel?: React.ReactNode
  /** Dev-only E2E hooks (data-test-answer/data-test-phase) spread onto the board
   *  root. Emitted only by `next dev` — see GameShell (compile-time gated). */
  testHooks?: Record<string, string>
}) {
  const ansColor = tone === 'ok' ? '#8ef0c2' : tone === 'reveal' ? '#ffb59c' : '#cfe0d8'
  const asking = tone === 'ask'
  // Structured mode: when a chapter supplies `context`/`instruction`, the board reads
  // as three clear zones (story → math → action). Otherwise fall back to the single
  // prose `prompt` (unchanged for chapters not yet migrated to the clarity spec).
  const structured = context != null || instruction != null
  return (
    <div {...testHooks} style={{
      width: '100%', maxWidth: compact ? 'min(96vw, 640px)' : 'clamp(280px, 40vw, 460px)', boxSizing: 'border-box',
      background: 'linear-gradient(160deg, #21473c, #16302a)',
      border: compact ? '3px solid #7a5230' : '4px solid #7a5230', borderRadius: 12,
      boxShadow: 'inset 0 0 26px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.4)',
      padding: compact ? '6px 12px' : 'clamp(12px, 1.6vw, 22px) clamp(16px, 2vw, 28px)', display: 'flex', flexDirection: 'column', gap: compact ? 3 : 'clamp(5px, 0.8vw, 11px)', alignItems: 'center',
    }}>
      {/* Permanent "Solve it" cue while the question is open — so a child who missed
          Milo's voice still knows it's on them to answer. Swaps to ✓ once solved. */}
      {cue && asking && (
        <div style={{ background: P.gold, color: '#12241b', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: compact ? 9 : 'clamp(11px, 1vw, 14px)', letterSpacing: '0.14em', textTransform: 'uppercase', borderRadius: 999, padding: compact ? '1px 11px' : '3px 15px' }}>{cue}</div>
      )}
      {tone === 'ok' && <div style={{ color: '#8ef0c2', fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: compact ? 9 : 'clamp(11px, 1vw, 14px)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Solved ✓</div>}
      {/* Zone 1 — the story, one short line. In structured mode this is `context`;
          otherwise the legacy prose `prompt` (or the uppercase title as last resort). */}
      {structured
        ? (context ? <div style={{ fontFamily: 'var(--font-body)', fontSize: compact ? 11 : 'clamp(12px, 1.2vw, 16px)', fontWeight: 500, lineHeight: compact ? 1.25 : 1.4, color: '#bcd8c9', textAlign: 'center' }}>{context}</div> : null)
        : prompt
          ? <div style={{ fontFamily: 'var(--font-body)', fontSize: compact ? 12 : 'clamp(13px, 1.35vw, 19px)', fontWeight: 600, lineHeight: compact ? 1.25 : 1.35, color: '#e7f2e1', textAlign: 'center' }}>{prompt}</div>
          : title ? <div style={{ fontFamily: 'var(--font-body)', fontSize: compact ? 10 : 'clamp(11px, 1vw, 15px)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bcd8c9' }}>{title}</div> : null}
      {/* Zone 2 — the math, the hero of the board. */}
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: compact ? 20 : 'clamp(24px, 3vw, 40px)', fontWeight: 700, letterSpacing: '0.02em', color: '#f2f8ec', textShadow: '0 0 8px rgba(214,240,206,0.4)', lineHeight: 1.15, textAlign: 'center' }}>{expr}</div>
      {answer !== undefined && <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: compact ? 18 : 'clamp(22px, 2.8vw, 36px)', fontWeight: 800, color: ansColor, textShadow: '0 0 10px rgba(0,0,0,0.35)', lineHeight: 1.1 }}>{answerLabel} {answer}</div>}
      {/* Zone 3 — the single action, in its own chip. Shown only while it's the
          child's turn to act (hidden once the answer is revealed/solved). */}
      {instruction && asking && (
        <div style={{ marginTop: compact ? 0 : 'clamp(1px, 0.3vw, 4px)', background: '#bcd8c9', color: '#10231a', fontFamily: 'var(--font-body)', fontWeight: 650, fontSize: compact ? 10 : 'clamp(11px, 1.05vw, 15px)', lineHeight: compact ? 1.2 : 1.3, borderRadius: 8, padding: compact ? '3px 9px' : 'clamp(5px,0.6vw,8px) clamp(10px,1.2vw,15px)', textAlign: 'center', display: 'inline-flex', gap: compact ? 5 : 7, alignItems: 'baseline' }}>
          <span style={{ color: P.goldDeep ?? '#7a5230', fontWeight: 800 }}>→</span>{instruction}
        </div>
      )}
    </div>
  )
}

// ── Blackboard — Milo's chalkboard. The matching math is WRITTEN here as he SPEAKS,
//    one line at a time: `writingIndex` is the line being chalk-wiped in.
const CHALK_TEXT: React.CSSProperties = { fontFamily: 'var(--font-chalk)', fontSize: 'clamp(19px, 2.3vw, 32px)', fontWeight: 700, letterSpacing: '0.02em', color: '#f6faf0', textShadow: '0 0 1px rgba(255,255,255,0.6), 0 1px 1px rgba(0,0,0,0.28), 0 0 11px rgba(214,240,206,0.4)', lineHeight: 1.25, textAlign: 'left' }
export function Blackboard({ P, lines, writingIndex, slideKey }: { P: Palette; lines: string[]; writingIndex: number
  /** Changes when the visible window SLIDES (an older line dropped off the top).
   *  Keying the line list on it replays a one-line scroll-up so the shift reads as
   *  motion rather than a jump. Only the newest line carries a write-on animation,
   *  and that line is new on a slide anyway, so the remount costs nothing. */
  slideKey?: number }) {
  if (!lines.length) return null
  const numChip: React.CSSProperties = { fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'clamp(10px,0.95vw,13px)', color: '#12241b', background: '#bcd8c9', width: 'clamp(20px,2.2vw,26px)', height: 'clamp(20px,2.2vw,26px)', borderRadius: 999, display: 'grid', placeItems: 'center', lineHeight: 1 }
  return (
    <div style={{
      width: '100%', maxWidth: 'clamp(340px, 46vw, 560px)', minHeight: 48, boxSizing: 'border-box',
      background: 'linear-gradient(160deg, #21473c, #16302a)',
      border: '4px solid #7a5230', borderRadius: 12,
      boxShadow: 'inset 0 0 26px rgba(0,0,0,0.55), 0 8px 20px rgba(0,0,0,0.4)',
      padding: 'clamp(10px, 1.6vw, 20px) clamp(14px, 1.8vw, 26px)', display: 'flex', flexDirection: 'column', gap: 'clamp(5px, 0.9vw, 12px)', alignItems: 'stretch',
    }}>
      {/* A clear label so this reads as THE SOLVE — the steps to get the answer. */}
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(10px, 0.95vw, 13px)', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: P.gold, textAlign: 'center', marginBottom: 'clamp(1px,0.3vw,4px)' }}>Solving it, step by step</div>
      <div key={slideKey} className="mb-slide" style={{ display: 'flex', flexDirection: 'column', gap: 'inherit' }}>
      {lines.map((ln, k) => {
        const done = writingIndex < 0 || k < writingIndex
        return (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: 'clamp(20px,2.2vw,26px) 1fr', gap: 'clamp(8px,1vw,13px)', alignItems: 'baseline', opacity: k === writingIndex || done ? 1 : 0.42 }}>
            <span style={numChip}>{k + 1}</span>
            <span className={k === writingIndex ? 'mb-chalk mb-writing' : 'mb-chalk'} style={CHALK_TEXT}>{ln}</span>
          </div>
        )
      })}
      </div>
      <style>{`
        /* The window sliding up by one line — a short travel so it reads as the board
           scrolling, not as the lines jumping. Reduced motion: animation:none is SAFE
           here (unlike an enter-from-invisible effect) because the un-animated state
           IS the end state — the lines start visible and untranslated. */
        .mb-slide { animation: mbSlide 320ms cubic-bezier(.22,.61,.36,1) both; }
        @keyframes mbSlide {
          from { transform: translateY(1.15em); opacity: 0.55 }
          to   { transform: translateY(0);      opacity: 1 }
        }
        @media (prefers-reduced-motion: reduce) { .mb-slide { animation: none } }
        /* Chalk write-on (walkthrough mode): revealed left-to-right in short steps. */
        .mb-writing { animation: mbWrite 1.7s steps(26, end) both; }
        @keyframes mbWrite {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0 0 0);   }
        }
        @media (prefers-reduced-motion: reduce) { .mb-writing { animation: none; clip-path: none } }
      `}</style>
    </div>
  )
}

// ── numChoices — build the tap-choices for one question: the answer plus plausible
//    distractors, shuffled. Pass the chapter's OWN near-misses first (the number a
//    child lands on when they make the classic mistake for that skill — wrong
//    operation order, forgotten sign, halved instead of doubled); the generic ±step
//    neighbours only fill the remaining slots. Distractors inherit the answer's
//    decimal places, so a 0.35 answer never sits next to a 1.35.
export function numChoices(ans: number, near: number[] = [], opts: { min?: number; max?: number; count?: number } = {}): number[] {
  const { min = -Infinity, max = Infinity, count = 4 } = opts
  const decimals = (String(ans).split('.')[1] ?? '').length
  const step = decimals ? 10 ** -decimals : 1
  const round = (n: number) => Number(n.toFixed(decimals))
  const out: number[] = [ans]
  for (const raw of [...near, ans + step, ans - step, ans + 2 * step, ans - 2 * step, ans * 2, -ans]) {
    const n = round(raw)
    if (n >= min && n <= max && !out.includes(n)) out.push(n)
    if (out.length >= count) break
  }
  return shuffle(out)
}

export function AnswerPad({ P, choices, onSubmit, disabled, reveal, correct, picked, compact, big }: {
  P: Palette; choices: number[]; onSubmit: (n: number) => void; disabled?: boolean
  /** On a wrong answer the pad STAYS on screen (an instrument chapter glides its
   *  instrument to the answer here; a pad chapter would otherwise show an empty
   *  stage). The correct choice glows mint, the child's wrong pick coral. */
  reveal?: boolean; correct?: number; picked?: number
  /** Short frame (landscape phone): smaller buttons so the pad clears the board.
   *  Still ~44px tall — a child-finger target, never a desktop-sized hit box. */
  compact?: boolean
  /** PORTRAIT frame: add a vh term. Every size here is `clamp(px, vw, px)`, so a
   *  tall narrow screen lands on the MINIMUM (measured 390×844: 76×60 buttons at
   *  24px type) while 200px of height below them goes unused. `max(vw, vh)` lets
   *  whichever dimension has room drive; the same max caps it, so no frame that
   *  already fits grows past what it had.
   *
   *  ⚠️ The 1.45 is DERIVED, not chosen: a portrait phone should land in the MIDDLE
   *  of each clamp, not on its floor. At 390×844 the font wants ~34 of its 24–52
   *  range, i.e. 4.0vh against the 2.8vw it is written with — and 4.0/2.8 ≈ 1.45,
   *  which lands the width (8vw → 11.6vh ≈ 98px of 76–150) and both paddings in the
   *  same place. A first pass used 0.42 and changed nothing, because the vh term
   *  came out UNDER the floor — measure the rendered px, do not trust the formula. */
  big?: boolean
}) {
  const size = (minPx: number, vw: number, maxPx: number) =>
    `clamp(${minPx}px, ${big ? `max(${vw}vw, ${(vw * 1.45).toFixed(2)}vh)` : `${vw}vw`}, ${maxPx}px)`
  return (
    // ⚠️ `big` must GRID, not wrap. Wrapping laid 4 portrait-sized buttons out as
    // 3 + 1 at 390 wide — a lone tap target on its own row, which is worse than the
    // small buttons it replaced. A 2-column grid gives the 4-choice case a clean
    // 2×2; 3 choices still fit one row at this size, so they keep it.
    <div style={big
      ? { display: 'grid', gridTemplateColumns: `repeat(${choices.length === 4 ? 2 : choices.length}, minmax(0, 1fr))`, gap: 'clamp(10px, 1.4vw, 18px)', justifyItems: 'center', width: '100%', maxWidth: 'min(94vw, 460px)' }
      : { display: 'flex', gap: compact ? 8 : 'clamp(10px, 1.4vw, 18px)', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
      {choices.map((c, i) => {
        const isRight = reveal && c === correct
        const isWrong = reveal && c === picked && c !== correct
        return (
          <button key={i} type="button" disabled={disabled} onClick={() => !disabled && onSubmit(c)} style={{
            fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800,
            fontSize: compact ? 22 : size(24, 2.8, 52), minWidth: compact ? 66 : size(76, 8, 150), padding: compact ? '7px 14px' : `${size(12, 1.4, 28)} ${size(16, 1.8, 36)}`,
            borderRadius: 16, border: `2.5px solid ${isRight ? P.mint : isWrong ? P.coral : P.gold}`,
            background: isRight ? `${P.mint}22` : P.glass, color: isRight ? P.mint : isWrong ? P.coral : P.cream,
            opacity: reveal && !isRight && !isWrong ? 0.45 : 1,
            cursor: disabled ? 'default' : 'pointer', boxShadow: '0 3px 12px rgba(0,0,0,0.3)',
          }}>{disp(c)}</button>
        )
      })}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// HS PICKERS — the game-scene answer controls for SYMBOLIC answers (15–16 / 17–18).
// Some high-school answers can't be a slider — factored forms, radical roots,
// classifications, proof steps. These keep the game feel: the options are physical
// cards in the scene; pick one, then commit. Same value/grade model as every
// instrument — V is the chosen option id; GameShell's grade compares it to the
// task's answer id. '' means "nothing picked yet" (GameShell needs a non-null value).
// ══════════════════════════════════════════════════════════════════════════════

export interface SpecChoice { id: string; label: React.ReactNode }

/** SpecPicker — pick the right "spec card" (short symbolic/numeric options laid out
 *  as a compact grid), then LOCK IN. On reveal the correct card glows mint, a wrong
 *  pick glows coral. */
export function SpecPicker({
  P, choices, value, setValue, correct, disabled, reveal, onCommit, commitLabel = 'LOCK IN ✓', prompt,
}: {
  P: Palette; choices: SpecChoice[]; value: string; setValue: (id: string) => void
  correct?: string; disabled?: boolean; reveal?: boolean; onCommit: (id: string) => void
  commitLabel?: string; prompt?: string
}) {
  const cols = choices.length >= 3 ? 2 : 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 1.2vw, 16px)', width: '100%' }}>
      {prompt && <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px, 1.1vw, 15px)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.creamSoft }}>{prompt}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 'clamp(8px, 1vw, 14px)', width: '100%', maxWidth: 'clamp(320px, 44vw, 560px)' }}>
        {choices.map((c) => {
          const sel = value === c.id
          const isRight = reveal && correct === c.id
          const isWrong = reveal && sel && correct !== c.id
          const border = isRight ? P.mint : isWrong ? P.coral : sel ? P.gold : P.glassBorder
          const bg = isRight ? 'rgba(63,167,124,0.18)' : isWrong ? 'rgba(224,72,63,0.16)' : sel ? 'rgba(255,255,255,0.10)' : P.glass
          return (
            <button key={c.id} type="button" disabled={disabled} onClick={() => setValue(c.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                minHeight: 'clamp(50px, 6.4vh, 76px)', padding: 'clamp(9px, 1.1vw, 15px) clamp(10px, 1.2vw, 18px)',
                borderRadius: 12, border: `2px solid ${border}`, background: bg, color: P.cream,
                fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums',
                fontSize: 'clamp(17px, 1.95vw, 27px)', fontWeight: 700, lineHeight: 1.2,
                cursor: disabled ? 'default' : 'pointer',
                boxShadow: sel && !reveal ? `0 0 0 3px ${P.gold}33` : 'none',
                transition: 'border-color 140ms, background 140ms',
              }}>
              {c.label}
            </button>
          )
        })}
      </div>
      <CommitBtn P={P} label={commitLabel} onClick={() => { if (value) onCommit(value) }} disabled={disabled || !value} />
    </div>
  )
}

/** StepPicker — "pick the next correct move" for multi-step equations, systems, and
 *  proofs. A vertical stack of full-statement cards (distractors should be common
 *  errors). Same commit model as SpecPicker. */
export function StepPicker({
  P, choices, value, setValue, correct, disabled, reveal, onCommit, commitLabel = "THAT'S THE MOVE ✓", prompt,
}: {
  P: Palette; choices: SpecChoice[]; value: string; setValue: (id: string) => void
  correct?: string; disabled?: boolean; reveal?: boolean; onCommit: (id: string) => void
  commitLabel?: string; prompt?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 1.2vw, 16px)', width: '100%' }}>
      {prompt && <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(11px, 1.1vw, 15px)', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.creamSoft }}>{prompt}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(7px, 0.9vw, 12px)', width: '100%', maxWidth: 'clamp(340px, 48vw, 600px)' }}>
        {choices.map((c) => {
          const sel = value === c.id
          const isRight = reveal && correct === c.id
          const isWrong = reveal && sel && correct !== c.id
          const border = isRight ? P.mint : isWrong ? P.coral : sel ? P.gold : P.glassBorder
          const bg = isRight ? 'rgba(63,167,124,0.16)' : isWrong ? 'rgba(224,72,63,0.14)' : sel ? 'rgba(255,255,255,0.09)' : P.glass
          return (
            <button key={c.id} type="button" disabled={disabled} onClick={() => setValue(c.id)}
              style={{
                display: 'flex', alignItems: 'center', textAlign: 'left', gap: 10, width: '100%',
                minHeight: 'clamp(44px, 5.2vh, 60px)', padding: 'clamp(10px, 1.1vw, 15px) clamp(13px, 1.4vw, 20px)',
                borderRadius: 11, border: `2px solid ${border}`, background: bg, color: P.cream,
                fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums',
                fontSize: 'clamp(15px, 1.6vw, 22px)', fontWeight: 700, lineHeight: 1.3,
                cursor: disabled ? 'default' : 'pointer',
                transition: 'border-color 140ms, background 140ms',
              }}>
              {c.label}
            </button>
          )
        })}
      </div>
      <CommitBtn P={P} label={commitLabel} onClick={() => { if (value) onCommit(value) }} disabled={disabled || !value} />
    </div>
  )
}

// ── PartsBuilder — a "build the answer" input (production, not recognition) ────
// Two integer steppers assemble a live template — e.g. (x + a)(x + b) for factoring,
// or x = a, b for roots. The student CONSTRUCTS the answer instead of picking it from
// four. V = {a,b}; the caller's grade compares (order-independent where it wants).
export interface Parts { a: number; b: number }
export function PartsBuilder({
  P, value, setValue, min = -9, max = 9, template, labels = ['first', 'second'],
  disabled, reveal, onCommit, commitLabel = 'BUILD IT ✓',
}: {
  P: Palette; value: Parts; setValue: (v: Parts) => void; min?: number; max?: number
  template: (a: number, b: number) => React.ReactNode; labels?: [string, string]
  disabled?: boolean; reveal?: boolean; onCommit: (v: Parts) => void; commitLabel?: string
}) {
  const step = (k: 'a' | 'b', dv: number) => {
    const nv = Math.max(min, Math.min(max, value[k] + dv))
    setValue({ ...value, [k]: nv })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px, 1.6vw, 20px)', width: '100%' }}>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(26px, 3.6vw, 46px)', fontWeight: 800, color: reveal ? P.mint : P.gold, textShadow: `0 0 18px ${(reveal ? '#3fa77c' : P.goldDeep)}55`, letterSpacing: '0.02em', textAlign: 'center' }}>
        {template(value.a, value.b)}
      </div>
      <div style={{ display: 'flex', gap: 'clamp(20px, 3vw, 46px)' }}>
        {(['a', 'b'] as const).map((k, i) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(6px, 0.8vw, 10px)' }}>
            <Nudge P={P} label="▲" onClick={() => step(k, +1)} disabled={disabled} />
            <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800, color: P.cream, minWidth: '1.8em', textAlign: 'center' }}>{value[k] > 0 ? `+${value[k]}` : value[k]}</div>
            <Nudge P={P} label="▼" onClick={() => step(k, -1)} disabled={disabled} />
            <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px, 1vw, 13px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: P.creamSoft }}>{labels[i]}</div>
          </div>
        ))}
      </div>
      <CommitBtn P={P} label={commitLabel} onClick={() => onCommit(value)} disabled={disabled} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// THE 17–18 PRIMITIVES — three answering instruments the last three chapters of
// that band cannot exist without (docs/teen-17-18-gameshell-plan.md §4). Each one
// exists so a structured answer can be BUILT rather than picked off a card, which
// is the whole argument the band's migration rests on.
//
// ⚠️ The plan also lists "lift RayLine out of BalanceBench" in this wave. It is NOT
// done here: RayLine is wanted by functionToolkit and rationalFunctions, both of
// which have already shipped with their own working answer surfaces. Lifting it now
// would mean reopening two live chapters for no gain to the three being built.
// ══════════════════════════════════════════════════════════════════════════════

/** MatrixPad — the answer IS a matrix, built entry by entry on ± steppers.
 *  `value` is row-major; the shape is taken from it, so the same control serves a
 *  2×2 result, a column of prices, or a 2×3. */
export function MatrixPad({
  P, value, setValue, min = -20, max = 20, disabled, reveal, onCommit, commitLabel = 'TOTAL IT ✓', caption,
}: {
  P: Palette; value: number[][]; setValue: (m: number[][]) => void
  min?: number; max?: number; disabled?: boolean; reveal?: boolean
  onCommit: (m: number[][]) => void; commitLabel?: string; caption?: string
}) {
  const col = reveal ? P.mint : P.gold
  const set = (r: number, c: number, dv: number) =>
    setValue(value.map((row, i) => row.map((v, j) => (i === r && j === c ? Math.max(min, Math.min(max, v + dv)) : v))))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px,1.3vw,18px)', width: '100%' }}>
      {caption && <div style={{ fontFamily: 'var(--font-numeric)', fontSize: 'clamp(10px,1vw,13px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: P.mutedOnPaper }}>{caption}</div>}
      {/* Square brackets drawn either side, so it reads as a matrix and not a form. */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 'clamp(5px,0.7vw,10px)' }}>
        <div style={{ width: 10, borderLeft: `2.5px solid ${col}`, borderTop: `2.5px solid ${col}`, borderBottom: `2.5px solid ${col}`, borderRadius: '4px 0 0 4px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${value[0]?.length ?? 2}, minmax(0, 1fr))`, gap: 'clamp(6px,0.9vw,14px)', padding: 'clamp(4px,0.6vw,9px) clamp(2px,0.4vw,6px)' }}>
          {value.flatMap((row, r) => row.map((v, c) => (
            <div key={`${r}-${c}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Nudge P={P} label="▲" disabled={disabled} onClick={() => set(r, c, +1)} />
              <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(17px,2vw,28px)', color: P.cream, minWidth: '2.1em', textAlign: 'center' }}>
                {disp(v)}
              </div>
              <Nudge P={P} label="▼" disabled={disabled} onClick={() => set(r, c, -1)} />
            </div>
          )))}
        </div>
        <div style={{ width: 10, borderRight: `2.5px solid ${col}`, borderTop: `2.5px solid ${col}`, borderBottom: `2.5px solid ${col}`, borderRadius: '0 4px 4px 0' }} />
      </div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

export interface Wave { a: number; b: number; h: number; k: number }
/** CurveMatch — reshape a drawn wave against a target trace with labelled dials.
 *  The generalisation of LineSetter from a straight line to `a·sin(b(x−h))+k`, and
 *  the answer IS the match: the child stops when their curve lies on the target.
 *  `dials` names which of the four are live, so a chapter only exposes the ones its
 *  question is about (a period question should not hand over the amplitude). */
export function CurveMatch({
  P, value, setValue, target, dials = ['a', 'b', 'k'], disabled, reveal, onCommit, commitLabel = 'MATCH IT ✓', unit = '',
}: {
  P: Palette; value: Wave; setValue: (w: Wave) => void
  /** The wave to lie on top of. Omit to draw the child's curve alone. */
  target?: Wave
  dials?: ('a' | 'b' | 'h' | 'k')[]
  disabled?: boolean; reveal?: boolean; onCommit: (w: Wave) => void; commitLabel?: string
  /** Suffix on the readout, e.g. ' h' for hours of daylight. */
  unit?: string
}) {
  const W = 260, H = 150, pad = 16
  /** ⚠️ The vertical runs 0..TOP, NOT ±TOP about the centre. A daylight year lives
   *  at 12 ± 5 — entirely positive — so a zero-centred axis draws the whole target
   *  above the top edge, where the clamp flattens it into a line along the ceiling
   *  and the child has nothing to match. (Third time this band has been bitten by a
   *  chart scaled to the wrong range; see ColdSnap and BalanceThatGrows.) */
  const TOP = 18
  const yFor = (v: number) => H - pad - (v / TOP) * (H - 2 * pad)
  const col = reveal ? P.mint : P.gold
  const path = (w: Wave) => Array.from({ length: 97 }, (_, i) => {
    const t = (i / 96) * 2 * Math.PI
    const x = pad + (i / 96) * (W - 2 * pad)
    const y = yFor(w.a * Math.sin(w.b * (t - w.h)) + w.k)
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${Math.max(2, Math.min(H - 2, y)).toFixed(1)}`
  }).join(' ')
  const LABEL: Record<string, string> = { a: 'swing', b: 'cycles', h: 'shift', k: 'middle' }
  const LIMIT: Record<string, [number, number]> = { a: [0, 7], b: [1, 4], h: [-3, 3], k: [0, 14] }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(9px,1.2vw,16px)', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 'clamp(200px, 27vw, 330px)', display: 'block' }} aria-hidden>
        <rect x={0} y={0} width={W} height={H} rx={10} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
        <line x1={pad} y1={yFor(value.k)} x2={W - pad} y2={yFor(value.k)} stroke={P.glassBorder} strokeWidth={1} strokeDasharray="4 4" />
        {/* 12 h — the equinox line every daylight year wanders around */}
        <line x1={pad} y1={yFor(12)} x2={W - pad} y2={yFor(12)} stroke={P.creamSoft} strokeWidth={0.8} opacity={0.3} />
        <text x={pad + 2} y={yFor(12) - 3} fill={P.mutedOnPaper} fontSize={7} fontFamily="var(--font-numeric)">12 h</text>
        {/* the year to match, drawn faint underneath */}
        {target && <path d={path(target)} fill="none" stroke={P.creamSoft} strokeWidth={3} opacity={0.42} />}
        <path d={path(value)} fill="none" stroke={col} strokeWidth={2.4} />
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(13px,1.5vw,19px)', fontWeight: 800, color: col }}>
        {dials.map((d) => `${LABEL[d]} ${d === 'a' ? value.a : d === 'b' ? value.b : d === 'h' ? value.h : value.k}${d === 'b' ? '' : unit}`).join(' · ')}
      </div>
      <div style={{ display: 'flex', gap: 'clamp(10px,1.6vw,26px)', flexWrap: 'wrap', justifyContent: 'center' }}>
        {dials.map((d) => (
          <DialCol key={d} P={P} label={LABEL[d]} value={value[d]} col={col} disabled={disabled}
            onDown={() => setValue({ ...value, [d]: Math.max(LIMIT[d][0], value[d] - 1) })}
            onUp={() => setValue({ ...value, [d]: Math.min(LIMIT[d][1], value[d] + 1) })} />
        ))}
      </div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

/** CircleTap — put the pod at an angle on a circle. Promotes the read-only
 *  UnitCircleExplorer sim into an answering instrument: `stops` are the angles the
 *  child may land on (the special angles), stepped rather than dragged so the answer
 *  is exact. `showCoords` draws the cos/sin projections without ever printing the
 *  exact pair — printing it would answer a coordinate question outright. */
export function CircleTap({
  P, value, setValue, stops, disabled, reveal, onCommit, commitLabel = 'STOP HERE ✓', showCoords,
}: {
  P: Palette; value: number; setValue: (deg: number) => void; stops: number[]
  disabled?: boolean; reveal?: boolean; onCommit: (deg: number) => void
  commitLabel?: string; showCoords?: boolean
}) {
  const S = 210, R = 76, cx = S / 2, cy = S / 2
  const col = reveal ? P.mint : P.gold
  const rad = (value * Math.PI) / 180
  const px = cx + R * Math.cos(rad), py = cy - R * Math.sin(rad)
  const i = Math.max(0, stops.indexOf(value))
  const step = (d: number) => setValue(stops[(i + d + stops.length) % stops.length])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(9px,1.2vw,16px)', width: '100%' }}>
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 'clamp(170px, 22vw, 260px)', display: 'block' }} aria-hidden>
        <circle cx={cx} cy={cy} r={R + 14} fill="rgba(0,0,0,0.26)" stroke={P.glassBorder} strokeWidth={1} />
        <line x1={cx - R - 10} y1={cy} x2={cx + R + 10} y2={cy} stroke={P.glassBorder} strokeWidth={1} />
        <line x1={cx} y1={cy - R - 10} x2={cx} y2={cy + R + 10} stroke={P.glassBorder} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={P.creamSoft} strokeWidth={1.4} opacity={0.6} />
        {/* every pod on the wheel, so the stops are visible before you move */}
        {stops.map((s) => {
          const r2 = (s * Math.PI) / 180
          return <circle key={s} cx={cx + R * Math.cos(r2)} cy={cy - R * Math.sin(r2)} r={2.6} fill={P.mutedOnPaper} />
        })}
        {showCoords && (
          <>
            <line x1={px} y1={py} x2={px} y2={cy} stroke={col} strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
            <line x1={px} y1={py} x2={cx} y2={py} stroke={col} strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
          </>
        )}
        <line x1={cx} y1={cy} x2={px} y2={py} stroke={col} strokeWidth={2.6} />
        <circle cx={px} cy={py} r={6} fill={col} stroke={P.nightBot} strokeWidth={1.5} />
      </svg>
      <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(20px,2.6vw,34px)', fontWeight: 800, color: col }}>{value}°</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px,1vw,14px)' }}>
        <Nudge P={P} label="↺" disabled={disabled} onClick={() => step(-1)} />
        <Nudge P={P} label="↻" disabled={disabled} onClick={() => step(+1)} />
      </div>
      <CommitBtn P={P} label={commitLabel} disabled={disabled} onClick={() => onCommit(value)} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPRESSION ENGINE — tokens the child COLLAPSES one operation at a time, so the
// answer EMERGES from the illustration (order of operations / substitution) instead
// of being worked out in the head and dialed. Shared by the Order-of-Operations and
// Algebraic-Expressions chapters. Pure + additive (touches no existing export).
// ══════════════════════════════════════════════════════════════════════════════
export type ETok =
  | { k: 'num'; v: number }
  | { k: 'op'; op: '+' | '−' | '×' | '÷' }
  | { k: 'pow'; base: number; exp: number }
  | { k: 'lp' }
  | { k: 'rp' }

const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const supToInt = (s: string) => parseInt([...s].map((c) => `${SUPS.indexOf(c)}`).join(''), 10)

/** Parse a spaced expression string ("3 + 2 × 5", "(3 + 2) × 5", "2³ − 4"). Operands
 *  are non-negative; − is the unicode minus used across these chapters. */
export function parseExpr(s: string): ETok[] {
  const out: ETok[] = []
  for (const chunk of s.trim().split(/\s+/)) {
    let c = chunk
    while (c[0] === '(') { out.push({ k: 'lp' }); c = c.slice(1) }
    let rp = 0
    while (c[c.length - 1] === ')') { rp++; c = c.slice(0, -1) }
    if (c === '+' || c === '−' || c === '×' || c === '÷') out.push({ k: 'op', op: c })
    else if ([...c].some((ch) => SUPS.includes(ch))) {
      const base = parseInt(c.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, ''), 10)
      const exp = supToInt(c.replace(/[^⁰¹²³⁴⁵⁶⁷⁸⁹]/g, ''))
      out.push({ k: 'pow', base, exp })
    } else out.push({ k: 'num', v: parseInt(c, 10) })
    for (let i = 0; i < rp; i++) out.push({ k: 'rp' })
  }
  return out
}

const applyOp = (a: number, op: string, b: number) => (op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b)

/** Indices that can be evaluated right now: a pow, or an op whose BOTH neighbours are
 *  plain numbers — so an op locked inside brackets can't fire until the bracket
 *  collapses, which is exactly what forces "brackets first". */
export function evaluable(toks: ETok[]): Set<number> {
  const s = new Set<number>()
  toks.forEach((t, i) => {
    if (t.k === 'pow') s.add(i)
    else if (t.k === 'op' && toks[i - 1]?.k === 'num' && toks[i + 1]?.k === 'num') s.add(i)
  })
  return s
}

/** Collapse the token at i (pow or op) to its value, dropping a wrapping pair of
 *  parens if the op is the sole thing inside them. */
export function collapseAt(toks: ETok[], i: number): ETok[] {
  const t = toks[i]
  if (t.k === 'pow') return [...toks.slice(0, i), { k: 'num', v: Math.pow(t.base, t.exp) } as ETok, ...toks.slice(i + 1)]
  if (t.k !== 'op') return toks
  const a = (toks[i - 1] as { v: number }).v, b = (toks[i + 1] as { v: number }).v
  const v = tidy(applyOp(a, t.op, b))
  const wrapped = toks[i - 2]?.k === 'lp' && toks[i + 2]?.k === 'rp'
  const lo = wrapped ? i - 2 : i - 1
  const hi = wrapped ? i + 2 : i + 1
  return [...toks.slice(0, lo), { k: 'num', v } as ETok, ...toks.slice(hi + 1)]
}

/** The index precedence says to evaluate NEXT (pow → bracketed → ×÷ → +−, leftmost).
 *  Auto-solves on a wrong answer and spotlights the next step while teaching. */
export function correctNextIndex(toks: ETok[]): number {
  const idx = [...evaluable(toks)]
  if (!idx.length) return -1
  const pow = idx.filter((i) => toks[i].k === 'pow')
  if (pow.length) return Math.min(...pow)
  const bracketed = idx.filter((i) => toks[i - 2]?.k === 'lp' && toks[i + 2]?.k === 'rp')
  if (bracketed.length) return Math.min(...bracketed)
  const md = idx.filter((i) => { const t = toks[i]; return t.k === 'op' && (t.op === '×' || t.op === '÷') })
  if (md.length) return Math.min(...md)
  return Math.min(...idx)
}

/** Render an expression as chips. When `onTap` is given, evaluable ops/pow become
 *  buttons — the child taps one to work that step out; `highlight` spotlights the
 *  next step with a gold ring; a fully-collapsed single value shows big (mint on
 *  reveal). Numbers and parens are plain, non-interactive chips. */
export function ExprChips({ P, toks, onTap, highlight, reveal, size = 'md' }: {
  P: Palette; toks: ETok[]; onTap?: (i: number) => void; highlight?: number; reveal?: boolean; size?: 'md' | 'lg'
}) {
  const ev = onTap ? evaluable(toks) : new Set<number>()
  if (toks.length === 1 && toks[0].k === 'num') {
    return <div style={{ fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 'clamp(40px,8.4vw,74px)', lineHeight: 1, color: reveal ? P.mint : P.gold, textShadow: `0 0 22px ${(reveal ? '#3fa77c' : P.goldDeep)}66` }}>{tidy((toks[0] as { v: number }).v)}</div>
  }
  const numFs = size === 'lg' ? 'clamp(26px,4.8vw,46px)' : 'clamp(22px,3.8vw,36px)'
  const numStyle: React.CSSProperties = { fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: numFs, lineHeight: 1, color: P.cream, padding: '4px 6px' }
  const parenStyle: React.CSSProperties = { ...numStyle, color: P.gold }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 'clamp(3px,0.8vw,8px)', maxWidth: '100%' }}>
      {toks.map((t, i) => {
        if (t.k === 'num') return <span key={i} style={numStyle}>{tidy(t.v)}</span>
        if (t.k === 'lp') return <span key={i} style={parenStyle}>(</span>
        if (t.k === 'rp') return <span key={i} style={parenStyle}>)</span>
        const label = t.k === 'pow' ? <span>{t.base}<sup style={{ fontSize: '0.6em' }}>{t.exp}</sup></span> : t.op
        const hot = highlight === i
        const tappable = ev.has(i)
        if (!tappable) {
          return <span key={i} style={{ ...numStyle, color: hot ? P.goldDeep : P.cream, opacity: t.k === 'op' ? 0.9 : 1 }}>{label}</span>
        }
        return (
          <button key={i} type="button" onClick={() => onTap!(i)} className={hot ? 'gk-hot' : undefined}
            style={{
              fontFamily: 'var(--font-numeric)', fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: numFs, lineHeight: 1,
              padding: '5px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 140ms, border-color 140ms, transform 120ms',
              background: hot ? P.gold : P.glass, color: hot ? '#241c3a' : P.cream, border: `2px solid ${hot ? P.goldDeep : P.glassBorder}`,
            }}>{label}</button>
        )
      })}
      <style>{'.gk-hot{animation:gkHot 1.1s ease-in-out infinite}@keyframes gkHot{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}@media (prefers-reduced-motion:reduce){.gk-hot{animation:none}}'}</style>
    </div>
  )
}

export { Nudge }
