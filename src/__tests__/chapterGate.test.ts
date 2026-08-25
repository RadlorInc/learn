import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { readdirSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { gateVerdict, lockCopy } from '@/features/billing/chapterGate'
import { LockedChapterCard } from '@/shared/ui/LockedChapterCard'
import { CHAPTERS } from '@/core/chapters'
import { isArChapter } from '@/core/arChapters'

/**
 * BILLING STAGE 3 — the chapter gate and the screens.
 *
 * ⚠️⚠️ EVERY ASSERTION BELOW IS ABOUT THE REFUSING PATH, WHICH IS A STATE PRODUCTION IS NOT IN.
 * `billing_config.enforced` is `false`, so today every chapter answers entitled and no lock can
 * render — which is exactly how a paywall nobody has watched refuse anything ships. The verdict is
 * therefore injected as `false` (the state the flag produces) rather than waited for, the same way
 * `rls_regression` forces the flag ON in setup and asserts that it did.
 *
 * The wiring — that `/game` actually consults this — is NOT provable here and is driven in
 * `e2e/chapter-gate.spec.ts`. A unit test cannot see that nothing calls the unit; that fault cost
 * this repo three months on the plan pointer.
 */
const SRC = join(__dirname, '../..')
const read = (p: string) => readFileSync(join(SRC, p), 'utf8')

/** ⚠️ EVERY SOURCE PATTERN BELOW RUNS OVER COMMENT-STRIPPED CODE. Written raw, the first draft of
 *  this file failed on its own documentation: the pricing page's header says NO COUNTDOWN and
 *  quotes a "$12.98" it exists to forbid, so two checks reported the file they were written to
 *  protect. This repo has shipped that mistake three times. */
const decomment = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

describe('the entry verdict', () => {
  it('locks a signed-in learner the database refuses', () => {
    expect(gateVerdict('learner-1', false)).toBe('locked')
  })

  it('allows one it accepts', () => {
    // The positive control. Without it "it locks" is equally satisfied by a gate that locks
    // everything, which is a product with no chapters in it.
    expect(gateVerdict('learner-1', true)).toBe('allowed')
  })

  it('renders NOTHING while the answer is still coming', () => {
    // ⚠️ Not "allowed until we find out": that would flash a frame of a chapter at a child who is
    // about to be refused, which is the fault the camera guard's own comment records.
    expect(gateVerdict('learner-1', undefined)).toBe('checking')
  })

  it('⚠️ FAILS OPEN when the lookup failed — null is not false', () => {
    // A UX gate over a database that already refuses the WRITE. Locking a paying child out because
    // their wifi dropped is the worse failure; letting one in costs a row `sync_session` rejects.
    // Same reasoning `billing_config` fails open for, and the opposite of the camera guard.
    expect(gateVerdict('learner-1', null)).toBe('allowed')
  })

  it('source A — a visitor with no learner is never gated', () => {
    // The demo is pre-signup and local only: no account, no rows, nothing for the database to
    // answer about. `/demo` limits its own two chapters.
    expect(gateVerdict(null, false)).toBe('allowed')
    expect(gateVerdict(null, undefined)).toBe('allowed')
  })
})

describe('the lock NAMES what is behind it', () => {
  it('gives every chapter its own emoji, name and one-line what-it-does', () => {
    // ⚠️ Swept across the WHOLE catalogue, not sampled: a lock that falls back to "This chapter"
    // for some band is a lock doing no work, and it would be invisible in a spot check.
    for (const c of CHAPTERS) {
      const copy = lockCopy(c.id)
      expect(copy.title, c.id).toBe(c.name)
      expect(copy.what, c.id).toBe(c.hint)
      expect(copy.emoji, c.id).toBe(c.emoji)
      expect(copy.what.length, `${c.id}: a lock that says nothing is doing no work`).toBeGreaterThan(10)
    }
  })

  it('says the camera one is played with your hands, and only that one', () => {
    const ar = CHAPTERS.filter(c => isArChapter(c.id))
    expect(ar.length, 'no AR chapters found — the sweep has rotted').toBeGreaterThan(0)
    for (const c of CHAPTERS) expect(lockCopy(c.id).hands, c.id).toBe(isArChapter(c.id))
  })

  it('falls back to something honest for an id the catalogue does not know', () => {
    const copy = lockCopy('not-a-chapter')
    expect(copy.title).toBeTruthy()
    expect(copy.what).toBeTruthy()
  })
})

describe('⚠️ a CHILD never sees a price', () => {
  /**
   * ⚠️ RENDERED, NOT GREPPED — and the first version of this WAS grepped and was wrong. A regex for
   * `\d+\.\d\d` over the module matched `lineHeight: 1.55`: a CSS value reported as a price. The
   * property is about what a CHILD READS, so the thing to examine is the text a child gets, and the
   * sweep runs over EVERY chapter because the words come from each chapter's own catalogue hint.
   */
  const html = (id: string) => renderToStaticMarkup(createElement(LockedChapterCard, { chapterId: id }))
  const text = (id: string) => html(id).replace(/<[^>]*>/g, ' ')

  const FORBIDDEN = [
    ['a currency symbol', /[$€£]/],
    ['a price', /\d+\.\d\d/],
    ['the word "upgrade"', /upgrade/i],
    ['the word "subscribe"', /subscri/i],
    ['a price-shaped word', /\b(pay|price|cost|plan|trial)\b/i],
  ] as const

  it('shows no price and no money word, on ANY chapter', () => {
    for (const c of CHAPTERS) {
      const t = text(c.id)
      for (const [what, re] of FORBIDDEN) {
        expect(re.test(t), `${c.id}: the child's lock card says ${what} — "${t.trim().slice(0, 120)}"`).toBe(false)
      }
    }
  })

  it('offers no way to pay — no checkout call and no route to the pricing page', () => {
    for (const c of CHAPTERS) {
      const h = html(c.id)
      expect(/\/api\/checkout/.test(h), `${c.id} links to checkout`).toBe(false)
      expect(/\/parent\/plan/.test(h), `${c.id} links to the pricing page`).toBe(false)
    }
  })

  it('…and that sweep can actually find those things', () => {
    // ⚠️ POSITIVE CONTROL. A search that finds nothing and a broken search look identical from
    // outside, and the broken one reads as good news.
    // ⚠️ It must contain EVERY forbidden thing, or the control silently proves only some of the
    // sweep works — which is how a half-blind search passes as a whole one. Caught by this very
    // assertion on its first run: the planted string had no "subscribe" in it.
    const planted = '<a href="/parent/plan">Upgrade — subscribe to a plan, pay $4.99, price rises after the trial, cost per child</a>'
    const plantedText = planted.replace(/<[^>]*>/g, ' ')
    for (const [what, re] of FORBIDDEN) {
      expect(re.test(plantedText), `the sweep cannot see ${what}`).toBe(true)
    }
    expect(/\/parent\/plan/.test(planted)).toBe(true)
  })

  it('tells the child to ask a grown-up, and NAMES the chapter rather than saying "locked"', () => {
    const t = text('decimals')
    expect(t).toMatch(/ask a grown-up/i)
    expect(t).toContain('Decimals')
    // "Locked" is the word that does no work — §3 of docs/billing-stage-3.md.
    expect(/locked/i.test(t), 'the card announces itself as "locked" instead of explaining').toBe(false)
  })
})

describe('⚠️ the gate is at chapter entry, and nowhere else', () => {
  const game = decomment(read('src/app/game/page.tsx'))

  it('/game does not mount the chapter unless the verdict is allowed', () => {
    // The chapter component is inside a `gate === 'allowed'` condition, so 'checking' and 'locked'
    // both render no chapter at all — the camera guard's rule: refuse the render, do not disable a
    // control.
    expect(game).toMatch(/playingChapter && gate === 'allowed'/)
    expect(game).toMatch(/LockedChapterCard/)
    /**
     * ⚠️ ANCHORED ON THE WHOLE STATEMENT, because `/gate === 'locked'/` alone is satisfied by a DEAD
     * branch. Caught by mutation: wrapping the return in `if (false && …)` left this green, and a
     * locked chapter would then have rendered NOTHING — a blank screen, which is worse than the
     * refusal it replaced and says nothing to the child at all.
     */
    expect(game, 'the locked branch is guarded by something other than the verdict')
      .toMatch(/^\s*if \(playingChapter && gate === 'locked'\) \{$/m)
  })

  it('the verdict is taken ONCE — the hook keys on the chapter, not on a render', () => {
    const hook = decomment(read('src/features/billing/useChapterGate.ts'))
    // ⚠️ The dependency array is what makes "never mid-chapter" structural rather than a promise:
    // nothing re-asks while a chapter is open, so there is no answer that could change under a
    // child mid-question.
    expect(hook).toMatch(/\}, \[chapterId, learnerId\]\)/)
  })

  it('⚠️ THE DIAGNOSTIC IS NEVER GATED — counted, not eyeballed', () => {
    // It is how a parent decides to buy. Counting the call sites is the check: asserting the
    // diagnostic "does not import it" passes just as happily when a third route starts to.
    const callers = ['src/app/game/page.tsx', 'src/app/parent/page.tsx']
    const all = [
      'src/app/game/page.tsx', 'src/app/parent/page.tsx', 'src/app/diagnostic/page.tsx',
      'src/app/demo/page.tsx', 'src/app/teen-preview/page.tsx', 'src/app/menu/page.tsx',
      'src/app/diagnostic/recheck/page.tsx',
    ]
    const uses = all.filter(f => /useChapterGate|entitledChapters|isChapterEntitled/.test(decomment(read(f))))
    expect(uses.sort(), 'a route started gating that should not, or one stopped').toEqual(callers.sort())
  })
})

describe('the PARENT side is the only side with a price', () => {
  const plan = decomment(read('src/app/parent/plan/page.tsx'))

  it('states the ladder: first child, each additional, the cap, monthly and annual', () => {
    expect(plan).toMatch(/First child/i)
    expect(plan).toMatch(/Each additional child/i)
    expect(plan).toMatch(/MAX_SEATS/)
    expect(plan).toMatch(/'monthly', 'annual'/)
  })

  it('⚠️ derives every figure from the ladder rather than typing one', () => {
    // A typed "$12.98" is a second copy of the ladder, and the day it drifts a parent is quoted one
    // figure and charged another. `totalCents` is the function the hand-computed totals gate.
    expect(plan).toMatch(/totalCents\(/)
    expect(plan).toMatch(/LADDER\[cadence\]/)
    expect(/\$\d/.test(plan.replace(/\$\{/g, '')), 'a hard-coded dollar amount').toBe(false)
  })

  it('⚠️ has no countdown and no manufactured urgency', () => {
    // Founder's call: no dark patterns. A timer in this module is the mechanism every one of them
    // needs, so the absence of a timer is the check.
    for (const re of [/setInterval/, /setTimeout/, /countdown/i, /hurry/i, /spots? left/i, /ends in/i]) {
      expect(re.test(plan), `the pricing page contains ${re}`).toBe(false)
    }
  })

  it('routes a locked chapter to it from the parent dashboard only', () => {
    const parent = decomment(read('src/app/parent/page.tsx'))
    expect(parent).toMatch(/\/parent\/plan/)
    // ⚠️ `false` only. `null` means the lookup failed, and a failed lookup must not become a lock —
    // the same fail-open rule the child's gate has.
    expect(parent).toMatch(/chapterLocks\[ch\] === false/)
  })
})

describe('⚠️ the hook, DRIVEN — a verdict nothing reads is not a gate', () => {
  /**
   * The unit above proves the verdict function; this proves the WIRING between it and the database
   * read, by rendering the hook for real and watching it move. A unit test cannot see that nothing
   * calls the unit — the fault that cost this repo three months on the plan pointer — so the two
   * checks are not the same check.
   *
   * ⚠️ WHAT THIS STILL DOES NOT COVER, said out loud rather than implied: the browser chain
   * (`/menu` → `/game` → a real RPC). The e2e harness signs in with an unsigned JWT, so
   * `getLearnerBootstrap` 401s and the menu never finishes loading — driving the gate there would be
   * driving it in a world where it cannot be reached, which is a class this repo has already paid
   * for. The real coverage for that chain is the watched test-mode purchase (billing-stage-3.md §0).
   */
  async function driveHook(entitled: boolean | null, learner: { id: string } | null) {
    vi.resetModules()
    vi.doMock('@/data/repositories', () => ({ isChapterEntitled: vi.fn(async () => entitled) }))
    vi.doMock('@/data/supabase/useLearnerSession', () => ({ getActiveLearner: () => learner }))
    const { useChapterGate } = await import('@/features/billing/useChapterGate')
    const seen: string[] = []
    function Probe() { seen.push(useChapterGate('decimals')); return null }
    const el = document.createElement('div')
    document.body.appendChild(el)
    const root = createRoot(el)
    await act(async () => { root.render(createElement(Probe)) })
    await act(async () => { root.unmount() })
    el.remove()
    return seen
  }

  it('a refused chapter goes checking → locked, and never shows allowed on the way', async () => {
    const seen = await driveHook(false, { id: 'L1' })
    expect(seen[0], 'the first paint must render nothing, not the chapter').toBe('checking')
    expect(seen[seen.length - 1]).toBe('locked')
    expect(seen, 'it flashed a frame of an allowed chapter at a child about to be refused')
      .not.toContain('allowed')
  })

  it('an entitled chapter ends allowed (positive control)', async () => {
    const seen = await driveHook(true, { id: 'L1' })
    expect(seen[seen.length - 1]).toBe('allowed')
  })

  it('a failed lookup ends allowed — fail open', async () => {
    const seen = await driveHook(null, { id: 'L1' })
    expect(seen[seen.length - 1]).toBe('allowed')
  })

  it('no learner never even asks', async () => {
    const seen = await driveHook(false, null)
    expect(seen).toEqual(['allowed'])
  })
})

describe('⚠️ the repository asks the function the database actually has', () => {
  it('the RPC name and BOTH parameter names match the newest migration definition', () => {
    /**
     * ⚠️ THE SEAM THE MOCK ABOVE HIDES, AND THE ONE THAT FAILS QUIETLY. A wrong parameter name is a
     * PostgREST 404, which this repository turns into `null`, which FAILS OPEN — so the paywall
     * would simply never gate anything, with no error anywhere and every test above still green.
     * Derived from the migrations rather than typed here, so it moves when the function does.
     */
    const MIG = join(SRC, 'supabase/migrations')
    const files = readdirSync(MIG).filter(f => f.endsWith('.sql')).sort()
    let signature: string | null = null
    for (const f of files) {
      const m = [...readFileSync(join(MIG, f), 'utf8')
        .matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.is_chapter_entitled\s*\(([^)]*)\)/gi)]
      if (m.length) signature = m[m.length - 1][1]      // the LAST definition wins, as in Postgres
    }
    expect(signature, 'no definition of is_chapter_entitled found — the regex has rotted').toBeTruthy()

    const params = signature!.split(',').map(p => p.trim().split(/\s+/)[0])
    expect(params, 'the function signature changed').toEqual(['p_learner_id', 'p_chapter'])

    const repo = decomment(read('src/data/repositories/billing.ts'))
    expect(repo).toContain("rpc('is_chapter_entitled'")
    for (const p of params) expect(repo, `the repository does not pass ${p}`).toContain(`${p}:`)
  })
})

describe('⚠️ the repository fails OPEN — the direction that silently locks a paying child out', () => {
  /**
   * ⚠️ THIS IS THE SEAM THE HOOK'S MOCK CANNOT SEE, AND IT SURVIVED THE FIRST MUTATION PASS.
   * Turning an RPC error into `false` rather than `null` reads as harmless defensiveness and is the
   * worst thing in this file: a transient error would lock a PAYING child out of a chapter they own,
   * with the database perfectly happy to record it. Driven against a stubbed Supabase client rather
   * than reasoned about.
   */
  async function ask(rpc: () => Promise<unknown>) {
    vi.resetModules()
    vi.doMock('@/data/supabase/client', () => ({ createClient: () => ({ rpc }) }))
    const { isChapterEntitled } = await import('@/data/repositories/billing')
    return isChapterEntitled('L1', 'decimals')
  }

  it('passes a true through', async () => {
    expect(await ask(async () => ({ data: true, error: null }))).toBe(true)
  })

  it('passes a false through — the refusal is real', async () => {
    expect(await ask(async () => ({ data: false, error: null }))).toBe(false)
  })

  it('an RPC error is null, NOT false', async () => {
    expect(await ask(async () => ({ data: null, error: { message: 'nope' } }))).toBeNull()
  })

  it('a thrown network error is null, NOT false', async () => {
    expect(await ask(async () => { throw new Error('offline') })).toBeNull()
  })

  it('a non-boolean answer is null, NOT false', async () => {
    // PostgREST returns `null` for a function it cannot find. Treating that as a refusal would make
    // a renamed function into a total lockout.
    expect(await ask(async () => ({ data: null, error: null }))).toBeNull()
  })

  it('asks with the learner and chapter it was given', async () => {
    let seen: unknown = null
    await ask(async (...args: unknown[]) => { seen = args; return { data: true, error: null } })
    expect(seen).toEqual(['is_chapter_entitled', { p_learner_id: 'L1', p_chapter: 'decimals' }])
  })
})
