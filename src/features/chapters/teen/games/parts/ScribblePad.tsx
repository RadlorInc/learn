'use client'
/**
 * ScribblePad — scratch paper for the teen practice loop. Kids on iPads (finger
 * or Pencil) and laptops (mouse/trackpad) need somewhere to work a question out;
 * before this the only surface was the answer itself.
 *
 * Deliberately NOT a modal: no backdrop, nothing disabled behind it. The child
 * scribbles, then taps the answer without closing anything. It sits bottom-right
 * so the question board (top-left on a roomy instrument screen, top-centre on a
 * pad question) stays readable while working.
 *
 * Strokes are kept as points, not pixels, so undo and a resize/rotate redraw are
 * free. `resetKey` wipes the paper when it changes — a new question is a new page.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Palette } from './gameKit'

/** The shapes a child can stamp instead of drawing freehand. Chosen for what this
 *  band actually gets asked: area/perimeter (rect), circles, Pythagoras (right
 *  triangle), and plotting (axes) — all of them slow and wobbly to draw by hand,
 *  which is exactly when a child gives up and guesses instead. */
const SHAPES = ['rect', 'circle', 'tri', 'right', 'axes'] as const
type ShapeKind = typeof SHAPES[number]
const SHAPE_LABEL: Record<ShapeKind, string> = {
  rect: 'Rectangle', circle: 'Circle', tri: 'Triangle', right: 'Right triangle', axes: 'Axes',
}
/** A native <option> can hold text and nothing else — no SVG, no canvas — so the
 *  preview beside each name is a Geometric Shapes glyph, all of them present in the
 *  default system fonts on iPadOS, macOS and Windows. */
const SHAPE_GLYPH: Record<ShapeKind, string> = {
  rect: '▭', circle: '○', tri: '△', right: '◺', axes: '+',
}
// Axes is a plain ASCII '+' on purpose: the box-drawing '┼' measured at exactly the
// missing-glyph width here, i.e. it was rendering as tofu. Checked the other four
// the same way (each is narrower than the tofu box, so the font really has them).

type Mark =
  | { kind: 'ink'; pts: { x: number; y: number }[]; erase: boolean }
  | { kind: 'shape'; shape: ShapeKind; x: number; y: number; s: number }

const PEN_W = 3
const ERASE_W = 26

/** Trace a shape into whatever 2D context is passed — the canvas when stamped, and
 *  the same code at icon size inside its toolbar button, so the button always shows
 *  exactly what the child is about to get. */
function traceShape(g: CanvasRenderingContext2D, k: ShapeKind, x: number, y: number, s: number) {
  const h = s / 2
  g.beginPath()
  if (k === 'rect') g.rect(x - h, y - s * 0.32, s, s * 0.64)
  else if (k === 'circle') g.arc(x, y, h, 0, Math.PI * 2)
  else if (k === 'tri') { g.moveTo(x, y - h); g.lineTo(x + h, y + h); g.lineTo(x - h, y + h); g.closePath() }
  else if (k === 'right') { g.moveTo(x - h, y - h); g.lineTo(x - h, y + h); g.lineTo(x + h, y + h); g.closePath() }
  else { g.moveTo(x - h, y); g.lineTo(x + h, y); g.moveTo(x, y - h); g.lineTo(x, y + h) }
  g.stroke()
}

export default function ScribblePad({ P, resetKey, open, onToggle }: { P: Palette; resetKey: string | number; open: boolean; onToggle: (open: boolean) => void }) {
  const [erasing, setErasing] = useState(false)
  const [, bump] = useState(0)            // re-render after undo/clear (marks live in a ref)
  const strokes = useRef<Mark[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const cur = useRef<Extract<Mark, { kind: 'ink' }> | null>(null)

  const paint = useCallback((s: Mark, from = 0) => {
    const c = canvasRef.current
    const g = c?.getContext('2d')
    if (!g) return
    g.lineCap = 'round'
    g.lineJoin = 'round'
    if (s.kind === 'shape') {
      g.strokeStyle = P.inkOnPaper
      g.lineWidth = PEN_W
      traceShape(g, s.shape, s.x, s.y, s.s)
      return
    }
    if (s.pts.length === 0) return
    g.strokeStyle = s.erase ? P.cream : P.inkOnPaper
    g.lineWidth = s.erase ? ERASE_W : PEN_W
    g.beginPath()
    if (s.pts.length === 1) {
      // a tap is a dot, not nothing
      g.arc(s.pts[0].x, s.pts[0].y, g.lineWidth / 2, 0, Math.PI * 2)
      g.fillStyle = g.strokeStyle
      g.fill()
      return
    }
    g.moveTo(s.pts[Math.max(0, from - 1)].x, s.pts[Math.max(0, from - 1)].y)
    for (let i = Math.max(1, from); i < s.pts.length; i++) g.lineTo(s.pts[i].x, s.pts[i].y)
    g.stroke()
  }, [P])

  /** Size the backing store to the device pixel ratio and repaint everything.
   *  Runs on open and on resize — a canvas that is display:none has no size, so
   *  this cannot happen at mount. */
  const redraw = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    const w = c.clientWidth, h = c.clientHeight
    if (!w || !h) return
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    const g = c.getContext('2d')
    if (!g) return
    g.setTransform(dpr, 0, 0, dpr, 0, 0)
    g.fillStyle = P.cream
    g.fillRect(0, 0, w, h)
    // faint grid — squared paper reads as "work it out here", and helps columns line up
    g.strokeStyle = P.mutedOnPaper
    g.globalAlpha = 0.18
    g.lineWidth = 1
    g.beginPath()
    for (let x = 24; x < w; x += 24) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h) }
    for (let y = 24; y < h; y += 24) { g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5) }
    g.stroke()
    g.globalAlpha = 1
    strokes.current.forEach((s) => paint(s))
  }, [P, paint])

  useEffect(() => {
    if (!open) return
    redraw()
    window.addEventListener('resize', redraw)
    return () => window.removeEventListener('resize', redraw)
  }, [open, redraw])

  // A new question is a new page.
  useEffect(() => { strokes.current = []; cur.current = null; bump((n) => n + 1); redraw() }, [resetKey, redraw])

  const at = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    cur.current = { kind: 'ink', pts: [at(e)], erase: erasing }
    strokes.current.push(cur.current)
    paint(cur.current)
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!cur.current) return
    cur.current.pts.push(at(e))
    paint(cur.current, cur.current.pts.length - 1)
  }
  const up = () => { cur.current = null; bump((n) => n + 1) }

  /** Stamp a shape on the paper. Shapes TILE left-to-right and wrap down a row, so a
   *  second one lands beside the first with room to label it — a small cascade offset
   *  was tried and five shapes just piled into one unreadable knot. It is otherwise a
   *  normal mark: Undo, Clear, Erase and the resize redraw all treat it like a stroke. */
  const stamp = (shape: ShapeKind) => {
    const c = canvasRef.current
    if (!c) return
    const w = c.clientWidth, h = c.clientHeight
    // 0.15 of the width, not 0.18, so one of EACH shape fits a row on a full-width
    // pad — at 0.18 only four fitted and the fifth wrapped back onto the first.
    const s = Math.max(44, Math.min(h * 0.55, w * 0.15))
    const gap = 14
    const cell = s + gap
    const cols = Math.max(1, Math.floor((w - gap) / cell))
    const rows = Math.max(1, Math.floor((h - gap) / cell))
    const n = strokes.current.filter((m) => m.kind === 'shape').length % (cols * rows)
    strokes.current.push({
      kind: 'shape', shape, s,
      x: gap / 2 + s / 2 + (n % cols) * cell,
      y: gap / 2 + s / 2 + Math.floor(n / cols) * cell,
    })
    paint(strokes.current[strokes.current.length - 1])
    bump((v) => v + 1)
  }

  const chip = (active?: boolean): React.CSSProperties => ({
    background: active ? P.gold : P.glass,
    border: `1px solid ${active ? P.gold : P.glassBorder}`,
    borderRadius: 8, color: active ? '#1d1608' : P.creamSoft,
    fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'clamp(12px, 1.1vw, 16px)',
    padding: '7px 12px', cursor: 'pointer', minHeight: 36, touchAction: 'manipulation',
    whiteSpace: 'nowrap',   // the row scrolls; a wrapped "✏️ / Write" just looks broken
  })

  if (!open) {
    return (
      <button
        type="button" aria-label="Open the scratch pad" onClick={() => onToggle(true)}
        style={{
          position: 'fixed', right: 12, bottom: 12, zIndex: 8,
          display: 'flex', alignItems: 'center', gap: 8,
          background: P.cream, border: 'none', borderRadius: 12, color: P.inkOnPaper,
          fontFamily: 'var(--font-body)', fontWeight: 900, fontSize: 'clamp(13px, 1.2vw, 17px)',
          padding: '10px 16px', minHeight: 44, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.45)', touchAction: 'manipulation',
        }}
      >✏️ Scratch pad</button>
    )
  }

  return (
    <div
      style={{
        // A DRAWER, and deliberately IN FLOW — the last child of the shell's flex
        // column, so `main` (flex:1, minHeight:0) gives back exactly this height and
        // the question and answers cannot end up behind it. A `position:fixed` panel
        // needs the shell to reserve a matching height, and MEASURED, those two vh
        // values did not agree: the answer tiles sat under the paper.
        // `relative` + zIndex so it paints over the fixed Milo mark rather than
        // letting him sit half-on the writing surface.
        position: 'relative', zIndex: 8, flex: '0 0 auto', width: '100%',
        // Floor is 160 rather than 130 because the toolbar eats ~60 of it: at the old
        // floor a 360-tall landscape phone got a 71px strip of paper, which is not
        // enough to work anything out on. Safe to take, since `main` scrolls.
        height: 'clamp(160px, 34vh, 320px)', display: 'flex', flexDirection: 'column', gap: 6,
        background: P.glass, borderTop: `1px solid ${P.glassBorder}`, borderRadius: '14px 14px 0 0',
        padding: 8, boxSizing: 'border-box', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        boxShadow: '0 -14px 40px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* One row that SCROLLS rather than wraps: the drawer is a fixed height, so a
            toolbar that wrapped to three rows on a phone would eat the paper it sits
            above. Close stays outside the scroller so it is always reachable. */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto' }}>
          <button type="button" aria-pressed={!erasing} onClick={() => setErasing(false)} style={chip(!erasing)}>✏️ Write</button>
          <button type="button" aria-pressed={erasing} onClick={() => setErasing(true)} style={chip(erasing)}>🧽 Erase</button>
          <span aria-hidden style={{ width: 1, alignSelf: 'stretch', background: P.glassBorder, flex: '0 0 auto', margin: '0 2px' }} />
          {/* A native <select>: it is the one control that already gives a touch
              device a proper picker and a laptop a keyboard-navigable menu, with no
              outside-click, focus-trap or portal code to get wrong. Bound to '' so it
              always reads "Shape…" and the same shape can be picked twice in a row. */}
          <select
            aria-label="Draw a shape" value="" onChange={(e) => e.target.value && stamp(e.target.value as ShapeKind)}
            style={{ ...chip(), flex: '0 0 auto', background: P.nightBot, appearance: 'auto' }}
          >
            <option value="" disabled>◇ Shape…</option>
            {SHAPES.map((k) => (
              <option key={k} value={k} style={{ background: P.nightBot, color: P.cream }}>{SHAPE_GLYPH[k]}  {SHAPE_LABEL[k]}</option>
            ))}
          </select>
          <span aria-hidden style={{ width: 1, alignSelf: 'stretch', background: P.glassBorder, flex: '0 0 auto', margin: '0 2px' }} />
          <button type="button" onClick={() => { strokes.current.pop(); bump((n) => n + 1); redraw() }} style={{ ...chip(), flex: '0 0 auto' }}>↶ Undo</button>
          <button type="button" onClick={() => { strokes.current = []; bump((n) => n + 1); redraw() }} style={{ ...chip(), flex: '0 0 auto' }}>Clear</button>
        </div>
        <button type="button" aria-label="Close the scratch pad" onClick={() => onToggle(false)} style={{ ...chip(), flex: '0 0 auto' }}>✕ Close</button>
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{
          display: 'block', width: '100%', flex: 1, minHeight: 0,
          borderRadius: 10, background: P.cream, cursor: 'crosshair',
          // Without this an iPad scrolls/zooms the page instead of drawing.
          touchAction: 'none',
        }}
      />
    </div>
  )
}
