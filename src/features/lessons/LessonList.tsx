'use client'
/**
 * The new-flow topic list, drawn as a winding path: one module's topics in teaching order, one stop per topic.
 * Portrait (phone): the path runs top to bottom. Landscape (tablet sideways, laptop): it runs left to right.
 * The first unfinished topic glows and breathes, says "Click here" and carries its number in a small badge (founder,
 * 2026-09-24); every other stop is dimmed and shows only its number — a done one also gets a green tick. An arrow on
 * each stretch of trail points the way. Nothing is locked: a child may replay or jump ahead.
 */
import { showDay } from './progressReport'
import Link from 'next/link'
import { useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import type { Module } from './modules'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { loadRun } from '@/infra/storage/lessonRun'
import { C } from './sessionCopy'
import { INK, TEAL, GOOD, pill, PAGE_BG, shell, topBar } from './Pictures'

const LANDSCAPE = '(orientation: landscape) and (min-width: 700px)'
const subscribe = (cb: () => void) => { const m = matchMedia(LANDSCAPE); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) }

const STEP = 128   // distance between stops along the path
const CROSS = 44   // how far a stop swings off the centre line (% of the width when vertical; px when horizontal)
const H = 480      // height of the horizontal map (room above and below for the labels)


/** `due` = the parent's due date per assigned lesson (Assign lessons); shown on each topic not done yet. */
export function LessonList({ module, learnerId, back, due }: { module: Module; learnerId: string | null; back?: { href: string; label: string }; due?: Record<string, string> | null }) {
  const lessons = module.lessons
  const across = useSyncExternalStore(subscribe, () => matchMedia(LANDSCAPE).matches, () => false)
  // Read during render: both callers mount this on the client only, after kv has hydrated.
  const done = lessons.filter(l => lessonDone(learnerId, l.id)).map(l => l.id)
  const nextUp = lessons.find(l => !done.includes(l.id))?.id
  const n = lessons.length
  // The map's width in px: a vertical trail is drawn in % across, and an arrow needs the real slope to point along it.
  const box = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Stop i's position. Vertical: left in %, top in px. Horizontal: both in px (the map scrolls sideways if it is wider than the screen).
  const along = (i: number) => STEP / 2 + i * STEP
  const side = (i: number) => (i % 2 ? 1 : -1)
  const pos = (i: number) => across ? { x: along(i) + 30, y: H / 2 + side(i) * (CROSS + 20) } : { x: 50 + side(i) * (CROSS / 2), y: along(i) }
  const W = across ? n * STEP + 60 : 100
  /** Where the arrow on stretch i sits (the curve's midpoint) and which way it points, in degrees (0 = right). */
  const arrow = (i: number) => {
    const a = pos(i), b = pos(i + 1)
    // The curve's direction at its midpoint: vertical (1.5·dx, 0.75·STEP), horizontal (0.75·STEP, 1.5·dy).
    const deg = across ? Math.atan2(1.5 * (b.y - a.y), 0.75 * STEP) : Math.atan2(0.75 * STEP, 1.5 * (b.x - a.x) / 100 * w)
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, deg: deg * 180 / Math.PI }
  }
  const trail = (i: number) => {
    const a = pos(i), b = pos(i + 1)
    return across
      ? `M ${a.x} ${a.y} C ${a.x + STEP / 2} ${a.y} ${b.x - STEP / 2} ${b.y} ${b.x} ${b.y}`
      : `M ${a.x} ${a.y} C ${a.x} ${a.y + STEP / 2} ${b.x} ${b.y - STEP / 2} ${b.x} ${b.y}`
  }

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 32px', display: 'flex', justifyContent: 'center' }}>
      <style>{`@keyframes lp-breathe { 0%,100% { transform: translate(-50%, -50%) scale(1) } 50% { transform: translate(-50%, -50%) scale(1.1) } }
@keyframes lp-glow { 0%,100% { box-shadow: 4px 4px 0 ${INK}, 0 0 0 6px #ffd16699, 0 0 18px 6px #ffd166 } 50% { box-shadow: 4px 4px 0 ${INK}, 0 0 0 10px #ffd16666, 0 0 34px 14px #ffd166 } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important } }`}</style>
      <div style={{ ...shell, maxWidth: across ? 1180 : 620, alignSelf: 'flex-start' }}>
        <div style={topBar}>
          {back ? <Link href={back.href} style={{ ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>{back.label}</Link> : <span />}
          <span style={{ fontSize: 'clamp(15px, 3.6vw, 18px)', textAlign: 'center' }}>Grade {module.grade} · Module {module.n}</span>
          <span style={{ background: '#ffd166', border: `3px solid ${INK}`, borderRadius: 999, padding: '6px 12px', whiteSpace: 'nowrap' }}>{done.length} of {n} done</span>
        </div>
        <div style={{ padding: 'clamp(14px, 3vw, 24px)' }}>
          <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(26px, 4.5vw, 36px)', color: INK, lineHeight: 1.1 }}>{module.title}</h1>

          <div style={{ overflowX: across ? 'auto' : 'visible', paddingBottom: across ? 8 : 0 }}>
            <div ref={box} style={{ position: 'relative', margin: '0 auto', ...(across ? { width: W, height: H } : { height: n * STEP }) }}>
              {/* The trail. Vertical: stretched to the box (non-scaling strokes keep an even width). A segment turns solid teal once its topic is done. */}
              <svg viewBox={`0 0 ${W} ${across ? H : n * STEP}`} preserveAspectRatio="none" aria-hidden
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                {lessons.slice(0, -1).map((l, i) => (
                  <path key={l.id} d={trail(i)} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke"
                    stroke={done.includes(l.id) ? TEAL : INK} strokeWidth={done.includes(l.id) ? 12 : 5} strokeDasharray={done.includes(l.id) ? undefined : '2 14'} />
                ))}
              </svg>
              {/* One arrow per stretch, pointing to the next topic. */}
              {lessons.slice(0, -1).map((l, i) => {
                const { x, y, deg } = arrow(i)
                return <span key={l.id} aria-hidden style={{ position: 'absolute', display: 'block', top: y, left: across ? x : `${x}%`, width: 0, height: 0,
                  borderLeft: `18px solid ${done.includes(l.id) ? TEAL : INK}`, borderTop: '6px solid transparent', borderBottom: '6px solid transparent',
                  transform: `translate(-50%, -50%) rotate(${deg}deg)`, pointerEvents: 'none' }} />
              })}

              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {lessons.map((l, i) => {
                  const isDone = done.includes(l.id), isNext = l.id === nextUp
                  const size = isNext ? 84 : 68, { x, y } = pos(i)
                  const gap = size / 2 + 12
                  // Dimmed with solid muted colours, not opacity: a see-through stop shows the trail running through it.
                  const dim: CSSProperties = isNext ? {} : { opacity: 0.5 }
                  const dimStop: CSSProperties = isNext ? {} : { background: '#f3ede6', borderColor: MUTED, boxShadow: `4px 4px 0 ${MUTED}`, color: MUTED }
                  const faded: CSSProperties = isNext ? {} : { opacity: 0.45 }
                  // The label sits on the open side of its stop: right/left when vertical, above/below when horizontal.
                  const label: CSSProperties = across
                    ? { left: 0, width: STEP + 16, transform: 'translateX(-50%)', textAlign: 'center', display: 'flex', alignItems: 'center',
                        ...(side(i) < 0 ? { bottom: gap, flexDirection: 'column-reverse' } : { top: gap, flexDirection: 'column' }) }
                    : { top: 0, transform: 'translateY(-50%)', width: 'min(210px, 42vw)', ...(side(i) < 0 ? { left: gap } : { right: gap, textAlign: 'right' }) }
                  return (
                    <li key={l.id} style={{ position: 'absolute', top: y, left: across ? x : `${x}%`, width: 0, height: 0 }}>
                      <Link href={`/lesson?id=${l.id}`} aria-label={`${i + 1}. ${l.title}${isDone ? ', done' : isNext ? ', next up' : ''}`}
                        style={{ ...stop, width: size, height: size, background: isNext ? '#ffd166' : '#fff', ...dimStop,
                          ...(isNext ? { animation: 'lp-breathe 2.4s ease-in-out infinite, lp-glow 2.4s ease-in-out infinite', boxShadow: `4px 4px 0 ${INK}, 0 0 0 6px #ffd16699, 0 0 18px 6px #ffd166` } : {}) }}>
                        {isNext
                          ? <b style={{ fontSize: 15, lineHeight: 1.05, textAlign: 'center', fontFamily: 'var(--font-display)' }}>Click here</b>
                          : <b style={{ fontSize: 26, ...faded }}>{i + 1}</b>}
                        {isNext && <span style={{ ...badge, background: '#ff6b4a', color: '#fff' }}>{i + 1}</span>}
                      </Link>
                      {/* Outside the dimmed stop, so the tick itself is not dimmed. */}
                      {isDone && <span aria-hidden style={{ ...badge, top: -size / 2 - 6, left: size / 2 - 22, width: 32, height: 32, fontSize: 18, background: GOOD, color: '#fff', pointerEvents: 'none' }}>✓</span>}
                      <Link href={`/lesson?id=${l.id}`} tabIndex={-1} aria-hidden style={{ position: 'absolute', textDecoration: 'none', color: INK, ...label, ...dim }}>
                        <b style={{ display: 'inline-block', fontFamily: 'var(--font-display)', fontSize: isNext ? 19 : 16, lineHeight: 1.2, background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, padding: '6px 10px', boxShadow: `3px 3px 0 ${INK}` }}>{l.title}</b>
                        {/* A topic the child took a break from: an invitation, never "not completed" (founder, 2026-09-24). */}
                        {!isDone && loadRun(learnerId, l.id) && <span style={{ display: 'block', width: 'fit-content', ...(!across && side(i) > 0 ? { marginLeft: 'auto' } : {}), marginTop: 6,
                          background: '#fff', border: `3px solid ${INK}`, borderRadius: 999, padding: '2px 10px', fontWeight: 800, fontSize: 14 }}>⭐ {C.started}</span>}
                        {/* Never "late" to a child: the date is information, not a mark against them. */}
                        {!isDone && due?.[l.id] && <span style={{ display: 'block', width: 'fit-content', ...(!across && side(i) > 0 ? { marginLeft: 'auto' } : {}), marginTop: 6,
                          background: '#ffd166', border: `3px solid ${INK}`, borderRadius: 999, padding: '2px 10px', fontWeight: 800, fontSize: 14 }}>Due {showDay(due[l.id])}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** A dimmed stop's ink: done, or not reached yet. */
const MUTED = '#b3a79e'
const stop: CSSProperties = { position: 'absolute', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', border: `4px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}`, textDecoration: 'none', color: INK }
const badge: CSSProperties = { position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontWeight: 900, fontSize: 14, border: `3px solid ${INK}` }
