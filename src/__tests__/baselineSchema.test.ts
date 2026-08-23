import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * ⚠️⚠️ WHICH OBJECTS `baseline_schema.sql` MAY CREATE IS DERIVED HERE, NOT HARD-CODED —
 * because I hard-coded it twice and was wrong both times, in opposite directions.
 *
 * The baseline exists because seven base tables were made in the Supabase dashboard and are in
 * ZERO migrations, so no database can be built from source without it. CI applies it, then all
 * 68 migrations, to a throwaway local Postgres. The two halves must not fight, and the rule is
 * per-object and ORDER-DEPENDENT:
 *
 *   · A policy a migration creates with a BARE `create policy` must NOT be in the baseline.
 *     CREATE POLICY has no IF NOT EXISTS, so the migration dies with 42710. (Run 1 died on
 *     `policy "learner_state: parent access" ... already exists`.)
 *   · A policy a migration ALTERs but never creates MUST be in the baseline, or the ALTER dies
 *     with 42704 `does not exist`. (Run 3 died on `alter policy "learner_access: insert"` after
 *     I over-corrected and stripped 21 policies instead of 2.)
 *   · A policy a migration drop-then-creates is safe either way.
 *
 * Deriving it means the answer stays right when someone adds a migration — a hard-coded list
 * would silently rot into the same two failures.
 */
const ROOT = join(__dirname, '../..')
const baselinePath = join(ROOT, 'supabase/schema/baseline_schema.sql')
const migDir = join(ROOT, 'supabase/migrations')

const baseline = readFileSync(baselinePath, 'utf8')
const migFiles = readdirSync(migDir).filter(f => f.endsWith('.sql')).sort()

/** `create|alter|drop policy [if exists] "name"|name` at the head of a statement. */
const POLICY = /^[ \t]*(create|alter|drop) policy (?:if exists )?(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/gim

type Touch = { kind: 'create' | 'alter' | 'drop'; name: string }
const migrationTouches: Touch[] = migFiles.flatMap(f => {
  const sql = readFileSync(join(migDir, f), 'utf8')
  return [...sql.matchAll(POLICY)].map(m => ({
    kind: m[1].toLowerCase() as Touch['kind'],
    name: (m[2] ?? m[3]) as string,
  }))
})

const baselinePolicies = new Set(
  [...baseline.matchAll(/^create policy (?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/gm)].map(m => (m[1] ?? m[2]) as string),
)

/** In migration order: what happens to this policy first, ignoring drops (which make a later create safe). */
function verdict(name: string): 'must-not' | 'must' | 'either' {
  let dropped = false
  for (const t of migrationTouches) {
    if (t.name !== name) continue
    if (t.kind === 'drop') { dropped = true; continue }
    if (t.kind === 'alter') return 'must'
    return dropped ? 'either' : 'must-not'   // bare create
  }
  return 'must'                               // only ever dropped, or never mentioned
}

const allNames = [...new Set([...migrationTouches.map(t => t.name), ...baselinePolicies])]

describe('baseline_schema.sql vs supabase/migrations', () => {
  it('omits every policy a migration creates with a bare CREATE (else 42710 kills the replay)', () => {
    const wrong = allNames.filter(n => verdict(n) === 'must-not' && baselinePolicies.has(n))
    expect(wrong, `CREATE POLICY has no IF NOT EXISTS — remove these from the baseline:\n  ${wrong.join('\n  ')}`).toEqual([])
  })

  it('contains every policy a migration ALTERs but never creates (else 42704 kills the replay)', () => {
    const missing = allNames.filter(n => verdict(n) === 'must' && !baselinePolicies.has(n))
    expect(missing, `a migration ALTERs these and nothing creates them — the baseline must:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('omits every index a migration creates unguarded', () => {
    const unguarded = new Set(migFiles.flatMap(f =>
      [...readFileSync(join(migDir, f), 'utf8').matchAll(/^[ \t]*create (?:unique )?index (?!if not exists)([A-Za-z_][A-Za-z0-9_]*)/gim)].map(m => m[1])))
    const inBaseline = [...baseline.matchAll(/^create (?:unique )?index (?:if not exists )?([A-Za-z_][A-Za-z0-9_]*)/gm)].map(m => m[1])
    const clash = inBaseline.filter(n => unguarded.has(n))
    expect(clash, `created unguarded by a migration, so must not be in the baseline:\n  ${clash.join('\n  ')}`).toEqual([])
  })

  it('omits every constraint a migration adds with a bare ADD CONSTRAINT', () => {
    // ⚠️ Third object type with no IF NOT EXISTS, found the same way as the other two: run 4
    // died on `add constraint sessions_chapter_fkey` in 20260616093000_chapters_as_data.sql.
    // The baseline wraps its own adds in an exception handler, which protects THIS file and
    // does nothing at all for the migrations that run after it.
    // Three forms are safe and must not be flagged:
    //   · the migration drops the constraint first;
    //   · the add sits inside an `if not exists (select 1 from pg_constraint where conname = …)`
    //     guard, which 20260616090000 uses and no regex over the ADD alone can see;
    //   · (a later migration re-adding one it just dropped is the first case again.)
    const sources = migFiles.map(f => readFileSync(join(migDir, f), 'utf8'))
    const all = sources.join('\n')
    const dropped = new Set([...all.matchAll(/drop constraint (?:if exists )?([a-z_][a-z0-9_]*)/gi)].map(m => m[1]))
    const guarded = new Set([...all.matchAll(/conname\s*=\s*'([a-z_][a-z0-9_]*)'/gi)].map(m => m[1]))
    const bare = new Set(
      [...all.matchAll(/add constraint ([a-z_][a-z0-9_]*)/gi)]
        .map(m => m[1])
        .filter(n => !dropped.has(n) && !guarded.has(n)),
    )
    const inBaseline = [...baseline.matchAll(/add constraint ([a-z_][a-z0-9_]*)/g)].map(m => m[1])
    const clash = [...new Set(inBaseline.filter(n => bare.has(n)))]
    expect(clash, `added with a bare ADD CONSTRAINT by a migration, so must not be in the baseline:\n  ${clash.join('\n  ')}`).toEqual([])
  })

  it('still creates the seven tables no migration creates — the whole reason it exists', () => {
    // ⚠️ The mirror risk: someone "fixes" a future collision by deleting from the baseline until
    // CI goes green having built a database with no learners table in it.
    const allMigrations = migFiles.map(f => readFileSync(join(migDir, f), 'utf8')).join('\n')
    for (const t of ['profiles', 'learners', 'learner_access', 'learner_invites',
                     'sessions', 'learner_progress', 'learner_stats']) {
      expect(new RegExp(`create table if not exists public\\.${t}\\b`).test(baseline), `baseline no longer creates public.${t}`).toBe(true)
      expect(new RegExp(`create table (if not exists )?public\\.${t}\\b`).test(allMigrations), `public.${t} is now created by a migration — re-check whether the baseline still needs it`).toBe(false)
    }
  })

  it('carries every column a migration drops — the baseline is migration-ZERO, not today', () => {
    // ⚠️ The subtlest failure of the five. The baseline is generated from TODAY'S production
    // catalog, but the migrations replay HISTORY: 20260704120000 redefines sync_session against
    // learner_stats.current_streak/longest_streak and 20260704120100 drops them; 20260817174352
    // drops learners.date_of_birth. Generated from today they are absent and the replay dies on
    // `ALTER COLUMN current_streak SET DEFAULT 0`. They must be present and are dropped again by
    // those same migrations, so the end state still equals production.
    const all = migFiles.map(f => readFileSync(join(migDir, f), 'utf8')).join('\n')
    const droppedCols = [...new Set(
      [...all.matchAll(/drop column (?:if exists )?([a-z_][a-z0-9_]*)/gi)].map(m => m[1].toLowerCase()),
    )]
    expect(droppedCols.length, 'no dropped columns found — the regex has rotted').toBeGreaterThan(0)
    const missing = droppedCols.filter(c => !new RegExp(`^\\s*${c}\\s`, 'mi').test(baseline))
    expect(missing, `a migration drops these, so the baseline must create them first:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('is never committed into supabase/migrations/', () => {
    // CI stages it as 00000000000000_baseline.sql on a throwaway runner. Committed, it would be
    // a backdated migration that `supabase db push` applies to PRODUCTION.
    expect(readdirSync(migDir)).not.toContain('00000000000000_baseline.sql')
  })
})
