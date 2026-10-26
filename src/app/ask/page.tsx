'use client'
/**
 * /ask — Ask maths (docs/product/ask-maths.md): a child in grades 3–8 types a maths question and watches a whiteboard
 * lesson drawn and spoken for it. Everything that decides whether they may ask (the parent's switch, the add-on, the
 * day's limit, grade band) is decided by the database through /api/ask-maths; this page shows the answer as it comes.
 * Shown only with NEXT_PUBLIC_ASK_MATHS=on (and the server's ASK_MATHS=on); no price or plan ever appears here.
 */
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { getActiveLearner } from '@/data/supabase/useLearnerSession'
import { askMaths, getAskQuestions, type AskQuestion, type AskRefusal } from '@/data/repositories/askMaths'
import { ASK_MATHS_PUBLIC, MAX_QUESTION } from '@/features/askMaths/stream'
import { AskPlayer, type Post } from '@/features/askMaths/AskPlayer'
import { MathPreview, MathTray } from '@/features/askMaths/MathTray'
import { unlockSound, useVoiceStatus } from '@/features/askMaths/voice'
import { INK, PAGE_BG, pill, shell, topBar } from '@/features/lessons/Pictures'
import { bubble, primary } from '@/features/lessons/Frame'

const link = { ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' } as const
const SAID: Record<AskRefusal | 'broke', string> = {
  off: 'Ask maths is switched off right now. Ask your grown-up.',
  not_entitled: 'Ask maths is not turned on for your family yet. Ask your grown-up.',
  band: 'Ask maths is for grades 3 to 8.',
  busy: 'One question at a time. Let this lesson finish first.',
  limit: "That's all the questions for today. Come back tomorrow!",
  not_maths: 'I can only help with maths. Try a maths question!',
  personal: "Please don't type names, schools, addresses or phone numbers. Ask again without them.",
  unsafe: "I can't help with that one. If something is worrying you, talk to a grown-up you trust.",
  unavailable: "Ask maths isn't working right now. Try again soon.",
  unauthenticated: 'Ask your grown-up to open your lessons first.',
  forbidden: 'Ask your grown-up to open your lessons first.',
  broke: "This lesson didn't come out right. Try asking again.",
}
const IDEAS: Record<string, string[]> = {
  '9-11': ['How do I add 347 and 285?', 'Why is 3/4 bigger than 2/3?', 'What does 6 × 7 mean?', 'How do I read a clock to the minute?'],
  '12-14': ['What is a ratio?', 'How do I solve 2x + 3 = 11?', 'How do I find 15 percent of 80?', 'What is the slope of a line?'],
}
const STAGE: Record<string, string> = { reading: 'Reading your question…', drawings: 'Picking the pictures…', writing: 'Drawing your lesson…', fixing: 'Fixing a step…' }

const noSubscribe = () => () => {}

export default function AskPage() {
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false)
  const learner = mounted ? getActiveLearner() : undefined
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [stage, setStage] = useState<string | null>(null)
  const [shown, setShown] = useState(false)               // a board is on screen (the lesson has started)
  const [left, setLeft] = useState<number | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const post = useRef<Post | null>(null)
  const bind = useCallback((p: Post) => { post.current = p }, [])
  const voice = useVoiceStatus()
  // No asking until the made voice is here (founder, 26 Oct): a lesson started earlier stops at every step to wait for it.
  // A failed or impossible voice does not block: the device's own voice speaks.
  const voiceLoading = voice.state === 'loading'
  // The child's own answered lessons of the last 30 days (the table keeps no more), to watch again.
  const [past, setPast] = useState<AskQuestion[]>([])
  const [watch, setWatch] = useState<AskQuestion | null>(null)
  const learnerId = learner?.id
  const loadPast = useCallback(() => {
    if (learnerId) void getAskQuestions(learnerId).then(qs => setPast((qs ?? []).filter(x => x.outcome === 'answered' && x.script)))
  }, [learnerId])
  useEffect(loadPast, [loadPast])

  async function ask(question: string) {
    if (!learner || busy || voiceLoading || !question.trim()) return
    unlockSound()                                       // inside the tap: an iPhone then lets this page play sound
    setBusy(true); setNote(null); setStage(STAGE.reading); setShown(false); setWatch(null)
    post.current?.({ type: 'reset' })
    let ended = false
    const r = await askMaths(learner.id, question.trim(), ({ event, data }) => {
      if (event === 'stage') setStage(STAGE[String(data.stage)] ?? null)
      if (event === 'els' || event === 'els_add') { setShown(true); post.current?.({ type: event, els: data.els, drawings: data.drawings }) }
      if (event === 'step') post.current?.({ type: 'step', step: data.step })
      if (event === 'done') { ended = true; post.current?.({ type: 'done' }); setStage(null) }
      if (event === 'failed') { ended = true; setStage(null); setNote(SAID.broke) }
    })
    if (!r.ok) { setNote(SAID[r.error]); setStage(null) }
    else { setLeft(r.left); if (!ended) { setStage(null); setNote(SAID.broke) } }
    setBusy(false)
    loadPast()
  }

  let body
  if (learner === undefined) body = null
  else if (!ASK_MATHS_PUBLIC) body = <p style={bubble}>Ask maths is coming soon!</p>
  else if (!learner) body = <p style={bubble}>{SAID.unauthenticated}</p>
  else body = <>
    <form onSubmit={(e) => { e.preventDefault(); void ask(q) }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label htmlFor="ask-q" style={{ fontSize: 'clamp(20px, 3.4vw, 26px)', fontWeight: 900, color: INK }}>What maths question do you have?</label>
      <textarea id="ask-q" ref={area} value={q} maxLength={MAX_QUESTION} rows={2} onChange={(e) => setQ(e.target.value)} disabled={busy}
        placeholder="A word problem, or a sum like 2x + 3 = 11" autoComplete="off" spellCheck
        style={{ ...bubble, fontSize: 22, fontFamily: 'inherit', resize: 'vertical', minHeight: 80 }}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void ask(q) } }} />
      <MathTray area={area} value={q} onChange={setQ} disabled={busy} />
      <MathPreview text={q} />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="submit" style={primary} disabled={busy || voiceLoading || !q.trim()}>{busy ? 'Drawing…' : voiceLoading ? 'Getting ready…' : 'Ask'}</button>
        <span style={{ fontSize: 16, color: INK }}>Only maths, and never your name, school or address.</span>
      </div>
    </form>
    {voiceLoading && <p style={bubble} role="status">Getting the voice ready the first time{voice.total ? ` (${Math.round(voice.loaded / 1e6)} of ${Math.round(voice.total / 1e6)} MB)` : ''}. You can type your question now.</p>}
    {!shown && !busy && !voiceLoading && (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} aria-label="Ideas to ask">
        {(IDEAS[learner.age_group] ?? IDEAS['9-11']).map((idea) => (
          <button key={idea} type="button" style={{ ...pill, cursor: 'pointer' }} onClick={() => { setQ(idea); void ask(idea) }}>{idea}</button>
        ))}
      </div>
    )}
    {stage && <p style={bubble} role="status">{stage}{voice.state === 'loading' && voice.total ? ` Getting the voice ready the first time (${Math.round(voice.loaded / 1e6)} of ${Math.round(voice.total / 1e6)} MB).` : ''}</p>}
    {note && <p style={bubble} role="status">{note}</p>}
    <div style={{ display: shown ? 'block' : 'none' }}><AskPlayer bind={bind} /></div>
    {left !== null && left <= 2 && <p style={{ margin: 0, fontSize: 16, color: INK }}>{left === 0 ? 'That was the last question for today.' : `${left} more question${left === 1 ? '' : 's'} today.`}</p>}
    {past.length > 0 && (
      <section aria-label="Your questions" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: INK }}>Your questions</h2>
        {past.map(p => (
          <button key={p.id} type="button" disabled={busy} aria-pressed={watch?.id === p.id}
            style={{ ...pill, cursor: 'pointer', textAlign: 'left', justifyContent: 'flex-start' }}
            onClick={() => { setShown(false); post.current?.({ type: 'reset' }); setWatch(watch?.id === p.id ? null : p) }}>{watch?.id === p.id ? '✕ ' : '▶ '}{p.question}</button>
        ))}
        {watch && <AskPlayer key={watch.id} script={watch.script as { els: unknown; steps: { say: string }[] }} />}
      </section>
    )}
    <p style={{ margin: 0, fontSize: 13, color: INK, opacity: 0.8 }}>Voice: Pocket TTS by Kyutai, speaker Alba MacKenna (CC BY 4.0), made on this device.</p>
  </>

  return (
    <div style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 26px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...shell, maxWidth: 1000, alignSelf: 'flex-start' }}>
        <div style={topBar}>
          <Link href="/modules" style={link}>← Lessons</Link>
          <span style={{ fontSize: 'clamp(16px, 3.6vw, 20px)' }}>Ask maths</span>
          <span />
        </div>
        <main style={{ padding: 'clamp(14px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 16 }}>{body}</main>
      </div>
    </div>
  )
}
