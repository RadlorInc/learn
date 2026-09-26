'use client'
/**
 * The child's home: grade tabs (KG, 1, 2 — the story chapters — then 3–8) on top, that grade's modules on the left, the chosen module on the right with two ways in —
 * Learn (the topic path at /lesson) and Practice (mixed problems from every topic, at /practice).
 * Laid out like the founder's SampleUI template. A module that is not built yet says "Coming soon"; nothing is locked.
 */
import Link from 'next/link'
import { useEffect, useState, type CSSProperties } from 'react'
import { lessonDone } from '@/infra/storage/lessonProgress'
import { pullLessonProgress } from '@/infra/storage/lessonSync'
import { getWallet } from '@/data/repositories/points'
import { getMyLearners } from '@/data/repositories/learners'
import { getActiveLearner, setActiveLearner } from '@/data/supabase/useLearnerSession'
import { showDay } from './progressReport'
import { Thing, INK, TEAL, ON_TEAL, pill, PAGE_BG, shell, topBar } from './Pictures'
import { bubble, primary } from './Frame'
import { chosenModules, mixedPractice, type Module } from './modules'
import { C } from './sessionCopy'
import { TEXT_SIZES, saveTextSize, useTextSize, type TextSize } from '@/infra/storage/textSize'
import type { Obj } from './script'
import { getChapter, chapterKey, gradeLabel } from '@/core/chapters'

const LANDSCAPE = '(orientation: landscape) and (min-width: 700px)'

/** `lessonIds` = the topics the parent chose for this child (null = every topic); grades and modules with none are hidden. */
/** `exercises`: the class's exercises, for a child in a PAID teacher's class (features/classes) — a button to open them. */
export function ModuleHome({ learnerId, back, grade: startGrade = 3, lessonIds: savedIds, exercises }: {
  learnerId: string | null; back?: { href: string; label: string } | { onClick: () => void; label: string }; grade?: number; lessonIds?: readonly string[] | null
  exercises?: { count: number; onOpen: () => void }
}) {
  // The assigned lessons as of the latest read: the copy saved at sign-in, replaced by the account's own on mount, so a
  // lesson the parent assigns while the child is signed in reaches them the next time they open this screen.
  const [fresh, setFresh] = useState<{ ids: string[] | null; due: Record<string, string> | null } | null>(null)
  const lessonIds = fresh ? fresh.ids : savedIds
  const due = fresh ? fresh.due : getActiveLearner()?.lesson_due ?? null
  const all = chosenModules(lessonIds)
  // KG–2 story modules get their own layout (one Play card each); Grades 3–8 are the lesson modules.
  const storyMods = all.filter(x => x.story), mods = all.filter(x => !x.story)
  const STORY_TABS = [...new Set(storyMods.map(x => x.grade))]
  const GRADES = [...new Set(mods.map(x => x.grade))]
  const modulesOf = (g: number) => mods.filter(x => x.grade === g)
  const firstOf = (g: number) => { const ms = modulesOf(g); return (ms.find(x => x.lessons.length > 0) ?? ms[0]).id }
  // Progress follows the account: bring what another device did onto this one, then redraw. And the child's points.
  const [, redraw] = useState(0)
  const [points, setPoints] = useState<number | null>(null)
  useEffect(() => {
    if (!learnerId) return
    let live = true
    getMyLearners().then(all => {
      const me = all.find(l => l.id === learnerId)
      if (!live || !me) return
      const active = getActiveLearner()
      if (active?.id === me.id) setActiveLearner({ ...active, lesson_ids: me.lesson_ids ?? null, lesson_due: me.lesson_due ?? null })
      setFresh({ ids: me.lesson_ids ?? null, due: me.lesson_due ?? null })
    }).catch(() => { /* offline: the saved copy stands */ })
    // The wallet after the pull, so points earned by uploads it just sent are counted.
    pullLessonProgress(learnerId, chosenModules(null).flatMap(x => x.lessons.map(l => l.id)))
      .then(ok => { if (live && ok) redraw(n => n + 1); return getWallet(learnerId) })
      .then(w => { if (live && w && w !== 'unavailable') setPoints(w.balance) })
    return () => { live = false }
  }, [learnerId])
  const [picked, setPicked] = useState(() => GRADES.length ? firstOf(GRADES.includes(startGrade) ? startGrade : GRADES[0]) : '')
  // A story tab is open when the child asked for KG–2, or when the parent chose nothing from Grades 3–8.
  const [storyTab, setStoryTab] = useState<number | null>(() => STORY_TABS.includes(startGrade) ? startGrade : GRADES.length ? null : STORY_TABS[0] ?? null)
  const storyGrade = storyTab !== null && STORY_TABS.includes(storyTab) ? storyTab : GRADES.length ? null : STORY_TABS[0] ?? null
  const m = mods.find(x => x.id === picked) ?? mods[0] ?? storyMods[0]
  const grade = m.grade, ready = m.lessons.length > 0
  // Read during render: every caller mounts this on the client only, after kv has hydrated.
  const doneIn = (lessons: typeof m.lessons) => lessons.filter(l => lessonDone(learnerId, l.id)).length
  const done = doneIn(m.lessons)
  const firstObj = (m.lessons[0]?.screens[0].pictures.find(p => 'obj' in p) as { obj: Obj } | undefined)?.obj ?? 'cookie'

  return (
    <div className="mh-page" style={{ minHeight: '100dvh', background: PAGE_BG, padding: '14px 14px 26px', display: 'flex', justifyContent: 'center' }}>
      {/* Review 1 Q8 (founder, 2026-09-24): the three soft circles behind the home drift, slowly — CSS only, so the first
          paint waits for nothing; the home screen only, never practice; still for anyone who asks for reduced motion. */}
      <style>{`@keyframes mh-drift { 0%, 100% { background-position: 0 0, 0 0, 0 0 } 33% { background-position: 26px 18px, -22px 24px, 18px -26px } 66% { background-position: -16px 22px, 20px -14px, -24px 12px } }
.mh-page { animation: mh-drift 30s ease-in-out infinite }
@media (prefers-reduced-motion: reduce) { .mh-page { animation: none } }
.mh-grid { display: grid; gap: 18px }
/* Portrait: the chosen module and its Learn / Practice buttons first, the list of modules under it. */
@media not all and ${LANDSCAPE} { .mh-grid nav { order: 2 } }
@media ${LANDSCAPE} { .mh-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); align-items: start } }`}</style>
      <div style={{ ...shell, maxWidth: 1180, alignSelf: 'flex-start' }}>
        <div style={topBar}>
          {back && 'href' in back ? <Link href={back.href} style={{ ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>{back.label}</Link>
            : back ? <button type="button" onClick={back.onClick} style={pill}>{back.label}</button> : <span />}
          <span style={{ fontSize: 'clamp(16px, 3.6vw, 20px)' }}>{gradeLabel(storyGrade ?? grade)}</span>
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            {points !== null && <Link href="/play" style={{ ...pill, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>🎮 {points} points</Link>}
            <TextSizeMenu />
          </span>
        </div>

        <div role="tablist" aria-label="Grades" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 'clamp(14px, 3vw, 24px) clamp(14px, 3vw, 24px) 0' }}>
          {STORY_TABS.map(g => (
            <button key={g} type="button" role="tab" aria-selected={g === storyGrade} onClick={() => setStoryTab(g)}
              style={{ ...pill, background: g === storyGrade ? TEAL : '#fff', color: g === storyGrade ? ON_TEAL : INK }}>{gradeLabel(g)}</button>
          ))}
          {GRADES.map(g => (
            <button key={g} type="button" role="tab" aria-selected={storyGrade === null && g === grade} onClick={() => { setStoryTab(null); setPicked(firstOf(g)) }}
              style={{ ...pill, background: storyGrade === null && g === grade ? TEAL : '#fff', color: storyGrade === null && g === grade ? ON_TEAL : INK }}>Grade {g}</button>
          ))}
          {exercises && exercises.count > 0 && (
            <button type="button" onClick={exercises.onOpen} style={{ ...pill, marginLeft: 'auto', background: '#fbdbba', color: INK }}>✏️ Exercises ({exercises.count})</button>
          )}
        </div>

        {storyGrade !== null ? <StoryChapters key={storyGrade} modules={storyMods.filter(x => x.grade === storyGrade)} learnerId={learnerId} /> :
        <div className="mh-grid" style={{ padding: 'clamp(14px, 3vw, 24px)' }}>
          <nav aria-label="Modules" style={{ background: '#fff', border: `4px solid ${INK}`, borderRadius: 20, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {modulesOf(grade).map(x => {
              const ready = x.lessons.length > 0, on = x.id === picked, all = ready && doneIn(x.lessons) === x.lessons.length
              return (
                <button key={x.id} type="button" disabled={!ready} aria-pressed={on} onClick={() => setPicked(x.id)}
                  style={{ ...row, background: on ? TEAL : '#fff', color: on ? ON_TEAL : INK, ...(ready ? {} : { opacity: 0.55, boxShadow: 'none', cursor: 'default' }) }}>
                  <span style={{ ...num, background: all ? '#9cf0d8' : on ? '#fff' : '#fbdbba', color: INK }}>{all ? '✓' : x.n}</span>
                  <span style={{ flex: 1 }}>{x.title}{!ready && <small style={{ display: 'block', fontSize: 14, fontWeight: 700 }}>Coming soon</small>}</span>
                </button>
              )
            })}
          </nav>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Module {m.n}</p>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 40px)', color: INK, lineHeight: 1.1 }}>{m.title}</h1>
            <p style={bubble}>{ready ? 'Learn each topic with pictures first. Then practice them all mixed together.' : 'This module is coming soon.'}</p>
            {ready && <>
            <div style={{ ...card, background: '#9cf0d8' }}>
              <div style={{ flex: 1 }}>
                <strong style={cardTitle}>1. Learn</strong>
                {done} of {m.lessons.length} topics done
                {(() => {
                  const next = m.lessons.filter(l => !lessonDone(learnerId, l.id) && due?.[l.id]).map(l => due![l.id]).sort()[0]
                  return next ? <strong style={{ display: 'block', marginTop: 4 }}>Next due {showDay(next)}</strong> : null
                })()}
              </div>
              <span aria-hidden style={{ display: 'flex', gap: 3, '--lp-u': '18px' } as CSSProperties}><Thing obj={firstObj} /><Thing obj={firstObj} /><Thing obj={firstObj} /></span>
              <Link href={`/lesson?module=${m.id}`} style={primary}>{done === 0 ? 'Start learning' : done === m.lessons.length ? 'Learn again' : 'Keep learning'}</Link>
            </div>

            <div style={{ ...card, background: '#fbdbba' }}>
              <div style={{ flex: 1 }}>
                <strong style={cardTitle}>2. Practice</strong>
                {mixedPractice(m).length} mixed problems
              </div>
              <span aria-hidden style={{ display: 'flex', gap: 3, '--lp-u': '18px' } as CSSProperties}><Thing obj="cookie" /><Thing obj="chair" /><Thing obj="apple" /></span>
              <Link href={`/practice?module=${m.id}`} style={{ ...primary, background: '#fff', color: INK }}>Practice</Link>
            </div>
            </>}
          </section>
        </div>}
        <p style={{ margin: 0, padding: '0 0 16px', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>
          <Link href="/legal/privacy" style={{ color: INK }}>Privacy</Link>
        </p>
      </div>
    </div>
  )
}

/**
 * A KG–2 tab, laid out like Grades 3–8 (founder, 2026-09-25): each story chapter is a module — the numbered list on the
 * left, the chosen one on the right with one Play card. Play opens the chapter at /game; its Back returns to this tab.
 */
function StoryChapters({ modules, learnerId }: { modules: Module[]; learnerId: string | null }) {
  const chapters = modules.map(x => getChapter(x.story!))
  const [picked, setPicked] = useState(0)
  const c = chapters[picked] ?? chapters[0]
  const isDone = (id: string) => lessonDone(learnerId, chapterKey(id))
  return (
    <div className="mh-grid" style={{ padding: 'clamp(14px, 3vw, 24px)' }}>
      <nav aria-label="Modules" style={{ background: '#fff', border: `4px solid ${INK}`, borderRadius: 20, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {chapters.map((x, i) => {
          const on = i === picked, all = isDone(x.id)
          return (
            <button key={x.id} type="button" aria-pressed={on} onClick={() => setPicked(i)}
              style={{ ...row, background: on ? TEAL : '#fff', color: on ? ON_TEAL : INK }}>
              <span style={{ ...num, background: all ? '#9cf0d8' : on ? '#fff' : '#fbdbba', color: INK }}>{all ? '✓' : modules[i].n}</span>
              <span style={{ flex: 1 }}>{x.name}</span>
            </button>
          )
        })}
      </nav>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Module {modules[picked]?.n ?? picked + 1}</p>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 40px)', color: INK, lineHeight: 1.1 }}>{c.name}</h1>
        <p style={bubble}>{c.hint}</p>
        <div style={{ ...card, background: '#9cf0d8' }}>
          <div style={{ flex: 1 }}>
            <strong style={cardTitle}>Story</strong>
            {isDone(c.id) ? 'Done! Play it again any time.' : 'Watch first, then it is your turn.'}
          </div>
          <span aria-hidden style={{ fontSize: 40, lineHeight: 1 }}>{c.emoji}</span>
          <Link href={`/game?c=${c.id}`} style={primary}>{isDone(c.id) ? 'Play again' : 'Play'}</Link>
        </div>
      </section>
    </div>
  )
}

/** "Aa": the text size on this device (Review 1 Q5). A native <details>: keyboard open/close comes with it. */
const SIZE_LABEL: Record<TextSize, string> = { normal: C.sizeNormal, large: C.sizeLarge, xl: C.sizeXl }
function TextSizeMenu() {
  const size = useTextSize()
  return (
    <details style={{ position: 'relative' }}>
      <summary className="ts-summary" aria-label={C.textSize} title={C.textSize} style={{ ...pill, listStyle: 'none', cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <span aria-hidden>A<span style={{ fontSize: '1.3em' }}>a</span></span>
      </summary>
      <div role="group" aria-label={C.textSize} style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 50, background: '#fff', border: `4px solid ${INK}`,
        borderRadius: 16, boxShadow: `4px 4px 0 ${INK}`, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
        {TEXT_SIZES.map((s, i) => (
          <button key={s} type="button" aria-pressed={size === s} onClick={() => saveTextSize(s)}
            style={{ ...pill, fontSize: 16 + i * 3, textAlign: 'left', background: size === s ? TEAL : '#fff', color: size === s ? ON_TEAL : INK }}>
            {size === s ? '✓ ' : ''}{SIZE_LABEL[s]}
          </button>
        ))}
      </div>
    </details>
  )
}

const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 16,
  border: `4px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, fontWeight: 800, fontSize: 'clamp(17px, 2vw, 20px)', cursor: 'pointer' }
const num: CSSProperties = { width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  border: `3px solid ${INK}`, fontWeight: 900 }
const card: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', border: `4px solid ${INK}`, borderRadius: 20, padding: '14px 16px',
  fontSize: 18, fontWeight: 600, color: INK }
const cardTitle: CSSProperties = { display: 'block', fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900 }
