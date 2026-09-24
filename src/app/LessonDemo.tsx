'use client'
/**
 * The landing page's demo: two REAL lesson chalkboards, played beat by beat with the teacher's lines as captions.
 *
 * ⚠️ Not a copy of a lesson — the page passes in a real screen's `chalk` and `beats` (see `page.tsx`), and this
 * draws them with the app's own `Chalkboard`. Reword or redraw that screen and the demo changes with it.
 * No sound here on purpose: a front page that talks on load is worse than a silent one.
 */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Chalkboard } from '@/features/lessons/Chalkboard'
import { beatMs, type ChalkMark } from '@/features/lessons/chalk'
import s from './landing.module.css'

export interface Demo { id: string; tag: string; title: string; label: string; marks: ChalkMark[]; says: string[] }

const HOLD = 3200   // the finished board stays up this long before the next demo
const CALM = '(prefers-reduced-motion: reduce)'
const onCalm = (cb: () => void) => { const m = window.matchMedia?.(CALM); m?.addEventListener('change', cb); return () => m?.removeEventListener('change', cb) }

export default function LessonDemo({ demos }: { demos: Demo[] }) {
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(1)
  const [run, setRun] = useState(0)          // bumps to replay from the first line
  const [live, setLive] = useState(() => typeof IntersectionObserver === 'undefined')   // on screen
  const still = useSyncExternalStore(onCalm, () => !!window.matchMedia?.(CALM).matches, () => false)
  const box = useRef<HTMLDivElement>(null)
  const d = demos[i]

  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const all = still ? d.says.length : shown
  useEffect(() => {
    if (!live || still) return
    const done = shown >= d.says.length
    const t = setTimeout(() => {
      if (!done) setShown(n => n + 1)
      else { setI(k => (k + 1) % demos.length); setShown(1); setRun(r => r + 1) }
    }, beatMs(d.says[shown - 1]) + (done ? HOLD : 500))
    return () => clearTimeout(t)
  }, [live, still, shown, d, demos.length])

  const pick = (k: number) => { setI(k); setShown(1); setRun(r => r + 1) }

  return (
    <div ref={box} className={s.demo}>
      <div className={s.tabs} role="tablist" aria-label="Sample lessons">
        {demos.map((x, k) => (
          <button key={x.id} role="tab" aria-selected={k === i} className={s.tab} onClick={() => pick(k)}>
            {x.tag}
          </button>
        ))}
      </div>
      <p className={s.demoTitle}>{d.title}</p>
      <Chalkboard key={`${d.id}-${run}`} marks={d.marks} says={d.says} shown={all} label={d.label} still={still} />
      <ol className={s.captions} aria-label="What the teacher says">
        {d.says.map((line, k) => (
          <li key={k} className={k < all - 1 ? s.said : k === all - 1 ? s.saying : s.later}>{line}</li>
        ))}
      </ol>
      {!still && (
        <button className={s.replay} onClick={() => pick(i)}>↻ Watch again</button>
      )}
    </div>
  )
}
