'use client'
/**
 * /demo — try two chapters before making an account.
 *
 * ⚠️ THE POINT IS TO REACH A CHAPTER, NOT TO EXPLAIN ONE. Cold traffic already has two doors that
 * ask for something first: `/auth` wants an account and `/diagnostic` wants ten minutes and an
 * email. This one asks for an age and nothing else — no email, no name, no account — because the
 * thing most likely to convert a parent is watching their child enjoy a chapter, and every field
 * between them and that is a place to leave.
 *
 * ⚠️ THE WALL COMES AFTER THE VALUE, NOT BEFORE IT. Two chapters, then an account — and the reason
 * given is what an account BUYS (progress that follows them, a plan), never that the demo is spent.
 *
 * ⚠️ LOCAL ONLY. Nothing here reaches the server: there is no account to write to. A demo player who
 * signs up therefore starts with nothing until the local→server adopt exists — see `demoRun.ts`.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GuardedChapter } from '@/features/chapters/GuardedChapter'
import { CHAPTER_NAMES, type AgeGroup } from '@/core/chapters'
import { PT, ACCENTS, LabBackdrop, PtMilo, type Accent } from '@/features/chapters/story/preteen/kit'
import { kv } from '@/infra/storage/kv'
import { track } from '@/infra/analytics'
import {
  readDemo, startDemo, completeDemoChapter, nextDemoChapter, demoUsedUp, demoChapters,
  DEMO_LIMIT, type DemoRun,
} from '@/infra/storage/demoRun'

const BAND_PICK: { band: AgeGroup; age: string; grade: string }[] = [
  { band: '3-5', age: 'Ages 3–5', grade: 'Pre-K – K' },
  { band: '6-8', age: 'Ages 6–8', grade: 'Grade 1–2' },
  { band: '9-11', age: 'Ages 9–11', grade: 'Grade 3–5' },
  { band: '12-14', age: 'Ages 12–14', grade: 'Grade 6–8' },
  { band: '15-16', age: 'Ages 15–16', grade: 'Grade 9–10' },
  { band: '17-18', age: 'Ages 17–18', grade: 'Grade 11–12' },
]
const accent: Accent = ACCENTS.cyan

export default function DemoPage() {
  const [run, setRun] = useState<DemoRun | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState<string | null>(null)

  // ⚠️ kv hydrates asynchronously — a synchronous read on a cold load returns null and a returning
  // visitor would be shown the band picker again, silently losing the chapter they already played.
  useEffect(() => {
    let dead = false
    void kv.ready().then(() => { if (!dead) { setRun(readDemo()); setReady(true) } })
    return () => { dead = true }
  }, [])

  if (!ready) return null

  // ── PLAYING ──────────────────────────────────────────────────────────────────────
  if (playing) {
    return <GuardedChapter id={playing} onExit={() => {
      // ⚠️ ABANDONING IS THE DEMO'S MAIN EXIT, not its edge case: most visitors who open a chapter
      // look, poke and leave. Without this it goes to `/menu`, which bounces a logged-out parent to
      // `/auth` — a login wall at the moment we were trying to earn the right to ask for a login.
      // Nothing is recorded: the chapter is unplayed and still theirs to try.
      setPlaying(null)
      track('demo_chapter_left', { chapter: playing, band: run?.band })
    }} onComplete={(correct, wrong, mastered) => {
      // ⚠️ THIS CALLBACK IS THE WHOLE FEATURE. `/teen-preview` discards its own on purpose; if this
      // one is ever dropped the demo silently never ends and the wall never appears, which is the
      // `ChapterPortal` fault (three months, no plan advanced) with a different consequence.
      const next = completeDemoChapter(playing, correct, wrong, mastered)
      setRun(next); setPlaying(null)
      track('demo_chapter_done', { chapter: playing, band: next?.band, done: next?.results.length })
    }} />
  }

  // ── BAND PICKER ──────────────────────────────────────────────────────────────────
  if (!run) {
    return (
      <Shell>
        <Head title="How old is your child?" sub={`Pick an age and play ${DEMO_LIMIT} chapters — no account, no email.`} />
        <div style={grid}>
          {BAND_PICK.map(b => (
            <button key={b.band} style={tile} onClick={() => {
              setRun(startDemo(b.band))
              track('demo_start', { band: b.band })
            }}>
              <div style={{ fontFamily: PT.sans, fontWeight: 700, fontSize: 17, color: PT.ink }}>{b.age}</div>
              <div style={{ fontFamily: PT.mono, fontSize: 11, color: PT.inkMute, marginTop: 3 }}>{b.grade}</div>
            </button>
          ))}
        </div>
      </Shell>
    )
  }

  const next = nextDemoChapter(run)
  const chapters = demoChapters(run.band)

  // ── THE WALL ─────────────────────────────────────────────────────────────────────
  if (demoUsedUp(run)) {
    return (
      <Shell>
        {/* ⚠️ SAY WHAT AN ACCOUNT BUYS, NOT THAT THE DEMO IS SPENT. "You've used your free chapters"
            makes the product the thing that ran out; the honest and better sentence is that nothing
            is being saved yet, which is also the reason to sign up. */}
        <Head title="Nice work — that's two done"
          sub="Right now none of it is being saved. A free account keeps their progress, picks the next chapter for them, and works on any device." />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Link href="/auth" style={cta} onClick={() => track('demo_wall', { action: 'signup', band: run.band })}>Create a free account →</Link>
          <Link href="/diagnostic" style={ghost} onClick={() => track('demo_wall', { action: 'diagnostic', band: run.band })}>Or find their exact starting point</Link>
        </div>
      </Shell>
    )
  }

  // ── NEXT UP ──────────────────────────────────────────────────────────────────────
  return (
    <Shell>
      <Head title={run.results.length ? 'One more, then' : "Let's play"}
        sub={`Chapter ${run.results.length + 1} of ${chapters.length} · nothing to sign up for yet.`} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <button style={{ ...cta, border: 'none' }} onClick={() => setPlaying(next)}>
          {CHAPTER_NAMES[next as keyof typeof CHAPTER_NAMES] ?? 'Play'} →
        </button>
        <Link href="/auth" style={ghost}>I already have an account</Link>
      </div>
    </Shell>
  )
}

// ── chrome ───────────────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <LabBackdrop accent={accent} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 45, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'safe center', gap: 20, padding: '16px 6vw', overflowY: 'auto',
      }}>{children}</div>
      <PtMilo left={9} />
    </div>
  )
}
function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 460 }}>
      <h2 style={{ margin: '0 0 6px', fontFamily: PT.sans, fontWeight: 700, fontSize: 24, color: PT.ink }}>{title}</h2>
      <p style={{ margin: 0, fontFamily: PT.sans, fontSize: 15, lineHeight: 1.5, color: PT.inkSoft }}>{sub}</p>
    </div>
  )
}
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, width: '100%', maxWidth: 480 }
const tile: React.CSSProperties = {
  padding: '16px 14px', borderRadius: 15, cursor: 'pointer', textAlign: 'center', minHeight: 44,
  background: PT.panel, backdropFilter: 'blur(6px)', border: `1.5px solid ${accent.base}55`,
  boxShadow: `0 0 14px ${accent.base}18, 0 6px 16px rgba(0,0,0,0.3)`,
}
const cta: React.CSSProperties = {
  padding: '13px 34px', borderRadius: 14, border: `1px solid ${accent.base}`, cursor: 'pointer',
  background: accent.base, color: '#06121f', fontFamily: PT.sans, fontWeight: 700, fontSize: 18,
  boxShadow: `0 0 26px ${accent.base}88`, textDecoration: 'none', minHeight: 44,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}
const ghost: React.CSSProperties = {
  padding: '10px 24px', borderRadius: 999, border: `1px solid ${PT.lineStrong}`, cursor: 'pointer',
  background: 'transparent', color: PT.inkMute, fontFamily: PT.sans, fontWeight: 700, fontSize: 14,
  textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
}
