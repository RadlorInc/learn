'use client'
/**
 * /test#t=<token> — a paid tester reviews one Grade 3–8 module or one KG–2 story chapter (docs/runbooks/testers.md).
 * The token in the hash (never sent to a server log) is the only authorisation: `tester_open` answers with the module,
 * `tester_review` saves one screen.
 *
 * The tester plays the real thing, with its real voice, screens and questions, in review mode:
 *   - a lesson: LessonPlayer's ReviewGate — nothing moves on by itself, and Next opens only after the screen has
 *     played out and the tester has said "Looks right" or written what is wrong;
 *   - a chapter: ChapterReviewContext — the chapter waits after its intro, every answer, every re-teach and every
 *     spoken walk line until the tester has reviewed it; a see-through cover stops taps meanwhile.
 * No learner, and the chapter records nothing even on a device with a child chosen, so nothing here touches a
 * child's data.
 */
import { useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { db } from '@/data/repositories/_shared'
import { CATALOGUE, STORY_CATALOGUE, storyOf, useModule } from '@/features/lessons/catalogue'
import { LessonPlayer } from '@/features/lessons/LessonPlayer'
import { pill, INK, TEAL, ON_TEAL, PAGE_BG, BAD } from '@/features/lessons/Pictures'
import { CHAPTER_COMPONENTS } from '@/features/chapters/registry'
import { VOICE_INDEX as CHAPTER_VOICE_INDEX } from '@/features/chapters/voice-index'
import { ChapterReviewContext } from '@/shared/chapterReview'
import { setSceneVoice } from '@/infra/voiceClipPlayer'
import { JOSH } from '@/infra/storage/voicePref'

type Open = { module_id: string; reviewed: string[] }
type Ask = { key: string; answer: string; n: number; resolve: () => void }
const noSubscribe = () => () => {}

export default function TesterPage() {
  // The hash exists only in the browser.
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  const token = mounted ? new URLSearchParams(window.location.hash.slice(1)).get('t') : null
  const [open, setOpen] = useState<Open | 'bad' | null>(null)
  const [topic, setTopic] = useState<string | null>(null)
  const [ask, setAsk] = useState<Ask | null>(null)

  useEffect(() => {
    if (!token) return
    let live = true
    void db().rpc('tester_open', { p_token: token })
      .then(({ data, error }: { data: Open | null; error: unknown }) => { if (live) setOpen(error || !data ? 'bad' : data) })
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

  if (!mounted) return null
  if (!token || open === 'bad') return <Note>This tester link is not active. Ask Radlic for a new one.</Note>
  if (!open || !token || (!chapter && !whole)) return <Note>Loading…</Note>

  const reviewed = new Set(open.reviewed)
  const mark = (k: string) => setOpen({ ...open, reviewed: [...open.reviewed.filter(x => x !== k), k] })

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
      {/* room under the page for the review bar, so Next is never hidden behind it */}
      <style>{'.lp-page { padding-bottom: 190px !important }'}</style>
      <LessonPlayer key={lesson.id} lesson={lesson} earlier={whole.lessons.slice(0, whole.lessons.indexOf(lesson)).map(l => l.id)}
        onFinish={() => {}} onExit={() => setTopic(null)}
        review={{
          done: k => reviewed.has(`${lesson.id}/${k}`),
          bar: (k, played, answer) => <ReviewBar key={`${lesson.id}/${k}`} token={token} lessonId={lesson.id} screen={k}
            played={played} answer={answer} saved={reviewed.has(`${lesson.id}/${k}`)} onSaved={() => mark(`${lesson.id}/${k}`)} />,
        }} />
    </>
  }

  const meta = chapter ? STORY_CATALOGUE.find(m => m.story === chapter) : CATALOGUE.find(m => m.id === whole?.id)
  const grade = meta ? (meta.grade === 0 ? 'KG' : `Grade ${meta.grade}`) : ''
  const topics = meta?.lessons ?? whole?.lessons ?? []
  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: 16, color: INK }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h1 style={{ margin: 0, fontSize: 26 }}>{grade} · {chapter ? 'Chapter' : `Module ${meta?.n}`}: {meta?.title}</h1>
        <div style={{ ...card, fontSize: 16, lineHeight: 1.5 }}>
          <b>How to test</b>
          {chapter
            ? <ol style={{ margin: '6px 0 0', paddingLeft: 22 }}>
                <li>Open the chapter. Turn your sound on. Play it like a young child would.</li>
                <li>After the intro, after every question and after every explanation, the chapter stops and asks if it was right.</li>
                <li>If not, write what is wrong (the voice, the picture, the question, the answer, a tap that did not work…).</li>
                <li>Only then does it go on. Play to the end; the last card asks about the chapter as a whole.</li>
              </ol>
            : <ol style={{ margin: '6px 0 0', paddingLeft: 22 }}>
                <li>Open a topic. Turn your sound on.</li>
                <li>Let each screen play to the end, and answer every question yourself.</li>
                <li>Then say if the screen is right. If not, write what is wrong (wrong number, spelling, the voice, the picture…).</li>
                <li>Only then does Next open. Go through every screen to the end of the topic.</li>
              </ol>}
        </div>
        {topics.map(l => {
          const n = open.reviewed.filter(x => x.startsWith(`${l.id}/`)).length, finished = reviewed.has(`${l.id}/9`)
          return (
            <button key={l.id} type="button" onClick={() => setTopic(l.id)}
              style={{ ...pill, justifyContent: 'space-between', display: 'flex', fontSize: 18, padding: '14px 16px', whiteSpace: 'normal', textAlign: 'left',
                background: finished ? TEAL : '#fff', color: finished ? ON_TEAL : INK }}>
              <span>{l.title}</span><span style={{ fontSize: 14 }}>{finished ? '✓ done' : n ? `${n} screens reviewed` : 'not started'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const TAGS = ['Voice / audio', 'Text / spelling', 'Picture / board', 'Answer is wrong', 'Too fast / slow', 'Confusing', 'Broken / bug']

function ReviewBar({ token, lessonId, screen, played, answer, saved, onSaved }: {
  token: string; lessonId: string; screen: string; played: boolean; answer: string; saved: boolean; onSaved: () => void
}) {
  const [openedAt] = useState(() => Date.now())
  const [mode, setMode] = useState<'ask' | 'issue' | 'sending'>('ask')
  const [tags, setTags] = useState<string[]>([])
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [editing, setEditing] = useState(false)
  const question = /^(8|p|q)/.test(screen)

  const send = async (verdict: 'ok' | 'issue') => {
    setMode('sending'); setErr('')
    const note = verdict === 'issue' ? `${tags.length ? `[${tags.join(', ')}] ` : ''}${text.trim()}` : null
    const { error } = await db().rpc('tester_review', {
      p_token: token, p_lesson: lessonId, p_screen: screen, p_verdict: verdict, p_note: note,
      p_answer: question ? answer : null, p_open_ms: Date.now() - openedAt, p_played: played,
    })
    if (error) { setErr('That did not save. Check your connection and try again.'); setMode(verdict === 'issue' ? 'issue' : 'ask'); return }
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
    <div role="region" aria-label="Review this screen" style={bar}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: 13, opacity: 0.8 }}>Tester review · {lessonId} · screen {screen}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>{body}</div>
      {err && <p role="alert" style={{ margin: 0, color: BAD, fontWeight: 700 }}>{err}</p>}
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100dvh', background: PAGE_BG, display: 'grid', placeItems: 'center', padding: 16, color: INK, fontSize: 20 }}>{children}</div>
}

const card: CSSProperties = { background: '#fff', border: `4px solid ${INK}`, borderRadius: 18, padding: 14 }
const small: CSSProperties = { ...pill, fontSize: 15, padding: '8px 12px' }
const bar: CSSProperties = {
  position: 'fixed', left: '50%', bottom: 10, transform: 'translateX(-50%)', zIndex: 1001, width: 'min(760px, calc(100vw - 20px))',
  boxSizing: 'border-box', background: '#fffbe8', border: `4px solid ${INK}`, borderRadius: 18, boxShadow: `4px 4px 0 ${INK}`,
  padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, color: INK, fontSize: 17,
}
