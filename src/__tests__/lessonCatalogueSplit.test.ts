/**
 * PERF-01 (docs/review/PERFORMANCE.md): a child's screen must not download all 36 modules of lessons before it can paint.
 * On 2026-09-26 /lesson, /practice and /modules each carried ~800 KB gzip of lesson content and ladders in their
 * first-load JS (lesson LCP ~10.8 s on a mid-range phone on Slow 4G). Now they eagerly load only the light catalogue
 * (./catalogue.json) and fetch ONE module with import() (features/lessons/catalogue.ts).
 *
 * What this checks, and no more:
 *  1. The STATIC import graph of those three routes (and the root layout) reaches no lesson-content or ladder file.
 *     First-load JS is exactly that graph — an import() is its own chunk. Type-only imports are erased and are skipped.
 *     Positive control: the same walker, from /parent (which keeps the full catalogue), DOES reach g8m4's lessons.
 *  2. catalogue.json says what the lessons say (ids, order, titles, first picture object), module by module.
 *  3. loadModule(id) gives every module exactly the lessons and ladders the full catalogue has.
 * The build-output side (a g8m4 sentence absent from /lesson's first-load chunks) is measured in the PR, not here.
 */
import { describe, it, expect, vi } from 'vitest'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import ts from 'typescript'

const ROOT = resolve(__dirname, '../..')
/** A file that holds lesson bodies or ladders: one of these in a child route's static graph is the whole defect. */
const HEAVY = /^src\/features\/lessons\/(modules\.ts|grade3Module1\.ts|content\/|ladders\/)/

function resolveSpec(from: string, spec: string): string | null {
  const base = spec.startsWith('@/') ? resolve(ROOT, 'src', spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null
  if (!base) return null   // a package
  for (const f of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) if (existsSync(f) && statSync(f).isFile()) return f
  throw new Error(`cannot resolve ${spec} from ${relative(ROOT, from)}`)   // could not look ≠ found nothing
}

/** Every file reachable by static, non-type imports from `entry` → the file that first imported it. */
function staticGraph(entry: string): Map<string, string> {
  const seen = new Map<string, string>([[entry, '']]), todo = [entry]
  while (todo.length) {
    const file = todo.pop()!
    if (!/\.tsx?$/.test(file)) continue
    const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, false, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
    for (const st of src.statements) {
      let spec: string | undefined
      if (ts.isImportDeclaration(st)) {
        const c = st.importClause
        const typeOnly = c && (c.isTypeOnly || (!c.name && c.namedBindings && ts.isNamedImports(c.namedBindings)
          && c.namedBindings.elements.length > 0 && c.namedBindings.elements.every(e => e.isTypeOnly)))
        if (!typeOnly) spec = (st.moduleSpecifier as ts.StringLiteral).text
      } else if (ts.isExportDeclaration(st) && st.moduleSpecifier && !st.isTypeOnly) spec = (st.moduleSpecifier as ts.StringLiteral).text
      if (!spec) continue
      const to = resolveSpec(file, spec)
      if (to && !seen.has(to)) { seen.set(to, file); todo.push(to) }
    }
  }
  return seen
}
const rel = (f: string) => relative(ROOT, f)
const chain = (g: Map<string, string>, f: string): string => { const out = [rel(f)]; for (let p = g.get(f); p; p = g.get(p)) out.push(rel(p)); return out.reverse().join(' → ') }

describe('PERF-01: the child screens load one module, not all 36', () => {
  const CHILD_ROUTES = ['src/app/lesson/page.tsx', 'src/app/practice/page.tsx', 'src/app/modules/page.tsx', 'src/app/layout.tsx']

  it('positive control: the walker sees lesson content where it IS eagerly imported (/parent)', () => {
    const g = staticGraph(resolve(ROOT, 'src/app/parent/page.tsx'))
    const files = [...g.keys()].map(rel)
    expect(files).toContain('src/features/lessons/content/g8m4.ts')
    expect(files).toContain('src/features/lessons/ladders/g8m4.ts')
  })

  for (const route of CHILD_ROUTES) {
    it(`${route}'s static graph reaches no lesson content or ladder file`, () => {
      const g = staticGraph(resolve(ROOT, route))
      // The walk went somewhere: a blind walk and a clean route must not look alike.
      if (route !== 'src/app/layout.tsx') expect([...g.keys()].map(rel)).toContain('src/features/lessons/catalogue.ts')
      const heavy = [...g.keys()].filter(f => HEAVY.test(rel(f))).map(f => chain(g, f))
      expect(heavy).toEqual([])
    })
  }
})

describe('PERF-01: the light catalogue and the loader agree with the full lessons', () => {
  it('catalogue.json lists every module and topic as the lessons do', async () => {
    const { MODULES } = await import('@/features/lessons/modules')
    const json = JSON.parse(readFileSync(resolve(ROOT, 'src/features/lessons/catalogue.json'), 'utf8'))
    const want = MODULES.map(m => ({
      id: m.id, grade: m.grade, n: m.n, title: m.title,
      lessons: m.lessons.map(l => {
        const obj = (l.screens[0]?.pictures.find(p => 'obj' in p) as { obj: string } | undefined)?.obj
        return obj ? { id: l.id, title: l.title, obj } : { id: l.id, title: l.title }
      }),
    }))
    expect(want.length).toBe(36)
    expect(json, 'stale: run `npx tsx scripts/lesson-catalogue.mts > src/features/lessons/catalogue.json`').toEqual(want)
  })

  it("the home's \"N mixed problems\" (now the topic count) is what mixedPractice gives, whole module or a chosen few", async () => {
    const { MODULES, mixedPractice } = await import('@/features/lessons/modules')
    for (const m of MODULES) {
      expect(mixedPractice(m).length).toBe(m.lessons.length)
      const few = { ...m, lessons: m.lessons.filter((_, i) => i % 3 === 1) }
      expect(mixedPractice(few).length).toBe(few.lessons.length)
    }
  })

  it('loadModule gives each module the same lessons and ladders as the full catalogue', async () => {
    vi.resetModules()
    // The catalogue ALONE first: nothing may be registered before a module is loaded, or this test measures the cache.
    const cat = await import('@/features/lessons/catalogue')
    expect(cat.ladderOf('g5m1-t1')).toBeUndefined()
    expect(cat.loadedLesson('g8m4-t1')).toBeUndefined()
    const loaded = new Map<string, Awaited<ReturnType<typeof cat.loadModule>>>(), ladders = new Map<string, unknown>()
    for (const m of cat.CATALOGUE) {
      const got = await cat.loadModule(m.id)
      loaded.set(m.id, got)
      for (const l of got?.lessons ?? []) ladders.set(l.id, cat.ladderOf(l.id))
    }
    expect(await cat.loadModule('g9m1')).toBeUndefined()
    // Now the full catalogue (same module instances, same content files).
    const { MODULES } = await import('@/features/lessons/modules')
    const { LADDERS } = await import('@/features/lessons/ladders')
    for (const m of MODULES) {
      const got = loaded.get(m.id)!
      expect({ id: got.id, grade: got.grade, n: got.n, title: got.title }).toEqual({ id: m.id, grade: m.grade, n: m.n, title: m.title })
      expect(got.lessons, m.id).toBe(m.lessons)
      for (const l of m.lessons) expect(ladders.get(l.id), l.id).toBe(LADDERS[l.id])
    }
    expect([...ladders.values()].filter(Boolean).length).toBe(Object.keys(LADDERS).length)
  })
})
