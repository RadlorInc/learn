import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * ⚠️ `next/image` LAZY-LOADS BY DEFAULT, AND A BACKDROP IS THE LCP ELEMENT — so migrating a raw
 * `<img>` (which is EAGER when it carries no `loading` attribute) to `<SceneBg>` makes first paint
 * WORSE unless the visible one is marked `priority`. I shipped exactly that on five chapters during
 * the migration and only caught it by watching a chapter open with a bare gradient where the painted
 * scene should be. Nothing else can see it: the bytes are smaller, the DOM is correct, every test
 * was green, and a screenshot taken a moment later looks perfect.
 *
 * So the rule is structural rather than visual: EVERY `<SceneBg>` in a chapter names `priority`
 * one way or the other. Most are inside a cross-fade stack, where the honest value is the same
 * condition the opacity is keyed on (`priority={s === scene}`) — the shown one eager, the ones
 * waiting to be faded to lazy. A bare `priority` is right for a chapter with a single backdrop.
 *
 * This deliberately does NOT try to check that the condition MATCHES the opacity — a regex cannot
 * read that, and a check that pretends to is worse than none. It catches the thing that actually
 * happened: a call site with no opinion at all, which silently means lazy.
 */
const CHAPTERS = join(process.cwd(), 'src/features/chapters')

/** Thumbnails in a picker grid, where lazy is the correct answer — the child has not chosen yet and
 *  none of them is the LCP element. Named individually so a new exemption has to be argued for. */
const LAZY_BY_DESIGN = new Set(['WorldSelect.tsx'])

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? tsxFiles(join(dir, e.name)) : e.name.endsWith('.tsx') ? [join(dir, e.name)] : [],
  )
}

describe('SceneBg', () => {
  const sites = tsxFiles(CHAPTERS).flatMap(path => {
    const src = readFileSync(path, 'utf8')
    const file = path.split('/').pop()!
    // Each opening tag up to its closing `/>` — the props of one call site.
    return [...src.matchAll(/<SceneBg\b[\s\S]*?\/>/g)].map(m => ({ file, path, tag: m[0] }))
  })

  it('is actually in use — a gate over nothing proves nothing', () => {
    expect(sites.length).toBeGreaterThan(25)
  })

  it('every chapter backdrop states its loading priority', () => {
    const silent = sites
      .filter(s => !LAZY_BY_DESIGN.has(s.file))
      .filter(s => !/\bpriority\b/.test(s.tag))
      .map(s => `${s.file}: ${s.tag.replace(/\s+/g, ' ').slice(0, 90)}`)
    expect(silent, 'these <SceneBg> sites lazy-load the LCP element').toEqual([])
  })

  it('the raw full-bleed <img> idiom it replaced is gone from the chapters', () => {
    // ⚠️ ANCHORED ON `inset: 0` AND ALLOWED TO CROSS LINES. Written as `<img[^>]*objectFit` it
    // matched NOTHING — a multi-line style object contains `>` in its arrow functions and the class
    // is spread over four lines — so the check reported a clean sweep while a raw backdrop was still
    // there. It is the repo's own "a green check is not evidence until you have watched it go red".
    const idiom = /<img[\s\S]{0,400}?inset: 0, width: '100%', height: '100%', objectFit: 'cover'/
    const left = tsxFiles(CHAPTERS)
      .filter(p => idiom.test(readFileSync(p, 'utf8')))
      .map(p => p.split('/').pop()!)
      .sort()
    // Deliberately `<img` and not `<motion.img`: GearLab's remaining one is a `motion.img` sized to
    // a PANEL with a borderRadius, i.e. a tile in the machine rather than the scene behind it. It is
    // not what this rule is about and would be wrong to convert.
    expect(left).toEqual([])
  })
})
