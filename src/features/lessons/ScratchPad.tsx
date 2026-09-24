'use client'
/**
 * A scratch pad the child can draw on with a finger, pen or mouse, on grid paper. Nothing on it is read or graded. It
 * clears itself when `clearKey` changes (a new problem).
 * Tools (Review 1 Q6, founder 2026-09-24): Pencil, Arrow (drag from tail to tip — handy for area models), Eraser; five
 * colours; Undo; Clear pad. Everything drawn is kept as a list of strokes and the canvas is redrawn from it, which is
 * what makes Undo (and Clear, which Undo can take back) possible, and keeps the drawing when the pad changes size.
 * ponytail: every move redraws every stroke; a pad holds one problem's working, so that stays small. Cache a bitmap of
 * the finished strokes if a long drawing ever lags on a slow tablet.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { pill, INK, TEAL } from './Pictures'
import { C } from './sessionCopy'

type Pt = { x: number; y: number }
type Tool = 'pencil' | 'arrow' | 'eraser'
/** A pencil or eraser line (its points), an arrow (tail → tip), or a Clear — kept so Undo can bring the drawing back. */
export type Stroke = { tool: Tool; color: string; pts: Pt[] } | { tool: 'clear' }

/** Ink first. Names are what a screen reader hears and a tooltip shows; the chosen one also carries a ✓. */
export const COLORS = [
  { id: 'ink', hex: INK }, { id: 'blue', hex: '#1d63c9' }, { id: 'green', hex: '#1f7a43' },
  { id: 'orange', hex: '#d9480f' }, { id: 'purple', hex: '#7b3fb8' },
] as const

const COLOR_NAME: Record<(typeof COLORS)[number]['id'], string> = { ink: C.padInk, blue: C.padBlue, green: C.padGreen, orange: C.padOrange, purple: C.padPurple }

/** Draw the strokes onto a 2D context whose units are CSS pixels × `dpr`. After the last Clear only. */
export function paint(ctx: CanvasRenderingContext2D, strokes: readonly Stroke[], dpr: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const from = strokes.map(s => s.tool).lastIndexOf('clear') + 1
  for (const s of strokes.slice(from)) {
    if (s.tool === 'clear' || s.pts.length === 0) continue
    ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.lineWidth = (s.tool === 'eraser' ? 26 : 4) * dpr
    const p = s.pts.map(q => ({ x: q.x * dpr, y: q.y * dpr }))
    ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y)
    const last = p[p.length - 1]
    if (s.tool === 'arrow') ctx.lineTo(last.x, last.y)
    else for (const q of p.slice(1)) ctx.lineTo(q.x, q.y)
    if (p.length === 1) ctx.lineTo(p[0].x + 0.01, p[0].y)   // a tap still leaves a dot
    ctx.stroke()
    if (s.tool === 'arrow' && (last.x !== p[0].x || last.y !== p[0].y)) {
      const a = Math.atan2(last.y - p[0].y, last.x - p[0].x), h = 16 * dpr
      ctx.beginPath(); ctx.moveTo(last.x, last.y)
      ctx.lineTo(last.x - h * Math.cos(a - 0.45), last.y - h * Math.sin(a - 0.45))
      ctx.lineTo(last.x - h * Math.cos(a + 0.45), last.y - h * Math.sin(a + 0.45))
      ctx.closePath(); ctx.fill()
    }
  }
  ctx.globalCompositeOperation = 'source-over'
}

export function ScratchPad({ clearKey }: { clearKey: string | number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pencil')
  const [color, setColor] = useState<string>(INK)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const drawing = useRef<Stroke | null>(null)
  const latest = useRef(strokes)

  const redraw = () => {
    const c = canvas.current, ctx = c?.getContext('2d')
    if (c && ctx) paint(ctx, drawing.current ? [...latest.current, drawing.current] : latest.current, window.devicePixelRatio || 1)
  }
  // A new problem: a clean pad, and nothing to undo into.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on a prop change, as the old clear() did
  useEffect(() => { drawing.current = null; setStrokes([]) }, [clearKey])
  useEffect(() => { latest.current = strokes; redraw() }, [strokes])

  // Keep the backing store at the element's real pixel size, so lines are crisp on a retina tablet; the strokes are in
  // CSS pixels, so a resize redraws them where they were.
  useEffect(() => {
    const c = canvas.current!
    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(c.offsetWidth * dpr), h = Math.round(c.offsetHeight * dpr)
      if (w === c.width && h === c.height) return
      c.width = w; c.height = h
      redraw()
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(c)
    // ⚠️ iPad + Apple Pencil: a pen (or a long touch) on the page starts a text SELECTION and its callout, which takes
    // the stroke away — the pad "got selected" and nothing drew (founder, 2026-09-24). touch-action does not stop that;
    // cancelling the touch does. Native and non-passive, because React's touch handlers are passive and cannot cancel.
    const stop = (e: Event) => e.preventDefault()
    for (const t of ['touchstart', 'touchmove', 'selectstart', 'contextmenu']) c.addEventListener(t, stop, { passive: false })
    return () => { ro.disconnect(); for (const t of ['touchstart', 'touchmove', 'selectstart', 'contextmenu']) c.removeEventListener(t, stop) }
  }, [])

  const at = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect()
    // A zoomed page (Review 1 Q5) reports the pointer in zoomed pixels: bring it back to the canvas's own CSS pixels.
    const k = r.width ? e.currentTarget.offsetWidth / r.width : 1
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k }
  }
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drawing.current = { tool, color, pts: [at(e)] }
    redraw()
  }
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = drawing.current
    if (!s || s.tool === 'clear' || !e.buttons) return
    s.pts = s.tool === 'arrow' ? [s.pts[0], at(e)] : [...s.pts, at(e)]
    redraw()
  }
  const up = () => {
    const s = drawing.current
    drawing.current = null
    if (s) setStrokes(xs => [...xs, s])
  }

  const onScreen = strokes.slice(strokes.map(s => s.tool).lastIndexOf('clear') + 1).length > 0
  const toolBtn = (on: boolean): CSSProperties => ({ ...pill, background: on ? TEAL : '#fff', color: on ? '#fff' : INK })
  const TOOLS: [Tool, string][] = [['pencil', C.padPencil], ['arrow', C.padArrow], ['eraser', C.padEraser]]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' } as CSSProperties}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {TOOLS.map(([t, label]) => (
          <button key={t} type="button" style={toolBtn(tool === t)} aria-pressed={tool === t} onClick={() => setTool(t)}>{t === 'arrow' ? '↗ ' : ''}{label}</button>
        ))}
        <button type="button" style={pill} disabled={strokes.length === 0} onClick={() => setStrokes(xs => xs.slice(0, -1))}>↶ {C.padUndo}</button>
        <button type="button" style={pill} disabled={!onScreen} onClick={() => setStrokes(xs => [...xs, { tool: 'clear' }])}>{C.padClear}</button>
      </div>
      <div role="group" aria-label={C.padColors} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {COLORS.map(c => {
          const on = color === c.hex, name = COLOR_NAME[c.id]
          return <button key={c.id} type="button" aria-label={name} title={name} aria-pressed={on}
            onClick={() => { setColor(c.hex); if (tool === 'eraser') setTool('pencil') }}
            style={{ width: 44, height: 44, borderRadius: '50%', border: `4px solid ${INK}`, background: c.hex, color: '#fff', fontWeight: 900, fontSize: 20,
              boxShadow: on ? `0 0 0 3px #fff, 0 0 0 6px ${INK}` : 'none', cursor: 'pointer' }}>{on ? '✓' : ''}</button>
        })}
      </div>
      <canvas ref={canvas} aria-label="Scratch pad: draw or write your working here"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{ flex: 1, width: '100%', minHeight: 260, touchAction: 'none', cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          border: `4px solid ${INK}`, borderRadius: 18, backgroundColor: '#fffce8', backgroundSize: '28px 28px',
          backgroundImage: 'linear-gradient(#f1d98a 1px, transparent 1px), linear-gradient(90deg, #f1d98a 1px, transparent 1px)' }} />
    </div>
  )
}
