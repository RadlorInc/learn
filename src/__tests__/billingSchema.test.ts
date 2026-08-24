import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The billing schema's security properties, and two GENERAL rules that now cover every future
 * migration as well.
 *
 * ⚠️ WHY A SOURCE GATE AT ALL, when supabase/tests/rls_regression.sql DRIVES all of this against a
 * real Postgres: because a driven test proves behaviour at one moment and cannot see a call site
 * disappear from a path it does not happen to exercise. That is the fault that cost this repo three
 * months on the plan pointer — six passing unit tests on `advancePlan` and nothing calling it. The
 * SQL suite is the primary evidence; these are the checks that notice a guard being deleted.
 *
 * ⚠️ EVERY PATTERN HERE RUNS OVER COMMENT-STRIPPED SQL. The migration EXPLAINS, at length, that
 * there must be no insert policy on `subscriptions` and no INSERT inside `reassign_learner_seat` —
 * so a regex over the raw file would match the prose written to protect it and report the file it
 * was written for. This repo has shipped that mistake twice.
 */
const ROOT = join(__dirname, '../..')
const MIG = join(ROOT, 'supabase/migrations')

const migFiles = readdirSync(MIG).filter(f => f.endsWith('.sql')).sort()
const raw = (f: string) => readFileSync(join(MIG, f), 'utf8')

/** Drop `--` line comments. Everything below matches CODE, never prose. */
const decomment = (sql: string) => sql.replace(/--[^\n]*/g, '')

const allMigrations = decomment(migFiles.map(raw).join('\n'))
const baseline = decomment(readFileSync(join(ROOT, 'supabase/schema/baseline_schema.sql'), 'utf8'))
const securityBaseline = readFileSync(join(ROOT, 'supabase/schema/security_baseline.sql'), 'utf8')

const billingFile = migFiles.find(f => f.endsWith('_billing_schema.sql'))!
const billing = decomment(raw(billingFile))

describe('security_baseline.sql keeps up with the schema', () => {
  it('names every table any migration or the baseline creates', () => {
    // ⚠️ GENERAL, not billing-only. `security_baseline.sql` is the committed, diffable record of the
    // security surface, and it is only worth anything if nothing can be added without appearing in
    // it — a table absent from the baseline is a table whose RLS nobody reviewed. Measured before
    // writing this: all 20 existing tables pass, so the rule costs nothing today and catches the
    // 21st.
    const created = new Set(
      [...(allMigrations + '\n' + baseline).matchAll(
        /^\s*create table (?:if not exists )?(?:public\.)?([a-z_][a-z0-9_]*)/gim,
      )].map(m => m[1].toLowerCase()),
    )
    const dropped = new Set(
      [...allMigrations.matchAll(/^\s*drop table (?:if exists )?(?:public\.)?([a-z_][a-z0-9_]*)/gim)]
        .map(m => m[1].toLowerCase()),
    )
    const tables = [...created].filter(t => !dropped.has(t)).sort()
    expect(tables.length, 'no tables found — the regex has rotted').toBeGreaterThan(15)

    const missing = tables.filter(t => !new RegExp(`\\b${t}\\b`).test(securityBaseline))
    expect(missing, `not named in supabase/schema/security_baseline.sql:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('every SECURITY DEFINER function a migration creates carries an explicit REVOKE', () => {
    // ⚠️ ALSO GENERAL, and it is the V19 lesson as a standing rule. Postgres creates a function with
    // PUBLIC EXECUTE, and Supabase exposes every public-schema function at /rest/v1/rpc/<name> — so
    // a SECURITY DEFINER function with no REVOKE is an unauthenticated, privilege-escalating
    // endpoint the moment it is created. `prune_error_events` was exactly that.
    const fns = new Set<string>()
    for (const m of allMigrations.matchAll(
      /create (?:or replace )?function\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(([\s\S]*?)\)([\s\S]*?)(?:\bas\b|\$)/gi,
    )) {
      if (/security\s+definer/i.test(m[3])) fns.add(m[1].toLowerCase())
    }
    expect(fns.size, 'no SECURITY DEFINER functions found — the regex has rotted').toBeGreaterThan(5)

    const unrevoked = [...fns].sort().filter(
      f => !new RegExp(`revoke\\s+(all|execute)[^;]*\\bon function\\s+(public\\.)?${f}\\s*\\(`, 'i').test(allMigrations),
    )
    expect(unrevoked, `SECURITY DEFINER with no REVOKE — reachable at /rest/v1/rpc/:\n  ${unrevoked.join('\n  ')}`).toEqual([])
  })
})

describe('the entitlement guard cannot diverge', () => {
  // The runtime half is rls_regression.sql B12, which DRIVES both write paths and asserts the
  // verdicts are equal. This half asserts the call sites still exist, in all THREE places, because
  // B12 can only compare paths that are still being called.
  it('is called from the sessions policy, the learner_progress WITH CHECK, and sync_session', () => {
    // ⚠️ `[^;]*`, NOT a character budget. The first version of this used `[\s\S]{0,800}?` and was
    // BLIND to the mutation that matters most: delete the guard from the sessions policy and the
    // window simply ran on into the NEXT policy, which still had one, so the check stayed green.
    // A policy statement contains no semicolon of its own, so `[^;]*` cannot leave it. Caught by
    // mutation, not by reading — and it is the reason every one of these is planted before it is
    // trusted.
    const syncBody = billing.match(
      /create or replace function public\.sync_session\([\s\S]*?\$function\$([\s\S]*?)\$function\$/i,
    )?.[1] ?? ''
    const sites: [string, boolean][] = [
      ['sessions insert policy',
       /create policy "sessions: parent can insert"[^;]*is_chapter_entitled\(/i.test(billing)],
      ['learner_progress WITH CHECK',
       /create policy "learner_progress: parent access"[^;]*with check[^;]*is_chapter_entitled\(/i.test(billing)],
      ['sync_session body',
       syncBody.length > 0 && /is_chapter_entitled\(/i.test(syncBody)],
    ]
    const absent = sites.filter(([, ok]) => !ok).map(([name]) => name)
    expect(absent, `the entitlement guard is missing from:\n  ${absent.join('\n  ')}`).toEqual([])
    // ⚠️ Assert the COUNT too. Wherever a rule must hold in N places, assert N — otherwise a fourth
    // write path can be added with no guard and every check above still passes.
    expect(sites.length, 'there are exactly three write paths under this guard').toBe(3)
  })

  it('grants EXECUTE on is_chapter_entitled to authenticated and to nobody else', () => {
    // A policy predicate is evaluated with the CALLER's privileges, so without this grant every
    // guarded write fails for everyone — a deny-all paywall that looks like a working one until a
    // paying customer tries to play.
    expect(billing).toMatch(/revoke all on function public\.is_chapter_entitled\(uuid, text\) from public, anon/i)
    expect(billing).toMatch(/grant execute on function public\.is_chapter_entitled\(uuid, text\) to authenticated, service_role/i)
  })
})

describe('a parent cannot write their own billing', () => {
  it('has no INSERT / UPDATE / DELETE policy on subscriptions or subscription_seats', () => {
    // SELECT-only, and expressed as the ABSENCE of a policy rather than a restrictive one: a policy
    // that exists can be widened in a one-word diff, and one that does not exist cannot.
    const offenders = [...billing.matchAll(
      /create policy\s+"?([^"\n]+?)"?\s+on public\.(subscriptions|subscription_seats)\s+for\s+([a-z]+)/gi,
    )].filter(m => m[3].toLowerCase() !== 'select').map(m => `${m[2]}: ${m[1]} (for ${m[3]})`)
    expect(offenders, `write policies on a billing table:\n  ${offenders.join('\n  ')}`).toEqual([])
  })

  it('has no policy at all on billing_events — RLS on, zero policies, the error_events precedent', () => {
    const any = [...allMigrations.matchAll(/create policy[\s\S]{0,200}?on public\.billing_events/gi)]
    expect(any.map(m => m[0]), 'billing_events must have NO policy; it is service-role only').toEqual([])
    expect(billing).toMatch(/alter table public\.billing_events\s+enable row level security/i)
  })

  it('revokes the default grants on all three billing tables', () => {
    // ⚠️ THE REVOKE CHANGES THE FAILURE MODE, it is not decoration. Supabase's default privileges
    // hand anon/authenticated ALL on new public tables; with the grant in place and no UPDATE
    // policy, an attempted self-upgrade matches no rows and returns quietly instead of raising —
    // and a silent no-op is indistinguishable from success to the caller.
    for (const t of ['subscriptions', 'subscription_seats', 'billing_events']) {
      expect(billing, `missing: revoke all on public.${t} from anon, authenticated`)
        .toMatch(new RegExp(`revoke all on public\\.${t}\\s+from anon, authenticated`, 'i'))
    }
  })
})

describe('reassign_learner_seat cannot raise the active seat count', () => {
  it('contains no INSERT and no DELETE against subscription_seats', () => {
    // The runtime half is rls_regression B13d, which counts the rows either side of a reassignment.
    // This is the structural half: the function's only write is an UPDATE of one existing row, so
    // there is no arrangement of arguments that produces a seat nobody paid for.
    const m = billing.match(/create or replace function public\.reassign_learner_seat[\s\S]*?\$\$([\s\S]*?)\$\$/i)
    expect(m, 'reassign_learner_seat not found — this gate is inert').not.toBeNull()
    const body = m![1]
    expect(body).not.toMatch(/insert\s+into\s+(public\.)?subscription_seats/i)
    expect(body).not.toMatch(/delete\s+from\s+(public\.)?subscription_seats/i)
    expect(body, 'the one write must be an UPDATE of a single seat by id')
      .toMatch(/update public\.subscription_seats[\s\S]*?where id = p_seat_id/i)
  })

  it('enforces one reassignment per billing period, and fails CLOSED on an unknown period', () => {
    const body = billing.match(/create or replace function public\.reassign_learner_seat[\s\S]*?\$\$([\s\S]*?)\$\$/i)![1]
    // ⚠️ The coalesce is the whole guard. Without it the comparison against a NULL
    // current_period_start is NULL, the `if` does not fire, and the limit silently does not exist —
    // which is precisely the state someone would engineer by suppressing a webhook.
    expect(body).toMatch(/last_reassigned_at\s*>=\s*coalesce\(\s*v_sub\.current_period_start\s*,\s*'-infinity'/i)
  })
})
