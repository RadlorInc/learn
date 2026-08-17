'use client'
/**
 * The shared chapter portal — the plumbing every chapter wrapper used to repeat.
 *
 * Each chapter is mounted as a full-screen portal over the app, runs one attempt,
 * syncs the result once, and can be replayed. That was ~40–110 lines duplicated
 * across 55 near-identical wrapper files; it now lives here once and each chapter
 * is a row in the registry (see app/game/page.tsx).
 *
 * Two shapes, because the bands genuinely differ:
 *   • story (3–11) — the experience owns its own ending; a CelebrationModal sits
 *     over the portal, and the backdrop colour is per-chapter.
 *   • teen (12–18) — the band skin is scoped by `data-band`, the run ends on a
 *     MasteryState card, and speech is stopped on exit/unmount. An optional
 *     Explore sim can precede the game.
 */
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChapterSync } from '@/data/supabase/useChapterSync'
import { stopSpeech } from '@/infra/useMiloSpeaker'
import CelebrationModal from '@/shared/ui/CelebrationModal'
import MasteryState from '@/features/chapters/teen/MasteryState'
import ExploreStep from '@/features/chapters/teen/ExploreStep'
import type { AgeBand } from '@/features/chapters/teen/types'
import type { ChapterType } from '@/core/chapters'

export type ChapterProps = { onComplete: (correct: number, wrong: number, mastered?: boolean) => void; childName: string }
type Finish = (correct: number, wrong: number, mastered?: boolean) => void

/** Portal mount + one-shot result sync + replay. `quiet` also stops speech on unmount. */
function usePortalRun(skill: ChapterType, quiet: boolean) {
  const router = useRouter()
  const { finishAndSync } = useChapterSync()
  const [body, setBody] = useState<HTMLElement | null>(null)
  const [runKey, setRunKey] = useState(0)
  const doneRef = useRef(false)

  useEffect(() => {
    setBody(document.body)
    if (quiet) return () => stopSpeech()
  }, [quiet])

  // Guarded: a chapter may report completion more than once (a late timer, a
  // double-tap); only the first attempt is scored.
  const finish = useCallback<Finish>((c, w, mastered) => {
    if (doneRef.current) return
    doneRef.current = true
    finishAndSync(skill, c, w, 'practice', mastered)
  }, [finishAndSync, skill])

  const replay = useCallback(() => { doneRef.current = false; setRunKey(k => k + 1) }, [])

  return { router, body, runKey, finish, replay }
}

// ─── Story chapters (3–11) ──────────────────────────────────────────────────

/** Story experiences declare these props optional (they can run standalone in
 *  /story), so the portal's contract is the subset it actually passes. `world`
 *  is only ever passed by /story's `?world=` preview link; the portal never sets it. */
export type StoryProps = { onFinish?: Finish; onExit?: () => void; world?: string }
export type StoryInner = React.ComponentType<StoryProps>

export function makeStoryChapter(skill: ChapterType, bg: string, Inner: StoryInner) {
  return function StoryChapter(_props: ChapterProps) {
    const { router, body, runKey, finish, replay } = usePortalRun(skill, false)
    if (!body) return null
    const exit = () => router.push('/menu')
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 900, background: bg }}>
        <Inner key={runKey} onFinish={finish} onExit={exit} />
        <CelebrationModal onExit={exit} onPlayAgain={replay} />
      </div>,
      body,
    )
  }
}

// ─── Teen chapters (12–18) ──────────────────────────────────────────────────

export type TeenGame = React.ComponentType<{ childName: string; onExit: () => void; onFinish: Finish }>
export type Sim = React.ComponentType<{ band: AgeBand }>

export type TeenChapterCfg = {
  skill: ChapterType
  band: AgeBand
  conceptsConfirmed: string[]
  nextPointer: string
  /** Optional play-with-it beat before the game. Skippable by design. */
  explore?: { title: string; intro: string; continueLabel?: string }
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="milo-lesson" style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 18px', background: 'var(--bg-page)', color: 'var(--ink)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}>
      {children}
    </div>
  )
}

function TeenWorld({ cfg, Game, SimComp, childName, onFinish, onExit, onReplay }: {
  cfg: TeenChapterCfg; Game: TeenGame; SimComp?: Sim
  childName: string; onFinish: Finish; onExit: () => void; onReplay: () => void
}) {
  const [phase, setPhase] = useState<'explore' | 'game' | 'done'>(cfg.explore && SimComp ? 'explore' : 'game')

  if (phase === 'explore' && cfg.explore && SimComp) {
    return (
      <ExploreStep
        band={cfg.band}
        title={cfg.explore.title}
        intro={cfg.explore.intro}
        continueLabel={cfg.explore.continueLabel ?? 'Skip to the game'}
        onContinue={() => setPhase('game')}
      >
        <SimComp band={cfg.band} />
      </ExploreStep>
    )
  }

  if (phase === 'done') {
    return (
      <Centered>
        <MasteryState
          band={cfg.band}
          conceptsConfirmed={cfg.conceptsConfirmed}
          nextPointer={cfg.nextPointer}
          onPlayAgain={onReplay}
          onExit={onExit}
        />
      </Centered>
    )
  }

  return (
    <Game
      childName={childName}
      onExit={onExit}
      onFinish={(c, w, mastered) => { onFinish(c, w, mastered); setPhase('done') }}
    />
  )
}

export function makeTeenChapter(cfg: TeenChapterCfg, Game: TeenGame, SimComp?: Sim) {
  return function TeenChapter(props: ChapterProps) {
    const { router, body, runKey, finish, replay } = usePortalRun(cfg.skill, true)
    if (!body) return null
    const exit = () => { stopSpeech(); router.push('/menu') }
    return createPortal(
      <div data-band={cfg.band} style={{ position: 'fixed', inset: 0, zIndex: 900, overflowY: 'auto', background: 'var(--bg-page)', color: 'var(--ink)' }}>
        <TeenWorld
          key={runKey}
          cfg={cfg}
          Game={Game}
          SimComp={SimComp}
          childName={props.childName}
          onFinish={finish}
          onExit={exit}
          onReplay={replay}
        />
      </div>,
      body,
    )
  }
}
