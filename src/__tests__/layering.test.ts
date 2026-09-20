/**
 * The three layering rules that were actually broken, gated so they cannot come back.
 *
 * `src/core` is the pure domain: chapter registry, progression, scoring, levelling, the skill
 * graph. Nothing in it may reach outward, and nothing in it may import a renderer. Both halves
 * were broken by the same now-deleted file, `core/adaptive.ts`: it imported `ChapterType` from
 * `@/state/store` — a cycle (core → state → core) that meant a module wanting a chapter id
 * transitively pulled in zustand, its persist middleware, the IndexedDB kv adapter and a Supabase
 * session helper — and it imported React, since it was a hook living in the domain folder. It has
 * since been split: the pure half is `core/progression.ts`, the hook is `shared/hooks/useAdaptive.ts`.
 *
 * The cause was not that one import, it was the BARREL: `state/store.ts` re-exported `ChapterType`,
 * `CHAPTER_*` and the levelling functions "so existing `@/state/store` imports keep working" — a
 * migration shim left behind when the chapter registry moved into `core/`. A shim like that is
 * invisible in review (the import line looks ordinary) and re-forms the moment someone adds the
 * next convenience re-export, so the barrel is gated, not just the import that exposed it.
 *
 * ⚠️⚠️ THERE WERE THREE RULES; THE THIRD WENT ON 2026-09-20 WITH ITS SUBJECT. It read
 * `state/store.ts` and failed if that file re-exported anything from `@/core` — the migration shim
 * described above. `src/state/` was deleted when the chapters moved onto the same records as the
 * new-flow lessons, so the rule had nothing to read.
 *
 * ⚠️ AND IT WAS NOT REPLACED WITH A WIDER SWEEP, DELIBERATELY. "No module anywhere re-exports
 * `@/core`" was written, run, and came back RED on three innocent files — a type-only re-export in
 * `data/supabase/types.ts` (erased at compile time) among them. A gate that fires on correct code
 * is spent exactly like one that never fires; the harm in the original was a HEAVY module (zustand
 * + IndexedDB + a Supabase helper) standing in front of pure domain, not the re-export itself, and
 * that predicate is not worth the check it would need. **The class is recorded here instead: if a
 * module with real runtime dependencies starts re-exporting `@/core`, that is the shim coming back.**
 *
 * The two that remain pass by construction. Mutate either — point an import back at a non-`core`
 * layer from `core/`, or move a hook into `core/` — and the matching test fails.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(__dirname, '..')

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return filesUnder(path)
    return /\.tsx?$/.test(name) ? [path] : []
  })
}

/** Every `@/<layer>` an alias-import in this file points at. */
function layersImportedBy(path: string): string[] {
  const src = readFileSync(path, 'utf8')
  return [...src.matchAll(/from\s+'@\/([a-zA-Z]+)/g)].map(m => m[1])
}

describe('layering', () => {
  it('core/ is pure domain — it imports from core/ and nothing else', () => {
    const violations = filesUnder(join(SRC, 'core')).flatMap(path =>
      layersImportedBy(path)
        .filter(layer => layer !== 'core')
        .map(layer => `${path.slice(SRC.length + 1)} imports @/${layer}`),
    )
    expect(violations).toEqual([])
  })

  it('core/ is framework-free — no React, so the domain is testable without a renderer', () => {
    const violations = filesUnder(join(SRC, 'core'))
      .filter(path => /from\s+'react'|from\s+"react"/.test(readFileSync(path, 'utf8')))
      .map(path => `${path.slice(SRC.length + 1)} imports react`)
    expect(violations).toEqual([])
  })

})
