// @vitest-environment node
//   ⚠️ NOT COSMETIC. The suite default is jsdom, whose Response has no `arrayBuffer`, and PGlite
//   loads its data directory through one — it dies at `PGlite.create()` with
//   "r.arrayBuffer is not a function". This file touches no DOM.
/**
 * sessions.started_at — the column whose NAME is why nobody looked.
 *
 * ⚠️ MEASURED ON PRODUCTION 2026-09-05: all 49 session rows have a NEGATIVE duration (median -1s,
 * min -22s), because `sync_session` never supplied `started_at`. It took the column default
 * `now()` — the SERVER clock at INSERT — while `completed_at` is a CLIENT stamp made just before
 * the call. Both mark the END. A dashboard subtracting one from the other would have shown a
 * confident, plausible-looking number for a quantity that was never recorded.
 *
 * ⚠️ THIS TEST RUNS THE REAL MIGRATIONS ON A REAL POSTGRES. It does not read the source. Both
 * function bodies are `readFileSync`'d from the repo's own migration files and executed, so a
 * check here cannot pass by agreeing with a second copy of the rule.
 *
 * ⚠️ ITS FIRST ASSERTION IS THE KNOWN-BAD CONTROL: it drives TODAY'S migration and requires a
 * non-positive duration. If someone fixes the old migration in place, this test goes red and says
 * so — the control is not decoration, it is what proves the other assertions can distinguish
 * anything at all.
 *
 * Schema is DERIVED from production's information_schema (2026-09-05), not hand-typed, so the
 * fixture cannot drift into describing a world the app never stores.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MIG = (f: string) => readFileSync(resolve(__dirname, '../../supabase/migrations', f), 'utf8')
const OLD = '20260820111858_sync_session_difficulty.sql'
const NEW = '20260905120000_session_started_at.sql'

const LEARNER = '22222222-2222-2222-2222-222222222222'
const PARENT  = '11111111-1111-1111-1111-111111111111'

/** Generated from production information_schema on 2026-09-05 — not hand-written. */
const SCHEMA = `
create schema if not exists auth;
do $$ begin
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $$;
create table learner_access (id uuid not null default gen_random_uuid(), learner_id uuid not null, parent_id uuid not null, access_role text not null default 'viewer'::text, granted_at timestamptz not null default now());
create table learner_progress (id uuid not null default gen_random_uuid(), learner_id uuid not null, chapter text not null, best_stars smallint not null default 0, total_xp integer not null default 0, total_sessions integer not null default 0, last_played_at timestamptz, current_level smallint not null default 1, updated_at timestamptz not null default now());
create table learner_stats (learner_id uuid not null, total_xp integer not null default 0, total_coins integer not null default 0, current_level smallint not null default 1, last_played_at timestamptz, updated_at timestamptz not null default now());
create table sessions (id uuid not null default gen_random_uuid(), learner_id uuid not null, chapter text not null, phase text not null default 'practice'::text, started_at timestamptz not null default now(), completed_at timestamptz, correct_count smallint not null default 0, wrong_count smallint not null default 0, stars_earned smallint not null default 0, xp_earned integer not null default 0, coins_earned integer not null default 0, client_id text);
alter table sessions add constraint sessions_client_id_key unique (client_id);
alter table learner_progress add constraint lp_key unique (learner_id, chapter);
alter table learner_stats add constraint ls_key unique (learner_id);
create function auth.uid() returns uuid language sql stable as $$ select '${PARENT}'::uuid $$;
create function public.is_chapter_entitled(uuid, text) returns boolean language sql stable as $$ select true $$;
insert into learner_access (learner_id, parent_id) values ('${LEARNER}','${PARENT}');
`

// One chapter: opened, played for exactly 7 minutes, finished.
//
// ⚠️ `COMPLETED` MUST BE ~NOW, AND THAT IS THE WHOLE MECHANISM — not a detail. In the real app the
// client stamps `completed_at` microseconds before the RPC call, so the server's `now()` default on
// `started_at` lands a hair LATER and the duration comes out barely negative (production: median
// -1s, min -22s). A frozen fixture date breaks that: pinned to 12:00Z, today's buggy RPC produced
// +49691s and the known-bad control failed for the wrong reason. Reproducing this defect requires
// reproducing its timing, so the durations below are all RELATIVE and only the offsets are fixed.
const COMPLETED = new Date()
const PLAYED_S  = 420
const STARTED   = new Date(COMPLETED.getTime() - PLAYED_S * 1000)

let db: PGlite
let oldDuration: number

async function callOld(clientId: string) {
  await db.query(
    `select public.sync_session($1,'counting','practice',8,2,3,0,0,$2,$3::timestamptz,2)`,
    [LEARNER, clientId, COMPLETED.toISOString()])
}
async function callNew(clientId: string, started: Date | null) {
  await db.query(
    `select public.sync_session($1,'counting','practice',8,2,3,0,0,$2,$3::timestamptz,2,$4::timestamptz)`,
    [LEARNER, clientId, COMPLETED.toISOString(), started ? started.toISOString() : null])
}
async function durationOf(clientId: string): Promise<number | null> {
  const r = await db.query<{ d: number | null }>(
    `select extract(epoch from (completed_at - started_at))::float8 d from sessions where client_id=$1`,
    [clientId])
  const d = r.rows[0]?.d
  return d === null || d === undefined ? null : Number(d)
}

beforeAll(async () => {
  db = await PGlite.create()
  await db.exec(SCHEMA)

  // ── today's code, from the repo's own migration ──
  await db.exec(MIG(OLD))
  await callOld('old-client')
  oldDuration = (await durationOf('old-client'))!

  // ── the fix ──
  await db.exec(MIG(NEW))
}, 60_000)

describe('sessions.started_at', () => {
  it('KNOWN-BAD CONTROL: today\'s RPC cannot produce a positive duration', () => {
    // 7 real minutes of play. Today's code records a non-positive number, because both
    // timestamps mark the end. This is the defect, reproduced — not described.
    expect(oldDuration).toBeLessThanOrEqual(0)
  })

  it('records the real time the child spent in the chapter', async () => {
    await callNew('new-client', STARTED)
    expect(await durationOf('new-client')).toBeCloseTo(PLAYED_S, 3)
  })

  it('the UNTOUCHED older signature now records NULL — unknown, never a fabricated zero', async () => {
    // The 11-arg function is not redefined by the new migration at all. Dropping the column
    // DEFAULT is what changes its behaviour: it never mentioned started_at, so now() used to fill
    // in a fake. A browser still holding the old bundle degrades to honest silence.
    await callOld('shim-client')
    expect(await durationOf('shim-client')).toBeNull()
  })

  it('clamps a start more than 6h before the end', async () => {
    await callNew('clamp-long', new Date(COMPLETED.getTime() - 10 * 3600_000))
    expect(await durationOf('clamp-long')).toBeCloseTo(6 * 3600, 3)
  })

  it('clamps a start AFTER the end to zero, never negative', async () => {
    await callNew('clamp-future', new Date(COMPLETED.getTime() + 60_000))
    expect(await durationOf('clamp-future')).toBe(0)
  })

  it('the documented exclusion rule selects exactly the measurable rows', async () => {
    // Worked out by hand from the five rows written above, BEFORE running this query:
    //   new-client   420s                          -> passes
    //   clamp-long   capped to 21600s              -> passes
    //   clamp-future start == end after clamping   -> EXCLUDED by a strict '<'. The clamp made it
    //                harmless; it did not make it a measurement. A client claiming the chapter
    //                ended before it began has told us nothing about duration.
    //   shim-client  NULL                          -> excluded
    //   old-client   started_at > completed_at     -> excluded (this is the legacy shape: all 49
    //                production rows written before this migration look exactly like it)
    const r = await db.query<{ client_id: string }>(
      `select client_id from sessions
       where started_at is not null and started_at < completed_at order by client_id`)
    expect(r.rows.map(x => x.client_id)).toEqual(['clamp-long', 'new-client'])
  })
})

/**
 * The wiring. The migration above is useless if nothing hands the RPC a start time — and this repo
 * has already paid three months for exactly that shape: `ChapterProps.onComplete` was typed, passed
 * and silently DROPPED by both registry factories, so no child's plan advanced while every screen
 * looked right. A prop's presence in a signature is not evidence it is read.
 *
 * So: every call site that takes `finishAndSync` (i.e. every site that can WRITE a session) must
 * arm the clock by passing its chapter. `/game` takes only `flushQueue` and is exempt — it writes
 * nothing. Counted, per CLAUDE.md: assert the number of things the rule is about, not the number of
 * occurrences of a token.
 *
 * ⚠️ WHAT THIS CANNOT SEE, STATED PLAINLY: it proves the argument is passed, not that the value
 * survives to the database. The only thing that proves that is playing a chapter and reading the
 * row back — recorded as an open item rather than hidden inside a green test.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) { if (e !== '__tests__') walk(p, out) }
    else if (/\.tsx?$/.test(p)) out.push(p)
  }
  return out
}

describe('the start clock is armed at every site that can write a session', () => {
  const SRC = resolve(__dirname, '..')

  it('every useChapterSync() taking finishAndSync passes a chapter', () => {
    const armed: string[] = []
    const unarmed: string[] = []
    for (const file of walk(SRC)) {
      const src = readFileSync(file, 'utf8')
      // one destructuring call site per match; `[^)]*` cannot leave the argument list
      for (const m of src.matchAll(/const\s*\{([^}]*)\}\s*=\s*useChapterSync\(([^)]*)\)/g)) {
        const [, destructured, arg] = m
        if (!destructured.includes('finishAndSync')) continue
        ;(arg.trim() ? armed : unarmed).push(file.replace(SRC, 'src'))
      }
    }
    // Exactly two writers today: ChapterPortal (all 46 chapters) and CountingStoryChapter.
    // A THIRD appearing unarmed is the regression this exists for.
    expect(unarmed).toEqual([])
    expect(armed.sort()).toEqual([
      'src/features/chapters/ChapterPortal.tsx',
      'src/features/chapters/game/CountingStoryChapter.tsx',
    ])
  })

  it('the payload actually carries the field to the RPC', () => {
    const repo = readFileSync(resolve(SRC, 'data/repositories/sessions.ts'), 'utf8')
    // anchored on the real call, not on the word appearing anywhere in the file
    expect(repo).toMatch(/p_started_at:\s*payload\.startedAt\s*\?\?\s*null/)
    const hook = readFileSync(resolve(SRC, 'data/supabase/useChapterSync.ts'), 'utf8')
    expect(hook).toMatch(/startedAt:\s*startRef\.current\?\.chapter === chapter/)
  })
})
