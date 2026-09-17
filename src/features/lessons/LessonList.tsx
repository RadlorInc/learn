'use client'
/**
 * The new-flow topic list, drawn as a winding path: one module's topics in teaching order, one stop per topic.
 * Portrait (phone): the path runs top to bottom. Landscape (tablet sideways, laptop): it runs left to right.
 * The first unfinished topic is "Next up"; nothing is locked (a child may replay or jump ahead).
 */
import { showDay } from './progressReport'
import Link from 'next/link'
import { useSyncExternalStore, type CSSProperties } from 'react'
import type { Module } from './modules'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { Thing, INK, TEAL, pill, PAGE_BG, shell, topBar } from './Pictures'
import type { Lesson, Obj } from './script'

const LANDSCAPE = '(orientation: landscape) and (min-width: 700px)'
const subscribe = (cb: () => void) => { const m = matchMedia(LANDSCAPE); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) }

const STEP = 128   // distance between stops along the path
const CROSS = 44   // how far a stop swings off the centre line (% of the width when vertical; px when horizontal)
const H = 480      // height of the horizontal map (room above and below for labels and the Next up badge)

/** The object a topic is about, from its first picture — so each stop shows cookies, chairs, straws… */
const objOf = (l: Lesson): Obj | null => {
  const p = l.screens[0].pictures.find(p => 'obj' in p)
  return p && 'obj' in p ? p.obj : null
}

/** `due` = the parent's due date per assigned lesson (Assign lessons); shown on each topic not done yet. */
export function LessonList({ module, learnerId, back, due }: { module: Module; learnerId: string | null; back?: { href: string; label: string }; due?: Record<string, string> | null }) {
  const lessons = module.lessons
  const across = useSyncExternalStore(subscribe, () => matchMedia(LANDSCAPE).matches, () => false)
  // Read during render: both callers mount this on the client only, after kv has hydrated.
  const done = lessons.filter(l => lessonDone(learnerId, l.id)).map(l => l.id)
  const nextUp = lessons.find(l => !done.includes(l.id))?.id
  const n = lessons.length

  // Stop i's position. Vertical: left in %, top in px. Horizontal: both in px (the map scrolls sideways if it is wider than the screen).
  const along = (i: number) => STEP / 2 + i * STEP
  const side = (i: number) => (i % 2 ? 1 : -1)
  const pos = (i: number) => across ? { x: along(i) + 30, y: H / 2 + side(i) * (CROSS + 20) } : { x: 50 + side(i) * (CROSS / 2), y: along(i) }
  const W = across ? n * STEP + 60 : 100
  const trail = (i: number) => {
    const a = pos(i), b = pos(i + 1)
    return across
      ? `M ${a.x} ${a.y} C ${a.x + STEP / 2} ${a.y} ${b.x - STEP / 2} ${b.y} ${b.x} ${b.y}`
      : `M ${a.x} ${a.y} C ${a.x} ${a.y + STEP / 2} ${b.x} ${b.y - STEP / 2} ${b.x} ${b.y}`
  }

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 32px', display: 'flex', justifyContent: 'center' }}>
      <style>{`@keyframes lp-bob { 0%,100% { transform: translate(-50%, -50%) } 50% { transform: translate(-50%, calc(-50% - 5px)) } }
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
            <div style={{ position: 'relative', margin: '0 auto', ...(across ? { width: W, height: H } : { height: n * STEP }) }}>
              {/* The trail. Vertical: stretched to the box (non-scaling strokes keep an even width). A segment turns solid teal once its topic is done. */}
              <svg viewBox={`0 0 ${W} ${across ? H : n * STEP}`} preserveAspectRatio="none" aria-hidden
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                {lessons.slice(0, -1).map((l, i) => (
                  <path key={l.id} d={trail(i)} fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke"
                    stroke={done.includes(l.id) ? TEAL : INK} strokeWidth={done.includes(l.id) ? 12 : 5} strokeDasharray={done.includes(l.id) ? undefined : '2 14'} />
                ))}
              </svg>

              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {lessons.map((l, i) => {
                  const isDone = done.includes(l.id), isNext = l.id === nextUp
                  const obj = objOf(l), size = isNext ? 84 : 68, { x, y } = pos(i)
                  const gap = size / 2 + 12
                  // The label sits on the open side of its stop: right/left when vertical, above/below when horizontal.
                  const label: CSSProperties = across
                    ? { left: 0, width: STEP + 16, transform: 'translateX(-50%)', textAlign: 'center', display: 'flex', alignItems: 'center',
                        ...(side(i) < 0 ? { bottom: gap, flexDirection: 'column-reverse' } : { top: gap, flexDirection: 'column' }) }
                    : { top: 0, transform: 'translateY(-50%)', width: 'min(210px, 42vw)', ...(side(i) < 0 ? { left: gap } : { right: gap, textAlign: 'right' }) }
                  return (
                    <li key={l.id} style={{ position: 'absolute', top: y, left: across ? x : `${x}%`, width: 0, height: 0 }}>
                      <Link href={`/lesson?id=${l.id}`} aria-label={`${i + 1}. ${l.title}${isDone ? ', done' : isNext ? ', next up' : ''}`}
                        style={{ ...stop, width: size, height: size, background: isDone ? '#9cf0d8' : isNext ? '#ffd166' : '#fff',
                          ...(isNext ? { animation: 'lp-bob 1.8s ease-in-out infinite' } : {}) }}>
                        {obj
                          ? <span style={{ display: 'flex', gap: 3, '--lp-u': isNext ? '20px' : '16px' } as CSSProperties}><Thing obj={obj} /><Thing obj={obj} /><Thing obj={obj} /></span>
                          : <b style={{ fontSize: 24 }}>{i + 1}</b>}
                        <span style={{ ...badge, background: isDone ? TEAL : isNext ? '#ff6b4a' : '#fff', color: isDone || isNext ? '#fff' : INK }}>{isDone ? '✓' : i + 1}</span>
                      </Link>
                      <Link href={`/lesson?id=${l.id}`} tabIndex={-1} aria-hidden style={{ position: 'absolute', textDecoration: 'none', color: INK, ...label }}>
                        <b style={{ display: 'inline-block', fontFamily: 'var(--font-display)', fontSize: isNext ? 19 : 16, lineHeight: 1.2, background: '#fff', border: `3px solid ${INK}`, borderRadius: 14, padding: '6px 10px', boxShadow: `3px 3px 0 ${INK}` }}>{l.title}</b>
                        {/* Never "late" to a child: the date is information, not a mark against them. */}
                        {!isDone && due?.[l.id] && <span style={{ display: 'block', width: 'fit-content', ...(!across && side(i) > 0 ? { marginLeft: 'auto' } : {}), marginTop: 6,
                          background: '#ffd166', border: `3px solid ${INK}`, borderRadius: 999, padding: '2px 10px', fontWeight: 800, fontSize: 14 }}>Due {showDay(due[l.id])}</span>}
                        {isNext && <span style={{ display: 'block', width: 'fit-content', ...(!across && side(i) > 0 ? { marginLeft: 'auto' } : {}), marginTop: 8, marginBottom: across ? 8 : 0,
                          background: TEAL, color: '#fff', border: `3px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, borderRadius: 12, padding: '6px 14px', fontWeight: 800, fontSize: 15 }}>Next up ▶</span>}
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

const stop: CSSProperties = { position: 'absolute', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '50%', border: `4px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}`, textDecoration: 'none', color: INK }
const badge: CSSProperties = { position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontWeight: 900, fontSize: 14, border: `3px solid ${INK}` }
