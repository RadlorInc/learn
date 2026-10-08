'use client'
/**
 * /test#t=<token> — a paid tester reviews one Grade 3–8 module or one KG–2 story chapter (docs/runbooks/testers.md).
 * The token in the hash (never in a URL a server logs) is the only authorisation. The links and reviews live in the
 * Radlor Ops database: `/api/tester` forwards each call there — 'open' answers with the module, 'review' saves one screen.
 *
 * The tester plays the real thing, with its real voice, screens and questions, in review mode:
 *   - a lesson: LessonPlayer's ReviewGate — nothing moves on by itself, and Next opens only after the screen has
 *     played out and the tester has said "Looks right" or written what is wrong;
 *   - a chapter: ChapterReviewContext — the chapter waits after its intro, every answer, every re-teach and every
 *     spoken walk line until the tester has reviewed it; a see-through cover stops taps meanwhile.
 * No learner, and the chapter records nothing even on a device with a child chosen, so nothing here touches a
 * child's data.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { CATALOGUE, STORY_CATALOGUE, storyOf, useModule, ladderOf } from '@/features/lessons/catalogue'
import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { pill, INK, TEAL, ON_TEAL, PAGE_BG, BAD } from '@/features/lessons/Pictures'
import { CHAPTER_COMPONENTS } from '@/features/chapters/registry'
import { VOICE_INDEX as CHAPTER_VOICE_INDEX } from '@/features/chapters/voice-index'
import { ChapterReviewContext } from '@/shared/chapterReview'
import { setSceneVoice } from '@/infra/voiceClipPlayer'
import { JOSH } from '@/infra/storage/voicePref'
import { TesterGuide } from './TesterGuide'
import { TourRunner } from '@/features/dashboard/Helpers'
import { TESTER_TOURS, tourFor, firstTime, type TourName } from './testerTours'

/** `levels`: the practice level of each practice review (`'g4m4-t1/p3': 2`), read back from Radlor Ops. */
type Open = { module_id: string; reviewed: string[]; levels?: Record<string, number> }
/** Questions a tester reviews at every practice level before the topic's practice can be finished (founder, 4 Oct). */
const PER_LEVEL = 2
/** The highest practice number this topic has a review for (p7 → 7), so a new sitting numbers on from it. */
const lastPractice = (reviewed: readonly string[], id: string) =>
  Math.max(0, ...reviewed.filter(k => k.startsWith(`${id}/p`)).map(k => Number(k.slice(id.length + 2)) || 0))
/** Reviewed practice questions per level (index 0 = L1) for one topic. */
function levelCounts(open: Open, id: string, levels: number): number[] {
  const c = Array.from({ length: levels }, () => 0)
  for (const [k, lv] of Object.entries(open.levels ?? {})) if (k.startsWith(`${id}/p`) && lv >= 1 && lv <= levels) c[lv - 1]++
  return c
}
/** One call to Radlor Ops, through this app's own /api/tester. */
const ops = (body: object) => fetch('/api/tester', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
type Ask = { key: string; answer: string; n: number; resolve: () => void }
const noSubscribe = () => () => {}

export default function TesterPage() {
  // The hash exists only in the browser.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  const token = mounted ? new URLSearchParams(window.location.hash.slice(1)).get('t') : null
  const [open, setOpen] = useState<Open | 'bad' | null>(null)
  const [topic, setTopic] = useState<string | null>(null)
  // Fixed when a topic opens: this sitting's practice keys start after the ones already saved.
  const [practiceStart, setPracticeStart] = useState(0)
  const [ask, setAsk] = useState<Ask | null>(null)
  // The walkthrough on show (testerTours.ts): spotlights on the real controls, above the review bar.
  const [tour, setTour] = useState<TourName | null>(null)

  useEffect(() => {
    if (!token) return
    let live = true
    void ops({ action: 'open', token })
      .then(async r => (r.ok ? ((await r.json()) as Open) : null), () => null)
      .then(data => { if (live) setOpen(data ?? 'bad') })
    return () => { live = false }
  }, [token])

  const moduleId = open && open !== 'bad' ? open.module_id : undefined
  const chapter = storyOf(moduleId ?? null)
  const whole = useModule(chapter ? undefined : moduleId)
  // The chapter waits on this; one function for the whole sitting, so SkillBeat's callbacks keep their identity.
  const review = useCallback((key: string, answer: string) =>
    new Promise<void>(resolve => setAsk(a => ({ key, answer, n: (a?.n ?? 0) + 1, resolve }))), [])
  // A KG–2 chapter speaks in Josh from its own clip index, exactly as /game sets it (a layout effect: see /game).
  const playing = chapter && topic ? chapter : null
  useLayoutEffect(() => {
    if (!playing) return
    setSceneVoice(JOSH, CHAPTER_VOICE_INDEX[playing])
    return () => setSceneVoice(null)
  }, [playing])
  const runner = <div className="tester-tour"><TourRunner tour={tour ? TESTER_TOURS[tour] : null} onEnd={() => setTour(null)} /></div>
  const onTour = (n: TourName) => setTour(n)

  if (!mounted) return null
  if (!token || open === 'bad') return <Note>This tester link is not active. Ask Radlic for a new one.</Note>
  if (!open || !token || (!chapter && !whole)) return <Note>Loading…</Note>

  const reviewed = new Set(open.reviewed)
  const mark = (k: string, level?: number) => setOpen({
    ...open, reviewed: [...open.reviewed.filter(x => x !== k), k],
    levels: level ? { ...open.levels, [k]: level } : open.levels,
  })
  // Done = the last screen reviewed AND every practice level reviewed PER_LEVEL times (a chapter: its last card).
  const practiceDone = (id: string) => levelCounts(open, id, ladderOf(id)?.length ?? 0).every(c => c >= PER_LEVEL)
  const isDone = (id: string) => reviewed.has(`${id}/9`) && (chapter ? true : practiceDone(id))
  const openTopic = (id: string) => { setPracticeStart(lastPractice(open.reviewed, id)); setTopic(id) }

  if (playing) {
    const Chapter = CHAPTER_COMPONENTS[playing]
    const id = open.module_id
    const leave = () => { setAsk(null); setTopic(null) }
    return (
      <ChapterReviewContext.Provider value={review}>
        <Chapter childName="" onExit={leave} onComplete={() => setAsk(a => ({ key: '9', answer: '', n: (a?.n ?? 0) + 1, resolve: () => {} }))} />
        {ask && <>
          {/* see-through cover over the chapter (z 900): nothing is tapped while a review is open */}
          <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <ReviewBar key={ask.n} token={token} lessonId={id} screen={ask.key} played answer={ask.answer} saved={false}
            onSaved={() => { mark(`${id}/${ask.key}`); setAsk(null); ask.resolve() }} />
        </>}
      </ChapterReviewContext.Provider>
    )
  }

  const lesson = whole?.lessons.find(l => l.id === topic)
  if (whole && lesson) {
    return <>
      {/* The lesson lives ABOVE the review bar, never under it: the bar measures itself into --tester-bar, the lesson's
          page (`.lp-page` in Frame, `.pr-page` in PracticeLayout) is exactly the height left above it and scrolls
          inside itself when a screen is taller, and its card shrinks to fit. `body` outranks the layouts' own
          short-screen `!important` rules, which come later in the page. */}
      <style>{TESTER_FIT}</style>
      <LessonPlayer key={lesson.id} lesson={lesson} earlier={whole.lessons.slice(0, whole.lessons.indexOf(lesson)).map(l => l.id)}
        onFinish={() => {}} onExit={() => setTopic(null)}
        review={{
          done: k => reviewed.has(`${lesson.id}/${k}`),
          practice: { start: practiceStart, counts: levelCounts(open, lesson.id, ladderOf(lesson.id)?.length ?? 0), need: PER_LEVEL },
          bar: (k, played, answer) => <ReviewBar key={`${lesson.id}/${k}`} token={token} lessonId={lesson.id} screen={k}
            played={played} answer={answer} saved={reviewed.has(`${lesson.id}/${k}`)} onTour={onTour}
            // Bring Next into view above the bar: on a short screen it sits under it until the page is scrolled down.
            onSaved={() => {
              mark(`${lesson.id}/${k}`, Number(/^L(\d+) ·/.exec(answer)?.[1]) || undefined)
              // Next sits at the end of the lesson's own scroll area: bring it into view.
              setTimeout(() => document.querySelector('.lp-page, .pr-page')?.scrollTo({ top: 1e6, behavior: 'smooth' }), 50)
            }} />,
        }} />
      {runner}
    </>
  }

  const meta = chapter ? STORY_CATALOGUE.find(m => m.story === chapter) : CATALOGUE.find(m => m.id === whole?.id)
  const grade = meta ? (meta.grade === 0 ? 'KG' : `Grade ${meta.grade}`) : ''
  const topics = meta?.lessons ?? whole?.lessons ?? []
  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: 16, color: INK }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 26 }}>{grade} · {chapter ? 'Chapter' : `Module ${meta?.n}`}: {meta?.title}</h1>
        {chapter ? <TesterGuide /> : <HowTo onShow={() => setTour('list')} />}
        {topics.map((l, i) => {
          const n = open.reviewed.filter(x => x.startsWith(`${l.id}/`)).length, finished = isDone(l.id)
          const lv = chapter ? [] : levelCounts(open, l.id, ladderOf(l.id)?.length ?? 0)
          const practice = lv.length ? ` · practice ${lv.reduce((a, c) => a + Math.min(c, PER_LEVEL), 0)}/${lv.length * PER_LEVEL}` : ''
          return (
            <button key={l.id} type="button" data-tour={i === 0 ? 'tester-topic' : undefined} onClick={() => openTopic(l.id)}
              style={{ ...pill, justifyContent: 'space-between', display: 'flex', fontSize: 18, padding: '14px 16px', whiteSpace: 'normal', textAlign: 'left',
                background: finished ? TEAL : '#fff', color: finished ? ON_TEAL : INK }}>
              <span>{l.title}</span><span style={{ fontSize: 14 }}>{finished ? '✓ done' : n ? `${n} screens reviewed${practice}` : 'not started'}</span>
            </button>
          )
        })}
      </div>
      {runner}
    </div>
  )
}

/** A Grade 3–8 module's "how to test": the few rules, and the walkthrough on the real screens (testerTours.ts). */
function HowTo({ onShow }: { onShow: () => void }) {
  // The topic list's walkthrough runs by itself the first time a module's list is on screen.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  useEffect(() => { if (firstTime('list')) onShow() }, [])
  return (
    <div style={{ background: '#fff', border: `4px solid ${INK}`, borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 16, lineHeight: 1.5 }}>
      <b style={{ fontSize: 20 }}>How to test</b>
      <p style={{ margin: 0 }}>You check that every screen is <b>correct</b>: the maths, the words, the voice and the pictures. A specific note
        is worth more than many 👍.</p>
      <p data-tour="tester-help" style={{ margin: 0 }}>🔊 <b>Sound on</b>: every screen is read aloud.</p>
      <p style={{ margin: 0 }}>Open a topic and a short walkthrough shows each step on the real screen. See it again any time with
        <b> How this works</b> in the yellow bar.</p>
      <button type="button" onClick={onShow} style={{ ...pill, alignSelf: 'flex-start', background: TEAL, color: ON_TEAL }}>▶ Show me how</button>
    </div>
  )
}

const TESTER_FIT = `
body .lp-page, body .pr-page { box-sizing: border-box; height: calc(100dvh - var(--tester-bar, 150px)); min-height: 0 !important;
  overflow-y: auto; padding-bottom: 14px !important }
body .lp-wrap, body .pr-wrap { flex-shrink: 0; min-height: clamp(320px, calc(100dvh - 40px - var(--tester-bar, 150px)), 900px) !important }
body .lp-row:not(.lp-stack) .lp-pic { min-height: 0 !important }
`

const TAGS = ['Voice / audio', 'Text / spelling', 'Picture / board', 'Answer is wrong', 'Too fast / slow', 'Confusing', 'Broken / bug']

function ReviewBar({ token, lessonId, screen, played, answer, saved, onSaved, onTour }: {
  token: string; lessonId: string; screen: string; played: boolean; answer: string; saved: boolean; onSaved: () => void
  /** A lesson's bar starts the walkthrough for its kind of screen, the first time; a chapter's has none. */
  onTour?: (n: TourName) => void
}) {
  const kind = onTour ? tourFor(screen) : null
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when this screen's bar first appears
  useEffect(() => { if (kind && firstTime(kind)) onTour?.(kind) }, [])
  const [openedAt] = useState(() => Date.now())
  // The bar's own height (it grows when the issue form opens) → --tester-bar, which the lesson's layout gives way to.
  const boxRef = useRef<HTMLDivElement>(null)
  const fit = () => { const el = boxRef.current; if (el) document.documentElement.style.setProperty('--tester-bar', `${Math.ceil(el.getBoundingClientRect().height) + 20}px`) }
  // After every render (its content changes with the state) and on any resize (the note box growing, a rotation).
  useLayoutEffect(fit)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => { ro.disconnect(); document.documentElement.style.removeProperty('--tester-bar') }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fit reads only the ref
  }, [])
  const [mode, setMode] = useState<'ask' | 'issue' | 'sending'>('ask')
  const [tags, setTags] = useState<string[]>([])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(false)
  const question = /^(8|p|q)/.test(screen)

  const send = async (verdict: 'ok' | 'issue') => {
    setMode('sending'); setErr('')
    const note = verdict === 'issue' ? `${tags.length ? `[${tags.join(', ')}] ` : ''}${text.trim()}` : null
    const ok = await ops({
      action: 'review', token, lesson: lessonId, screen, verdict, note,
      answer: question ? answer : null, open_ms: Date.now() - openedAt, played,
    }).then(r => r.ok, () => false)
    if (!ok) { setErr('That did not save. Check your connection and try again.'); setMode(verdict === 'issue' ? 'issue' : 'ask'); return }
    setEditing(false); setMode('ask'); onSaved()
  }

  let body
  if (saved && !editing) {
    body = <><b>✓ Saved. Tap Next.</b><button type="button" style={small} onClick={() => setEditing(true)}>Change my review</button></>
  } else if (!played) {
    body = <b>{question ? 'Answer the question first, then review this screen.' : 'Let the screen play to the end, then review it.'}</b>
  } else if (mode === 'issue' || (mode === 'sending' && text)) {
    body = <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <b>What is wrong on this screen?</b>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {TAGS.map(t => { const on = tags.includes(t); return (
          <button key={t} type="button" aria-pressed={on} onClick={() => setTags(x => (on ? x.filter(y => y !== t) : [...x, t]))}
            style={{ ...small, background: on ? TEAL : '#fff', color: on ? ON_TEAL : INK }}>{t}</button>) })}
      </div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={1800} autoFocus
        placeholder="Write what is wrong and what it should be (at least 5 letters)"
        style={{ width: '100%', fontSize: 16, padding: 8, borderRadius: 10, border: `3px solid ${INK}`, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" style={small} onClick={() => setMode('ask')}>Cancel</button>
        <button type="button" style={{ ...small, background: TEAL, color: ON_TEAL }} disabled={text.trim().length < 5 || mode === 'sending'}
          onClick={() => send('issue')}>{mode === 'sending' ? 'Saving…' : 'Send'}</button>
      </div>
    </div>
  } else {
    body = <>
      <b>Is this screen right?</b>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={{ ...small, background: TEAL, color: ON_TEAL }} disabled={mode === 'sending'} onClick={() => send('ok')}>👍 Looks right</button>
        <button type="button" style={small} disabled={mode === 'sending'} onClick={() => setMode('issue')}>⚠️ Something is wrong</button>
      </div>
    </>
  }

  return (
    <div ref={boxRef} role="region" aria-label="Review this screen" data-tour="tester-bar" style={bar}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: 13, opacity: 0.8 }}>Tester review · {lessonId} · screen {screen}</span>
        {kind && <button type="button" onClick={() => onTour?.(kind)} style={{ background: 'none', border: 0, padding: '4px 0', minHeight: 32, fontSize: 14, fontWeight: 800, color: INK, textDecoration: 'underline', cursor: 'pointer' }}>How this works</button>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>{body}</div>
      {err && <p role="alert" style={{ margin: 0, color: BAD, fontWeight: 700 }}>{err}</p>}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100dvh', background: PAGE_BG, display: 'grid', placeItems: 'center', padding: 16, color: INK, fontSize: 20 }}>{children}</div>
}

const small: CSSProperties = { ...pill, fontSize: 15, padding: '8px 12px' }
const bar: CSSProperties = {
  position: 'fixed', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 1001, width: 'min(760px, calc(100vw - 20px))',
  boxSizing: 'border-box', background: '#fffbe8', border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `4px 4px 0 ${INK}`,
  padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, color: INK, fontSize: 17,
}
