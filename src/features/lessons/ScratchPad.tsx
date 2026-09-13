'use client'
/**
 * A scratch pad the child can draw on with a finger, pen or mouse: Pencil, Eraser, Clear pad, on grid paper.
 * Nothing on it is read or graded. It clears itself when `clearKey` changes (a new problem).
 * ponytail: a plain canvas; a resize keeps the drawing but does not rescale it. Add stroke replay if that shows up on rotate.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { pill, INK, TEAL } from './Pictures'

export function ScratchPad({ clearKey }: { clearKey: string | number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil')

  const clear = () => { const c = canvas.current; c?.getContext('2d')?.clearRect(0, 0, c.width, c.height) }
  useEffect(clear, [clearKey])

  // Keep the backing store at the element's real pixel size, so lines are crisp on a retina tablet.
  useEffect(() => {
    const c = canvas.current!
    const fit = () => {
      const { width, height } = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1
      const w = Math.round(width * dpr), h = Math.round(height * dpr)
      if (w === c.width && h === c.height) return
      const keep = document.createElement('canvas'); keep.width = c.width; keep.height = c.height
      keep.getContext('2d')!.drawImage(c, 0, 0)
      c.width = w; c.height = h
      c.getContext('2d')!.drawImage(keep, 0, 0)
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(c)
    return () => ro.disconnect()
  }, [])

  const at = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), dpr = window.devicePixelRatio || 1
    return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr }
  }
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d'), p = at(e), from = last.current ?? p, dpr = window.devicePixelRatio || 1
    if (!ctx) return
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.lineWidth = (tool === 'eraser' ? 26 : 4) * dpr
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(p.x, p.y); ctx.stroke()
    last.current = p
  }

  const toolBtn = (on: boolean): CSSProperties => ({ ...pill, background: on ? TEAL : '#fff', color: on ? '#fff' : INK })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" style={toolBtn(tool === 'pencil')} aria-pressed={tool === 'pencil'} onClick={() => setTool('pencil')}>Pencil</button>
        <button type="button" style={toolBtn(tool === 'eraser')} aria-pressed={tool === 'eraser'} onClick={() => setTool('eraser')}>Eraser</button>
        <button type="button" style={pill} onClick={clear}>Clear pad</button>
      </div>
      <canvas ref={canvas} aria-label="Scratch pad: draw or write your working here"
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); last.current = null; draw(e) }}
        onPointerMove={e => { if (e.buttons) draw(e) }}
        onPointerUp={() => { last.current = null }} onPointerCancel={() => { last.current = null }}
        style={{ flex: 1, width: '100%', minHeight: 260, touchAction: 'none', cursor: tool === 'eraser' ? 'cell' : 'crosshair',
          border: `4px solid ${INK}`, borderRadius: 18, backgroundColor: '#fffce8', backgroundSize: '28px 28px',
          backgroundImage: 'linear-gradient(#f1d98a 1px, transparent 1px), linear-gradient(90deg, #f1d98a 1px, transparent 1px)' }} />
    </div>
  )
}
