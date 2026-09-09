/**
 * THE ADAPTIVE LOOP, END TO END — the four questions a founder actually asks of it:
 *
 *   1. is the adaptive system working?          → the tier a child is SERVED, per answer pattern
 *   2. does the re-explanation arrive?          → is it REACHABLE at all, in every live chapter
 *   3. is it at the right difficulty?           → what tier the engine holds when it fires, and
 *                                                 whether the words are derived from that round
 *   4. what else belongs beside those?          → mastery vs coverage, the demote floor, the two
 *                                                 copies of RETEACH_AFTER, the round budget
 *
 * ⚠️ WHY THIS FILE EXISTS WHEN `progression.test.ts` ALREADY GATES THE ENGINE. That file proves the
 * RULES; it cannot see either shell FAIL TO ASK the engine. Measured live on 2026-08-20, `GameShell`
 * read `ada.difficulty` off the render closure inside a callback it had already scheduled on a
 * 1650 ms timer — so every promotion and demotion landed ONE QUESTION LATE (engine said tier 2 while
 * the question served was tier 1) and the engine's own tests were perfectly green throughout. That is
 * this repo's "a unit test cannot see that nothing calls the unit", one layer along: the unit WAS
 * called, with a stale argument.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  MASTERY_STREAK, initialProgress, step, isMastered, type Difficulty, type Progress,
} from '@/core/progression'
import { scoreChapter } from '@/core/scoring'
import { getChapterLevel, setChapterLevel, hydrateChapterLevels } from '@/infra/storage/chapterLevel'
import { RETEACH_AFTER as SHELL_RETEACH } from '@/features/chapters/teen/games/parts/GameShell'
import { roundsFor, resumesTier } from '@/features/chapters/teen/games/parts/GameShell'
import { ANGLE_SHOP_CONFIG } from '@/features/chapters/teen/games/AngleShopGame'
import { explainBeats, reachable, kindOf, SHAPE_LINES, FOLD_WHERE, WEEK, type Round } from '@/features/chapters/story/angles'

// ── the eight 9–11 modules, driven for real ──────────────────────────────────────────────
import * as cents     from '@/features/chapters/story/cents'
import * as factors   from '@/features/chapters/story/factors'
import * as pizza     from '@/features/chapters/story/pizza'
import * as inches    from '@/features/chapters/story/inches'
import * as words     from '@/features/chapters/story/words'
import * as plotMaths from '@/features/chapters/story/plotMaths'
import * as cargo     from '@/features/chapters/story/cargo'

const SHELL_SRC = readFileSync('src/features/chapters/teen/games/parts/GameShell.tsx', 'utf8')
const STORY_SRC = readFileSync('src/features/chapters/story/StoryWorld.tsx', 'utf8')
const TIERS: Difficulty[] = [1, 2, 3]

// ── a seeded Math.random, so a sampling sweep is reproducible ────────────────────────────
// A gate that samples an unseeded generator is a coin flip, and a coin-flip gate gets re-run
// until it is green. Seeded, a failure can be reproduced from the printed seed.
let restoreRandom: (() => void) | null = null
function seed(n: number) {
  let s = n >>> 0
  const real = Math.random
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  restoreRandom = () => { Math.random = real }
}
afterEach(() => { restoreRandom?.(); restoreRandom = null })

// ─────────────────────────────────────────────────────────────────────────────────────────
// ① IS THE ADAPTIVE SYSTEM WORKING — the tier the child is SERVED
// ─────────────────────────────────────────────────────────────────────────────────────────

/** Play a run the way a shell does: the tier a question is SERVED at is the engine's tier at the
 *  moment that question is built — i.e. after the previous answer has been recorded. */
function served(answers: readonly boolean[], start: Difficulty = 1) {
  let p: Progress = initialProgress(start)
  const tiers: Difficulty[] = []
  for (const a of answers) {
    tiers.push(p.difficulty)          // this question is built at the tier standing NOW
    p = step(p, a)
    if (isMastered(p)) break          // the shells stop here
  }
  return { tiers, p }
}

describe('① the adaptive system — the tier a child is actually served', () => {
  it('a clean run climbs 1 → 2 → 3 and then ends on mastery', () => {
    const { tiers, p } = served(Array(20).fill(true))
    expect(tiers[0]).toBe(1)
    expect(new Set(tiers)).toEqual(new Set([1, 2, 3]))   // all three tiers are really reached
    expect(tiers).toEqual([...tiers].sort())             // and never goes backwards on a clean run
    expect(isMastered(p)).toBe(true)
  })

  it('THE ROUND BUDGET: an ace is served 3 at L1, 1 at L2, 2 at L3 — and then it is over', () => {
    // chapter-craft.md builds its whole "a tier is a ROUND BUDGET, not a difficulty knob" argument
    // on these three numbers. They are a consequence of the constants, so they are asserted here
    // rather than narrated — and they are what makes the one-question lag below expensive.
    const { tiers } = served(Array(20).fill(true))
    const at = (d: Difficulty) => tiers.filter(t => t === d).length
    expect([at(1), at(2), at(3)]).toEqual([3, 1, 2])
    expect(tiers.length).toBe(MASTERY_STREAK)
  })

  it('a struggling child is eased DOWN, and never below tier 1', () => {
    const { tiers, p } = served([true, true, true, true, false, false, false, false], 1)
    expect(Math.max(...tiers)).toBeGreaterThan(1)       // climbed
    expect(tiers[tiers.length - 1]).toBeLessThan(Math.max(...tiers))   // then eased back
    expect(p.difficulty).toBe(1)
  })

  it('a child who is wrong from the first question is never served above tier 1', () => {
    const { tiers } = served(Array(10).fill(false))
    expect(new Set(tiers)).toEqual(new Set([1]))
  })

  it('⚠️ THE SHELL MUST READ THE LIVE TIER, NOT THE ONE ITS CLOSURE CAPTURED', () => {
    // `submit` schedules loadTask on a 1650 ms timer, so the callback belongs to the render the
    // ANSWER was given in — the tier BEFORE ada.record() moved it. Measured live on `integers`
    // (2026-08-20): served 1 / engine 2, then served 2 / engine 3, so a child who mastered the
    // chapter met exactly ONE top-tier question instead of the two the budget above promises.
    expect(SHELL_SRC, 'the tier comes off a live ref').toMatch(/warmupDiff : adaRef\.current\.difficulty/)
    expect(SHELL_SRC, 'and never off the render closure').not.toMatch(/warmupDiff : ada\.difficulty/)
    // SkillBeat has always done it this way; the two engines must not drift apart again.
    expect(STORY_SRC).toMatch(/beat\.make\(adaRef\.current\.difficulty/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
// ② DOES THE RE-EXPLANATION ARRIVE — is it reachable at all
// ─────────────────────────────────────────────────────────────────────────────────────────

/**
 * What a chapter tells SkillBeat to count down. Resolves a bare literal and one level of
 * `const NAME = <n>`; anything computed from content (RainbowTown's `TEST_PAGE.targets.length`,
 * ShapeTown's `SEQUENCE.length - FIRST_SCORED`) is returned as `null` — measured by hand on
 * 2026-08-20 at 10 and 10, and the assertion below still requires the declaration to EXIST.
 */
function declaredRounds(src: string): Array<number | null> {
  return [...src.matchAll(/\brounds:\s*([A-Za-z0-9_.() -]+?)\s*[,}]/g)].map(m => {
    const raw = m[1].trim()
    if (/^\d+$/.test(raw)) return Number(raw)
    const named = src.match(new RegExp(`\\b${raw.replace(/[^\\w]/g, '')}\\s*=\\s*(\\d+)\\b`))
    return named ? Number(named[1]) : null
  })
}

/** A chapter file that is only a thin wrapper (`return <Other ... />`) is really the other file. */
function resolveChapterFile(file: string): string {
  const src = readFileSync(file, 'utf8')
  if (/\brounds:/.test(src) || /Reteach:/.test(src)) return file
  const m = src.match(/import\s+(\w+)\s+from\s+'\.\/(\w+)'/)
  return m && new RegExp(`<${m[1]}[\\s/>]`).test(src) ? `src/features/chapters/story/${m[2]}.tsx` : file
}

/** The 24 live storybook chapters, taken from the ONE table both the registry and /story build
 *  from — so this list cannot fall behind the app. */
function liveStoryChapterFiles(): Array<[string, string]> {
  const table = readFileSync('src/features/chapters/storyChapters.tsx', 'utf8')
  const block = table.slice(table.indexOf('export const STORY_CHAPTERS'))
  const out = [...block.matchAll(/(\w+):\s*\{[^}]*?import\("@\/features\/chapters\/story\/(\w+)"\)/g)]
    .map(m => [m[1], `src/features/chapters/story/${m[2]}.tsx`] as [string, string])
  expect(out.length, 'the STORY_CHAPTERS table was not parsed').toBeGreaterThanOrEqual(20)
  return out
}

describe('② the re-explanation — reachable at all', () => {
  it('both engines use ONE number of misses, and it is 3', () => {
    // Two files declare it. Until they are one constant, this is what stops them drifting.
    expect(SHELL_SRC).toMatch(/export const RETEACH_AFTER = 3/)
    expect(STORY_SRC).toMatch(/export const RETEACH_AFTER = 3/)
    expect(SHELL_RETEACH).toBe(3)
  })

  it('⚠️ every live chapter plays enough rounds for a 3-miss re-teach to be REACHABLE', () => {
    // A beat of `rounds: 2` can never accumulate three misses, so its Reteach component is dead
    // code that nothing can ever show. The `world1` World shipped four such beats — `rounds: 1`
    // and `rounds: 2` — for as long as it existed; nothing imported it and it was DELETED
    // 2026-08-20. The list here is derived from the STORY_CHAPTERS table rather than from the
    // directory, so a file that no chapter loads can never make this gate pass or fail.
    for (const [id, raw] of liveStoryChapterFiles()) {
      const file = resolveChapterFile(raw)
      const rs = declaredRounds(readFileSync(file, 'utf8'))
      expect(rs.length, `${id}: no rounds: declared in ${file}`).toBeGreaterThan(0)
      for (const r of rs) {
        if (r === null) continue   // computed from content — see declaredRounds
        expect(r, `${id} (${file}) plays ${r} rounds`).toBeGreaterThanOrEqual(SHELL_RETEACH)
      }
    }
    // and the shell's own bands
    for (const b of ['9-11', '12-14', '15-16', '17-18'] as const) {
      expect(roundsFor(b), b).toBeGreaterThanOrEqual(SHELL_RETEACH)
    }
  })

  it('every live storybook chapter actually declares a Reteach for its beat', () => {
    for (const [id, raw] of liveStoryChapterFiles()) {
      expect(readFileSync(resolveChapterFile(raw), 'utf8'), `${id} has no Reteach`).toMatch(/Reteach:/)
    }
  })

  it('the shell will not render a re-teach board with no lines, so empty `work` is silence', () => {
    // The guard is correct; the point is that a chapter shipping `work: []` on a SCORED task buys
    // a blank board and a ~3.4 s pause (speakSteps' silent fallback) instead of an explanation.
    expect(SHELL_SRC).toMatch(/sub === 'reteach' && reteachAt >= 0 && task\.work\.length > 0/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
// ③ IS IT AT THE RIGHT DIFFICULTY
// ─────────────────────────────────────────────────────────────────────────────────────────

describe('③ the re-explanation lands at the eased difficulty', () => {
  it('⚠️ the child is DEMOTED on the 2nd miss, so the 3rd — the one that re-teaches — is easier', () => {
    // demote fires at wrongStreak 2, re-teach at 3. So the round being re-explained was already
    // built one tier down. That ordering is the whole reason the re-teach is not a repeat of the
    // question that beat them.
    let p = initialProgress(3)
    p = step(p, false); expect(p.wrongStreak).toBe(1); expect(p.difficulty).toBe(3)
    p = step(p, false); expect(p.wrongStreak).toBe(2); expect(p.difficulty).toBe(2)   // eased HERE
    p = step(p, false); expect(p.wrongStreak).toBe(3)                                  // re-teach HERE
    expect(p.difficulty).toBe(1)
    expect(p.shouldHint).toBe(true)
  })

  it('the hint scaffold is already up before the re-teach fires', () => {
    let p = initialProgress(2)
    p = step(p, false); p = step(p, false)
    expect(p.shouldHint, 'two misses should already be showing help').toBe(true)
  })
})

// ─── the 9–11 band's re-explanations, DRIVEN (not grepped) ───────────────────────────────

type AnyBeat = string | { say?: string; line?: string; text?: string }
const linesOf = (bs: readonly AnyBeat[]): string[] =>
  bs.map(b => (typeof b === 'string' ? b : (b.say ?? b.line ?? b.text ?? ''))).map(s => s.trim())

/** Every 9–11 module that owns its own maths and its own explanation. `angles` has no
 *  explainBeats — its re-teach is assembled in the chapter and is checked separately below. */
const MODULES: Array<{
  id: string
  make: (d: Difficulty, asked: string[]) => unknown
  explain: (r: never) => readonly AnyBeat[]
}> = [
  { id: 'decimals · cents',            make: (d, a) => cents.makeRound(d, a),     explain: cents.explainBeats as never },
  { id: 'factorsMultiples · factors',  make: (d, a) => factors.makeRound(d, a),   explain: factors.explainBeats as never },
  { id: 'fractionsCompare · pizza',    make: (d, a) => pizza.makeRound(d, a),     explain: pizza.explainBeats as never },
  { id: 'measurementUnits · inches',   make: (d, a) => inches.makeRound(d, a),    explain: inches.explainBeats as never },
  { id: 'wordProblems · words',        make: (d) => words.makeRound(d),           explain: words.explainBeats as never },
  { id: 'areaPerimeter · plotMaths',   make: (d, a) => plotMaths.makeRound(d, a), explain: plotMaths.explainBeats as never },
  { id: 'dataGraphs · cargo',          make: (d, a) => cargo.makeRound(d, a),     explain: cargo.explainBeats as never },
]

describe('③ the 9–11 re-explanations, driven at every tier', () => {
  beforeEach(() => seed(20260820))

  for (const m of MODULES) {
    it(`${m.id}: explains every round it can generate, at every tier`, () => {
      for (const d of TIERS) {
        for (let i = 0; i < 120; i++) {
          const r = m.make(d, []) as never
          const lines = linesOf(m.explain(r))
          expect(lines.length, `${m.id} t${d} draw ${i}: no explanation at all`).toBeGreaterThan(0)
          for (const [j, l] of lines.entries()) {
            expect(l.length, `${m.id} t${d} draw ${i} line ${j} is empty`).toBeGreaterThan(0)
          }
        }
      }
    })

    it(`${m.id}: the explanation is DERIVED from the round, not one fixed script`, () => {
      // A re-teach that says the same words whatever the child missed is a slide, not an
      // explanation — and it is invisible to every other check in the repo.
      const texts = new Set<string>()
      for (const d of TIERS) for (let i = 0; i < 60; i++) {
        texts.add(linesOf(m.explain(m.make(d, []) as never)).join(' | '))
      }
      expect(texts.size, `${m.id}: only ${texts.size} distinct explanation(s) in 180 draws`).toBeGreaterThan(5)
    })

    it(`${m.id}: the tiers really do generate different questions`, () => {
      // If tier 1 and tier 3 draw from the same pool, the adaptive engine is decorative here.
      const sig = (d: Difficulty) => {
        const s = new Set<string>()
        for (let i = 0; i < 200; i++) s.add(JSON.stringify(m.make(d, [])))
        return s
      }
      const [a, c] = [sig(1), sig(3)]
      const shared = [...a].filter(x => c.has(x)).length
      expect(shared / Math.max(a.size, c.size), `${m.id}: tier 1 and tier 3 draw the same questions`).toBeLessThan(0.9)
    })
  }
})

describe('③ The Angle Shop — the one 9–11 chapter whose maths module had no explainBeats', () => {
  beforeEach(() => seed(20260820))

  /** Its makeTask takes a round index as well, so it gets its own block rather than joining MODULES. */
  const draw = (d: Difficulty, i: number) => ANGLE_SHOP_CONFIG.makeTask(d, [])

  it('every task it can generate carries a re-teach the board can show', () => {
    for (const d of TIERS) {
      for (let i = 0; i < 120; i++) {
        const t = draw(d, i)
        expect(t.work.length, `t${d} draw ${i}: an empty re-teach is a blank board`).toBeGreaterThan(0)
        for (const l of t.work) expect(l.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('⚠️ MORE THAN ONE LINE VARIES WITH THE ROUND — it used to be exactly one', () => {
    // Measured 2026-08-20: `work` was `[r.ask, 'Judge it against the square corner.', 'Then set it
    // and see.']`, i.e. the question read back plus two fixed sentences, to a child who had just
    // missed three in a row. It now comes from `angles.explainBeats`, like the other seven chapters.
    const perLine = new Map<number, Set<string>>()
    for (const d of TIERS) for (let i = 0; i < 60; i++) {
      draw(d, i).work.forEach((l, j) => {
        if (!perLine.has(j)) perLine.set(j, new Set())
        perLine.get(j)!.add(l)
      })
    }
    const varying = [...perLine.values()].filter(set => set.size > 1).length
    expect(varying, 'a re-teach whose lines never change is a slide, not an explanation').toBeGreaterThan(1)
  })

  it('the explanation is DERIVED from the round, not one fixed script', () => {
    const texts = new Set<string>()
    for (const d of TIERS) for (let i = 0; i < 60; i++) texts.add(draw(d, i).work.join(' | '))
    expect(texts.size, `only ${texts.size} distinct explanation(s) in 180 draws`).toBeGreaterThan(5)
  })

  it('⚠️ a degrees round never counts PAST its own target', () => {
    // `Count them in 5s: 85, 90, 95… up to 90.` is what a fixed two-steps-then-ellipsis gives on a
    // one-tap gap. `startFor` keeps the gap at START_GAP today, so this is the generator's choice
    // and not explainBeats' guarantee — assert it on the whole reachable lattice, not on draws.
    for (const target of reachable()) {
      for (const start of reachable()) {
        if (start === target) continue
        const r: Round = { type: 'angle', tier: 3, job: 'degrees', want: kindOf(target), target,
          start, job_: WEEK.find(j => j.type === 'angle') as never, ask: '' }
        const line = explainBeats(r).find(l => l.startsWith('Count them in')) as string
        const nums = [...line.matchAll(/\d+/g)].map(m => Number(m[0])).slice(1)   // drop the "5s"
        for (const n of nums) {
          const past = target > start ? n > target : n < target
          expect(past, `start ${start} → ${target}: "${line}" names ${n}`).toBe(false)
        }
        expect(nums[nums.length - 1], `start ${start} → ${target} must END on the target`).toBe(target)
      }
    }
  })

  it('⚠️ every FOLD_WHERE sentence agrees with SHAPE_LINES', () => {
    // The same rule `PAPER` carries: a sentence describing three lines beside a shape that has four
    // is the words-disagreeing-with-the-picture fault, in the place written to clear it up.
    // ⚠️ CHECK THE COUNTING PHRASES, NOT EVERY NUMBER WORD. The isosceles line says "the two
    // matching SIDES" and "the third SIDE", both true and neither a line count — a blunt
    // any-number-word sweep flags it and then needs per-shape exemptions, which rot.
    const WORD: Record<number, string> = { 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six' }
    for (const shape of Object.keys(SHAPE_LINES) as Array<keyof typeof SHAPE_LINES>) {
      const n = SHAPE_LINES[shape]
      const said = FOLD_WHERE[shape].toLowerCase()
      expect(said.length, `${shape}: a one-clause sentence explains nothing`).toBeGreaterThan(20)
      const claims = [
        ...said.matchAll(/\b(one|two|three|four|five|six)\s+lines?\b/g),
        ...said.matchAll(/\b(one|two|three|four|five|six)\s+in all\b/g),
      ].map(m => m[1])
      for (const c of claims) {
        expect(c, `${shape} has ${n} lines but its sentence claims "${c}": ${FOLD_WHERE[shape]}`).toBe(WORD[n])
      }
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
// ④ WHAT ELSE BELONGS BESIDE THOSE
// ─────────────────────────────────────────────────────────────────────────────────────────

describe('④ mastery must not be a way out of the hardest thing the chapter teaches', () => {
  it('a perfect run masters in exactly MASTERY_STREAK questions', () => {
    const { tiers } = served(Array(30).fill(true))
    expect(tiers.length).toBe(MASTERY_STREAK)
  })

  it('both shells withhold the early exit until every declared coverage member has been asked', () => {
    // Six right in a row ends a chapter. A closed set (four readings, six colours) must not be
    // escapable by being good at the ones that happened to come up first.
    expect(STORY_SRC).toMatch(/const covered = !beat\.coverage \|\| beat\.coverage\.all\.every/)
    expect(STORY_SRC).toMatch(/res\.mastered && covered/)
    expect(SHELL_SRC).toMatch(/res\.mastered && covered\(\)/)
  })

  it('the coverage bookkeeping is fed back into the generator, not just used as a gate', () => {
    // The list the gate needs IS the input the generator needs — declaring coverage and then not
    // passing `asked` to make() relocates the bug and makes it permanent.
    expect(STORY_SRC).toMatch(/beat\.make\(adaRef\.current\.difficulty, roundIdx, asked\.current\)/)
    expect(SHELL_SRC).toMatch(/config\.makeTask\(d, asked\.current\)/)
  })
})


// ─────────────────────────────────────────────────────────────────────────────────────────
// ⑤ STARS AND THE TOP TIER — three stars must mean the hard questions were met
// ─────────────────────────────────────────────────────────────────────────────────────────

/** One whole run, the way a shell plays it, reporting what the child was actually asked. */
function fullRun(answers: readonly boolean[], start: Difficulty) {
  let p: Progress = initialProgress(start)
  let correctAtTop = 0
  let mastered = false
  for (const a of answers) {
    if (p.difficulty === 3 && a) correctAtTop++
    p = step(p, a)
    if (isMastered(p)) { mastered = true; break }
  }
  return { ...scoreChapter(p.correct, p.wrong, mastered), correctAtTop, mastered }
}

describe('⑤ three stars is never handed out without the top tier', () => {
  // ⚠️ TRUE TODAY ONLY AS A CONSEQUENCE OF THE CONSTANTS, WHICH IS WHY IT IS GATED.
  // `calcStars` is pure accuracy (>= 85%) and has NO difficulty term in it at all. It happens to
  // be impossible to reach 85% without being promoted to tier 3 along the way — but move the
  // promote rule, the star threshold or the round count and that stops being true silently, and
  // a child would collect three stars for a run of easy questions. Swept exhaustively, not sampled.
  const shape: Array<[number, Difficulty, string]> = [
    [10, 1, '9–11 / storybook · 10 rounds'],
    [8, 1, '12–18 · 8 rounds'],
    [8, 2, '12–18 · 8 rounds, resumed at L2'],
    [8, 3, '12–18 · 8 rounds, resumed at L3'],
  ]
  for (const [n, start, label] of shape) {
    it(`${label}: every 3-star run answered at least one top-tier question`, () => {
      let threeStar = 0
      for (let m = 0; m < (1 << n); m++) {
        const answers = Array.from({ length: n }, (_, i) => !!(m & (1 << i)))
        const r = fullRun(answers, start)
        if (r.stars < 3) continue
        threeStar++
        expect(r.correctAtTop, `3 stars with no correct L3 answer: ${answers.map(a => (a ? '1' : '0')).join('')}`)
          .toBeGreaterThan(0)
      }
      expect(threeStar, 'no 3-star run in the sweep — the sweep is broken').toBeGreaterThan(0)
    })
  }

  it("the founder's case: six straight from easy ends on mastery having met the top tier TWICE", () => {
    // Measured 2026-08-20. Before the stale-tier fix in ① this was ONE, because the promotion
    // landed a question late — so the run that grants full stars met the hardest questions half
    // as often as the round budget promises.
    const r = fullRun(Array(10).fill(true), 1)
    expect(r.mastered).toBe(true)
    expect(r.stars).toBe(3)
    expect(r.correctAtTop).toBe(2)
  })

  it('mastery grants full stars, and mastery cannot happen below the top tier', () => {
    expect(scoreChapter(6, 0, true).stars).toBe(3)
    expect(isMastered({ difficulty: 2, streak: 99 })).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────────────────
// ⑥ WHERE THE TIER IS REMEMBERED, AND WHERE IT IS DELIBERATELY NOT
// ─────────────────────────────────────────────────────────────────────────────────────────

describe('⑥ difficulty memory between sittings', () => {
  it('12–18 saves the tier after every scored answer and resumes there', () => {
    expect(SHELL_SRC).toMatch(/setChapterLevel\(learnerId, config\.chapterId, res\.difficulty\)/)
    expect(SHELL_SRC).toMatch(/resumesTier\(BAND\) \? getChapterLevel\(learnerId, config\.chapterId\) : 1/)
  })

  it('the store round-trips a tier per learner per chapter', () => {
    setChapterLevel('learner-a', 'integers', 3)
    setChapterLevel('learner-b', 'integers', 2)
    expect(getChapterLevel('learner-a', 'integers')).toBe(3)
    expect(getChapterLevel('learner-b', 'integers')).toBe(2)
    expect(getChapterLevel('learner-a', 'percentages'), 'an unplayed chapter starts easy').toBe(1)
  })

  it('⚠️ no learner — the logged-out preview — remembers nothing', () => {
    setChapterLevel(null, 'integers', 3)
    expect(getChapterLevel(null, 'integers')).toBe(1)
  })

  it('⚠️ BOTH engines resume, in every band — the storybook one too', () => {
    // Reversed 2026-08-20 (founder's call): "sab mein waise chahiye". SkillBeat used to call
    // useAdaptive with ONE argument, so all 26 storybook chapters always opened at tier 1.
    expect(STORY_SRC).toMatch(/useAdaptive\(beat\.skillId, startDiff\)/)
    expect(STORY_SRC).toMatch(/getChapterLevel\(learnerId, beat\.skillId\)/)
    expect(STORY_SRC, 'and it saves after every scored answer, not at the end')
      .toMatch(/setChapterLevel\(learnerId, beat\.skillId, res\.difficulty\)/)
    for (const b of ['9-11', '12-14', '15-16', '17-18'] as const) expect(resumesTier(b), b).toBe(true)
  })

  it('a resumed run still climbs from where it restarts', () => {
    // The point of resuming is not to sit at that tier — it is to spend the round budget above it.
    const { tiers } = served(Array(20).fill(true), 2)
    expect(tiers[0]).toBe(2)
    expect(Math.max(...tiers)).toBe(3)
  })

  it('the tier rides along on the finished-session payload, so it follows the child across devices', () => {
    // Was device-local until 2026-08-20: a second device, or a cleared browser, put every chapter
    // back to easy and nothing in the app could tell.
    const sync = readFileSync('src/data/repositories/sessions.ts', 'utf8')
    expect(sync).toMatch(/p_difficulty:\s+payload\.difficulty \?\? 1/)
    const finish = readFileSync('src/data/supabase/useChapterSync.ts', 'utf8')
    expect(finish).toMatch(/difficulty:\s+getChapterLevel\(learner\.id, chapter\)/)
    const menu = readFileSync('src/app/menu/page.tsx', 'utf8')
    expect(menu, 'and it is seeded back on sign-in').toMatch(/hydrateChapterLevels\(learner\.id, progress\)/)
  })

  it('⚠️ hydration NEVER overwrites a tier this device already holds', () => {
    // A device that has played the chapter holds the fresher answer — including a demotion made
    // here while offline, which is the half of adaptive a "take the higher one" merge throws away.
    setChapterLevel('learner-c', 'integers', 1)
    hydrateChapterLevels('learner-c', [{ chapter: 'integers', current_level: 3 }])
    expect(getChapterLevel('learner-c', 'integers'), 'a local demotion must survive').toBe(1)

    // …but a device that has never played it takes the server's tier, which is the whole point.
    hydrateChapterLevels('learner-c', [{ chapter: 'percentages', current_level: 3 }])
    expect(getChapterLevel('learner-c', 'percentages')).toBe(3)
  })

  it('hydration ignores the rows that carry nothing to say', () => {
    hydrateChapterLevels('learner-d', [
      { chapter: 'integers', current_level: 1 },       // the column default
      { chapter: 'percentages', current_level: null }, // never written
      { chapter: 'ratioProportion' },                  // an older row shape
    ])
    for (const c of ['integers', 'percentages', 'ratioProportion'] as const) {
      expect(getChapterLevel('learner-d', c), c).toBe(1)
    }
    expect(hydrateChapterLevels(null, [{ chapter: 'integers', current_level: 3 }])).toBeUndefined()
  })

  it('the migration reuses the column that was already there, and does not add one', () => {
    // `learner_progress.current_level` has existed since the base schema, written by nothing and
    // read by nothing (every other current_level in the app is learner_stats' XP level). Measured
    // on prod 2026-08-20: 29 rows, all 1.
    // ⚠️ 20260820111858, not 20260820120000: this migration was applied to production
    // out-of-band under a different version, and the repo file was renamed to match rather
    // than rewriting the production ledger. See docs/schema-baseline-debt.md.
    const mig = readFileSync('supabase/migrations/20260820111858_sync_session_difficulty.sql', 'utf8')
    expect(mig, 'no new column').not.toMatch(/ADD COLUMN/i)
    expect(mig, 'the old arity survives as a forwarder so a stale bundle keeps syncing')
      .toMatch(/SELECT public\.sync_session\(p_learner_id/)
    expect(mig, 'a demotion must not be lost to a monotonic merge').toMatch(/current_level\s+= v_difficulty/)
    expect(mig).not.toMatch(/current_level\s*=\s*GREATEST/)
  })
})

describe('④ the loop cannot be corrupted by a fast second tap', () => {
  it('two answers in one tick both apply, in order', () => {
    // useAdaptive drives everything off a ref for this reason; the engine itself must be pure
    // enough that two applications in a row are just two steps.
    let p = initialProgress(1)
    p = step(step(p, true), true)
    expect(p.correct).toBe(2); expect(p.streak).toBe(2)
  })

  it('the shell mirrors the tally in state AND passes the fresh values forward', () => {
    // `c`/`w` are computed locally and handed to loadTask rather than read back out of state,
    // which is what stops a batched pair scoring one answer twice.
    expect(SHELL_SRC).toMatch(/loadTask\(idx \+ 1, c, wrong, res\.mastered && covered\(\)\)/)
  })
})
