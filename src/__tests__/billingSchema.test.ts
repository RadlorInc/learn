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

describe('a redefinition never drops a guard an earlier one added', () => {
  it('the newest definition of every function keeps its predecessors\' raise conditions', () => {
    /**
     * ⚠️⚠️ THIS IS THE `leads_server_only` REGRESSION AS A STANDING RULE, AND IT CAUGHT ITS FIRST
     * ONE THE DAY IT WAS WRITTEN. `plan_entitlement.sql` rebuilt `sync_diagnostic` from the
     * IDEMPOTENCY migration, which is OLDER than `harden_rpc_inputs` — so it silently dropped the
     * V5 payload bounds. `create or replace` means the LAST definition wins, so rebuilding a
     * function from any version but the newest reverts everything added in between.
     *
     * ⚠️ AND IT WAS NOT CAUGHT BY READING THE REPO. The grep that said nothing newer redefined that
     * function was CASE-SENSITIVE, and `harden_rpc_inputs` writes `CREATE OR REPLACE FUNCTION` in
     * capitals — so this check is deliberately case-insensitive, and the runbook still says to diff
     * against production, because a source search is a claim about your regex.
     *
     * Measured before being written: exactly one violation across the 18 functions any migration
     * redefines, and it was the new one.
     */
    const defs: Record<string, { file: string; body: string }[]> = {}
    for (const f of migFiles) {
      const src = raw(f)   // NOT comment-stripped: a `raise exception` inside a comment is not a guard,
      for (const m of src.matchAll(/create\s+or\s+replace\s+function\s+(?:public\.)?([a-z_][a-z0-9_]*)\s*\(/gi)) {
        const rest = src.slice(m.index! + m[0].length)
        const tag = rest.match(/\$[a-z_]*\$/i)
        if (!tag) continue
        const i = rest.indexOf(tag[0]) + tag[0].length
        const j = rest.indexOf(tag[0], i)
        ;(defs[m[1].toLowerCase()] ??= []).push({ file: f, body: j > 0 ? rest.slice(i, j) : rest.slice(i) })
      }
    }
    expect(Object.keys(defs).length, 'no function definitions parsed — the regex has rotted').toBeGreaterThan(10)

    const conditions = (b: string) => new Set([...b.matchAll(/raise\s+exception\s+'([^']*)'/gi)].map(m => m[1]))
    const lost: string[] = []
    for (const [fn, ds] of Object.entries(defs)) {
      if (ds.length < 2) continue
      const newest = ds[ds.length - 1]
      const earlier = new Set<string>()
      for (const d of ds.slice(0, -1)) for (const c of conditions(d.body)) earlier.add(c)
      for (const c of earlier) {
        if (!newest.body.includes(c)) lost.push(`${fn} (newest: ${newest.file}) no longer raises "${c}"`)
      }
    }
    expect(lost, `a redefinition dropped a guard an earlier migration added:\n  ${lost.join('\n  ')}`).toEqual([])
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

describe('the paywall ships OFF, and the suite must turn it on', () => {
  const planFile = decomment(raw(migFiles.find(f => f.endsWith('_plan_entitlement.sql'))!))
  const suite = readFileSync(join(ROOT, 'supabase/tests/rls_regression.sql'), 'utf8')

  it('every definition of is_chapter_entitled short-circuits on billing_config.enforced', () => {
    // ⚠️ EVERY definition, not the first. `create or replace` means the LAST one wins, so a later
    // migration that rebuilds this function without the flag re-arms the paywall on a production
    // with no subscriptions — the state that stops 65 of 72 chapters saving for every family.
    // Wherever a rule must hold in N places, assert N.
    const defs = [...allMigrations.matchAll(
      /create or replace function public\.is_chapter_entitled[\s\S]*?\$\$([\s\S]*?)\$\$/gi,
    )].map(m => m[1])
    expect(defs.length, 'no definition found — this gate is inert').toBeGreaterThan(1)
    const missing = defs.filter(b => !/not coalesce\(\(select bc\.enforced from public\.billing_config/i.test(b))
    expect(missing.length, `${missing.length} of ${defs.length} definitions of is_chapter_entitled do not check the switch`).toBe(0)
  })

  it('billing_config is service-role only — no policy, no grant', () => {
    expect(billing).toMatch(/create table if not exists public\.billing_config/i)
    expect(billing).toMatch(/alter table public\.billing_config\s+enable row level security/i)
    expect(billing).toMatch(/revoke all on public\.billing_config\s+from anon, authenticated/i)
    const anyPolicy = [...allMigrations.matchAll(/create policy[\s\S]{0,200}?on public\.billing_config/gi)]
    expect(anyPolicy.map(m => m[0]), 'a client that can write this row has turned the paywall off').toEqual([])
  })

  it('the RLS suite forces enforced ON, and says so', () => {
    // ⚠️ THE CONDITION THAT MAKES THE FLAG SAFE RATHER THAN A HOLE. A flag defaulting off with a
    // suite that inherits the default is a paywall that silently never turns on and a suite that
    // passes anyway — the same shape as the CI job that skipped and reported success. The suite
    // both SETS it and ASSERTS it: setting alone would be silently removable.
    expect(suite, 'the suite must turn the paywall on').toMatch(/update public\.billing_config set enforced = true/i)
    expect(suite, 'the suite must assert it is on, not merely set it').toMatch(/RLS FAIL F0/)
    // And it must check that nobody can turn it off, in both directions.
    expect(suite).toMatch(/RLS FAIL F1:/)
    expect(suite).toMatch(/RLS FAIL F1b:/)
    expect(suite).toMatch(/RLS FAIL F2:/)
  })
})

describe('plan-derived entitlement (source C)', () => {
  const plan = decomment(raw(migFiles.find(f => f.endsWith('_plan_entitlement.sql'))!))

  it('reads a RECORDED column, never a live "first two unmet" query', () => {
    // ⚠️ THE WHOLE DIFFERENCE BETWEEN A BOUNDED FREE TIER AND A FREE PRODUCT. Computed live,
    // finishing step one promotes step three and the plan walks free one chapter at a time.
    // rls_regression C3 drives it; this is what notices the column being swapped for a subquery.
    const fn = plan.match(/create or replace function public\.is_chapter_entitled[\s\S]*?\$\$([\s\S]*?)\$\$/i)
    expect(fn, 'is_chapter_entitled not found — this gate is inert').not.toBeNull()
    const body = fn![1]
    expect(body).toMatch(/= any \(dp\.free_chapters\)/)
    expect(body, 'entitlement must read the ACTIVE plan only').toMatch(/dp\.active/)
    expect(body, 'the free set must not be recomputed from progress at read time')
      .not.toMatch(/learner_progress/)
  })

  it('makes one-active-plan-per-learner structural, not just something the RPC does', () => {
    // A rule that lives only inside an RPC is a rule the next writer of that RPC can drop.
    expect(plan).toMatch(/create unique index if not exists diagnostic_plans_one_active_per_learner[\s\S]{0,120}?where active/i)
    // …and the backfill has to come first, or the index cannot be created at all.
    expect(plan.indexOf('set active = false'))
      .toBeLessThan(plan.indexOf('diagnostic_plans_one_active_per_learner'))
  })

  it('retires the previous plan when a new one is issued, and not on an idempotent retry', () => {
    const fn = plan.match(/create or replace function public\.sync_diagnostic[\s\S]*?\$\$([\s\S]*?)\$\$/i)![1]
    expect(fn).toMatch(/update public\.diagnostic_plans set active = false\s*\n?\s*where learner_id = p_learner_id and active/i)
    // ⚠️ The early return for a duplicate client_id must come BEFORE the deactivation, or a retried
    // network call leaves a learner with no active plan and no free chapters at all.
    expect(fn.indexOf('return v_session_id;')).toBeLessThan(fn.indexOf('set active = false'))
  })

  it('caps the play-data revision at exactly one per plan', () => {
    const fn = plan.match(/create or replace function public\.entitle_revised_step[\s\S]*?\$\$([\s\S]*?)\$\$/i)
    expect(fn, 'entitle_revised_step not found — this gate is inert').not.toBeNull()
    // The cap IS the null check: the column is only writable while it is empty.
    expect(fn![1]).toMatch(/revised_chapter is null/)
    expect(fn![1], 'it must be scoped to the ACTIVE plan').toMatch(/and active/)
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
