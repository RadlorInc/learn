/**
 * EVERY TABLE IN `public` HAS ROW LEVEL SECURITY ON, AND NO VIEW THERE SKIPS IT.
 *
 * Why: Supabase grants `anon` and `authenticated` every privilege on a new `public` table by default,
 * and the anon key ships in the browser. So a migration that forgets `enable row level security` is
 * a table anyone on the internet can read and write through `/rest/v1/<table>`.
 * ⚠️ A FORGOTTEN `enable` IS ALREADY IMPOSSIBLE: production's event trigger `ensure_rls`
 * (`baseline_schema.sql`) turns RLS on for every new public table — planting a bare `create table`
 * stays green here, correctly. What this catches is the way AROUND that structure: a migration that
 * `disable`s RLS, or one that drops the trigger (both watched red, 2026-09-28). `rls_regression.sql`
 * asserts named tables only, so neither would show there.
 * A view is the same door by another route — it runs as its OWNER unless it is `security_invoker`,
 * so it reads past the RLS of the tables under it, and the trigger does nothing for views.
 *
 * Built from the same files CI builds production's shape from (`_schema.ts`), not from a list.
 */
import { describe, expect, it } from 'vitest'
import { loadSchema } from './_schema'

describe('RLS is on for every public table', () => {
  it('no table or view in public can be read around RLS', async () => {
    const { db } = await loadSchema()
    const tables = (await db.query<{ t: string; rls: boolean }>(`select c.relname t, c.relrowsecurity rls
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p') order by 1`)).rows
    // Positive control: the catalog is really populated — a load that built nothing would pass the check below.
    expect(tables.map(r => r.t)).toEqual(expect.arrayContaining(['learners', 'lesson_progress', 'parental_consents']))
    expect(tables.filter(r => !r.rls).map(r => r.t), 'public tables with RLS OFF — anon can read and write them').toEqual([])

    const views = (await db.query<{ v: string }>(`select c.relname v from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('v', 'm')
        and not coalesce('security_invoker=true' = any(c.reloptions), false)
        and (has_table_privilege('anon', c.oid, 'select') or has_table_privilege('authenticated', c.oid, 'select'))`)).rows
    expect(views.map(r => r.v), 'public views a client can select that run as their owner (bypass RLS)').toEqual([])
  }, 120_000)
})
