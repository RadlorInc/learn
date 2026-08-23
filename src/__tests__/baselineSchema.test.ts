import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * ⚠️ THE BASELINE AND THE MIGRATIONS MUST NOT BOTH CREATE THE SAME OBJECT.
 *
 * `supabase/schema/baseline_schema.sql` exists because seven base tables were created in the
 * Supabase dashboard and appear in ZERO migrations, so no database can be built from source
 * without it — which is why the RLS regression suite had never run anywhere but production.
 *
 * CI applies the baseline, then all 67 migrations, to a throwaway local Postgres. That only
 * works if the two halves do not collide, and the rule is NOT "the baseline is a full dump":
 *
 *   · create table / create index / create trigger are IF NOT EXISTS or drop-then-create
 *     everywhere here, so duplicating them is a harmless no-op.
 *   · CREATE POLICY has no IF NOT EXISTS in any version of Postgres. A policy created by both
 *     halves fails the migration with 42710 and takes the whole run with it. That is exactly
 *     how this was found — the first pipeline run died on
 *     `policy "learner_state: parent access" for table "learner_state" already exists`.
 *   · Three indexes are created unguarded by migrations and hit the same wall.
 *
 * A source check is the right instrument here and not a lazy one: the failure is a property of
 * two FILES, and the only way to observe it otherwise is a full CI run with a Docker Postgres.
 * This turns a six-minute red pipeline into a millisecond.
 */
const ROOT = join(__dirname, '../..')
const baseline = readFileSync(join(ROOT, 'supabase/schema/baseline_schema.sql'), 'utf8')
const migrations = readdirSync(join(ROOT, 'supabase/migrations'))
  .filter(f => f.endsWith('.sql'))
  .map(f => readFileSync(join(ROOT, 'supabase/migrations', f), 'utf8'))
  .join('\n')

/** Statement-leading `create policy <name>` only — never a mention inside a comment. */
const policyNames = (sql: string): string[] =>
  [...sql.matchAll(/^\s*create policy (?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/gm)]
    .map(m => m[1] ?? m[2])

/** `create index foo on` WITHOUT `if not exists` — the form that cannot be applied twice. */
const unguardedIndexNames = (sql: string): string[] =>
  [...sql.matchAll(/^\s*create (?:unique )?index (?!if not exists)([A-Za-z_][A-Za-z0-9_]*)/gm)]
    .map(m => m[1])

describe('baseline_schema.sql vs supabase/migrations', () => {
  it('creates no policy that a migration also creates', () => {
    const owned = new Set(policyNames(migrations))
    const clash = policyNames(baseline).filter(n => owned.has(n))
    expect(clash, `CREATE POLICY has no IF NOT EXISTS — these would fail the migration run with 42710:\n  ${clash.join('\n  ')}`).toEqual([])
  })

  it('creates no index that a migration creates unguarded', () => {
    const owned = new Set(unguardedIndexNames(migrations))
    const baselineIdx = [...baseline.matchAll(/^\s*create (?:unique )?index (?:if not exists )?([A-Za-z_][A-Za-z0-9_]*)/gm)].map(m => m[1])
    const clash = baselineIdx.filter(n => owned.has(n))
    expect(clash, `these indexes are created unguarded by a migration and must not be in the baseline:\n  ${clash.join('\n  ')}`).toEqual([])
  })

  it('still creates the seven tables that no migration creates — the whole reason it exists', () => {
    // ⚠️ The mirror risk: someone "fixes" a future collision by deleting from the baseline
    // until it is empty, and CI goes green having built a database with no learners table.
    for (const t of ['profiles', 'learners', 'learner_access', 'learner_invites',
                     'sessions', 'learner_progress', 'learner_stats']) {
      expect(new RegExp(`create table if not exists public\\.${t}\\b`).test(baseline), `baseline no longer creates public.${t}`).toBe(true)
      expect(new RegExp(`create table (if not exists )?public\\.${t}\\b`).test(migrations), `public.${t} is now created by a migration — check whether the baseline still needs it`).toBe(false)
    }
  })

  it('is never committed into supabase/migrations/', () => {
    // CI copies it in as 00000000000000_baseline.sql on a throwaway runner. Committed, it
    // would be a backdated migration that `supabase db push` applies to PRODUCTION.
    expect(readdirSync(join(ROOT, 'supabase/migrations'))).not.toContain('00000000000000_baseline.sql')
  })
})
