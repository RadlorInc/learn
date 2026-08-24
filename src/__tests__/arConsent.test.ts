import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { AR_CHAPTERS, isArChapter, demoEligible } from '@/core/arChapters'

/**
 * ⚠️⚠️ A COPPA GUARD, GATED BY DERIVATION RATHER THAN BY A LIST SOMEBODY REMEMBERED TO UPDATE.
 *
 * `AR_CHAPTERS` has to be a typed constant — a runtime derivation would have to import the game
 * module to read its `hand:` block, which is the very module the guard exists to avoid loading. So
 * the truth is rebuilt HERE from the registry and the game sources, and the two must agree in BOTH
 * directions: a ninth camera chapter cannot be added without this list learning about it, and an id
 * cannot be quietly dropped from it either.
 *
 * The behavioural half is `e2e/ar-consent.spec.ts`, which drives the exact shipping URL —
 * `/teen-preview?c=<id>&taste=1`, logged out — and asserts `getUserMedia` is never called. This file
 * is what notices the guard being removed from a route; that one is what notices it not working.
 */
const ROOT = join(__dirname, '../..')
const registry = readFileSync(join(ROOT, 'src/features/chapters/registry.tsx'), 'utf8')

/** chapter id → the basename of the game module the registry lazily imports for it. */
function idByModule(): Record<string, string> {
  const out: Record<string, string> = {}
  const heads = [...registry.matchAll(/^ {2}([a-zA-Z][a-zA-Z0-9]*): (?:teen|story)\(/gm)]
  heads.forEach((m, i) => {
    const body = registry.slice(m.index!, heads[i + 1]?.index ?? registry.length)
    const imp = body.match(/import\("([^"]+)"\)/)
    if (imp) out[imp[1].split('/').pop()!] = m[1]
  })
  return out
}

/**
 * ⚠️ DERIVED FROM THE FILES, THEN MAPPED TO IDS — not the other way round. Walking the registry and
 * asking "does this one use a hand?" is circular: if the registry parse silently misses an entry,
 * that chapter is simply absent and the check goes green having examined less than it thought.
 * Starting from every game file that declares a hand reading means a parse that misses one produces
 * an AR file with NO id, which is a loud failure rather than a quiet omission.
 */
function derivedArChapters(): string[] {
  const dir = join(ROOT, 'src/features/chapters/teen/games')
  const byModule = idByModule()
  const ar: string[] = []
  const unmapped: string[] = []
  for (const f of readdirSync(dir).filter(f => f.endsWith('.tsx'))) {
    const src = readFileSync(join(dir, f), 'utf8')
    // Anchored on the real GameConfig field — two spaces of indent, with a `reads:` inside — so a
    // comment discussing hands, or an `onHand:` prop, cannot trip it.
    if (!/^\s{2}hand: \{[^}]*?reads: '/m.test(src)) continue
    const id = byModule[f.replace(/\.tsx$/, '')]
    if (id) ar.push(id); else unmapped.push(f)
  }
  expect(unmapped, `these games use the camera and the registry parse could not name them:\n  ${unmapped.join('\n  ')}`).toEqual([])
  return ar.sort()
}

describe('AR_CHAPTERS is derived, not remembered', () => {
  it('matches the chapters whose game declares a hand reading — in both directions', () => {
    const derived = derivedArChapters()
    expect(derived.length, 'no AR chapters found — the detector has rotted, and a rotted detector says "all clear"')
      .toBeGreaterThan(0)
    expect(derived).toEqual([...AR_CHAPTERS].sort())
  })

  it('never marks a camera chapter demo-eligible', () => {
    // The founder's instruction, as an assertion: a chapter that uses the camera can never be shown
    // to a visitor with no account, whatever else changes.
    for (const id of AR_CHAPTERS) {
      expect(isArChapter(id), `${id} stopped being recognised as a camera chapter`).toBe(true)
      expect(demoEligible(id), `${id} is demo-eligible and uses the camera`).toBe(false)
    }
  })

  it('still allows something — a guard that blocks everything is not a guard', () => {
    expect(demoEligible('wordProblems')).toBe(true)
    expect(demoEligible('counting')).toBe(true)
  })
})

describe('every route that renders a chapter by id asks first', () => {
  it('consults the consent gate, or is already behind a chosen learner', () => {
    // ⚠️ GENERAL, not a check on the one route we fixed. The leak was a route nobody thought of as a
    // production surface; the next one will be too. A page that turns a URL into a chapter must
    // either run the gate or already be behind an active learner (which requires a signed-in parent).
    const pages: string[] = []
    const walk = (dir: string) => {
      for (const name of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, name.name)
        if (name.isDirectory()) walk(p)
        else if (name.name === 'page.tsx') pages.push(p)
      }
    }
    walk(join(ROOT, 'src/app'))
    expect(pages.length, 'no pages found — the walk has rotted').toBeGreaterThan(5)

    const offenders = pages.filter(p => {
      const src = readFileSync(p, 'utf8')
      if (!/CHAPTER_COMPONENTS\[/.test(src)) return false
      return !/useChapterAccess\(/.test(src) && !/getActiveLearner\(/.test(src)
    }).map(p => p.slice(ROOT.length + 1))
    expect(offenders, `these render a chapter from a URL with no consent check:\n  ${offenders.join('\n  ')}`).toEqual([])
  })

  it("the diagnostic's logged-out taste link picks a demo-eligible chapter", () => {
    // The other half of the fix: the guard refuses the render, and this stops us walking a parent
    // into a wall we put there. Anchored on the real call, not on prose.
    const src = readFileSync(join(ROOT, 'src/app/diagnostic/page.tsx'), 'utf8')
    expect(src).toMatch(/chs\.find\(demoEligible\)/)
    expect(src).toMatch(/from '@\/core\/arChapters'/)
  })
})
