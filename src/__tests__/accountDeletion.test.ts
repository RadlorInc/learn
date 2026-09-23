// @vitest-environment node
/**
 * ACCOUNT DELETION, TABLE BY TABLE, AGAINST THE REPO'S REAL SCHEMA.
 *
 * ⚠️ THE FAILURE THIS FILE EXISTS FOR IS NOT "DELETION FAILS". It is deletion HALF-succeeding: an
 * `auth.users` row gone with `learners` rows surviving is children's data with no owner, nobody who
 * can reach it, and no way to answer the next deletion request. That is worse than not shipping the
 * feature. So the assertions are per-table row counts taken before and after, enumerated from the
 * foreign-key map read off `pg_constraint` — never "the call returned without throwing".
 *
 * ⚠️ THE TABLE LIST IS DERIVED, NOT TYPED. `tablesReachableFromAnAccount()` walks the real FK graph
 * out from `auth.users`, so a table added in six months is in this test the day it lands. A list
 * written here by hand would go stale silently, and the document promising deletion would go false
 * with it.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { loadSchema, foreignKeys, type Fk, grantedConsent, FIXTURE_NOTICE } from './_schema'
import { SURVIVORS } from '@/core/accountDeletion'

const A = '000000a1-0000-4000-8000-000000000000'   // family A — the one being deleted
const B = '000000b2-0000-4000-8000-000000000000'   // family B — must not be touched
const LA = '000000c1-0000-4000-8000-000000000000'
const LA2 = '000000c2-0000-4000-8000-000000000000'
const LB = '000000d1-0000-4000-8000-000000000000'

/**
 * Every public table whose rows can hang off one account, by walking the FK graph out from
 * `auth.users` — plus `error_events`, which is reachable by `learner_id` and has NO foreign key at
 * all, which is exactly why it needs naming.
 */
function tablesReachableFromAnAccount(fks: Fk[]): string[] {
  const children = new Map<string, string[]>()
  for (const f of fks) {
    if (!children.has(f.parent)) children.set(f.parent, [])
    children.get(f.parent)!.push(f.child)
  }
  const seen = new Set<string>()
  const walk = (t: string) => {
    for (const c of children.get(t) ?? []) {
      if (seen.has(c)) continue
      seen.add(c)
      walk(c)
    }
  }
  walk('auth.users')
  seen.add('public.error_events')   // no FK — the one edge the graph cannot see
  // `chapters` is reference data every session points AT; it is not owned by anyone.
  seen.delete('public.chapters')
  seen.delete('public.grade_chapters')
  return [...seen].filter(t => t.startsWith('public.')).sort()
}

/**
 * ⚠️ WHOLE-TABLE COUNTS, AND THIS IS THE ASSERTION THAT ACTUALLY CATCHES AN ORPHAN.
 *
 * The per-account census below counts rows by their OWNERSHIP column (`created_by = A`,
 * `learner_id in (…)`). That is the natural thing to write and it is blind to the exact defect this
 * file exists for: if `learners_created_by_fkey` were ever SET NULL instead of RESTRICT, deleting
 * the account would strand the children with `created_by = null` — and a census asking "how many
 * learners does A own?" would answer ZERO and report success over a table full of ownerless
 * children. Proven, not reasoned about: that break is run in `accountDeletionOrphan.test.ts`.
 *
 * Counting the whole table cannot be fooled that way. Family B is a known quantity, so after A is
 * deleted every table must hold exactly B's rows and nothing else, whatever column a survivor might
 * be hiding in.
 */
async function totals(db: PGlite, tables: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = { 'auth.users': await count(db, 'auth.users') }
  for (const t of tables) out[t] = await count(db, t)
  return out
}

const count = async (db: PGlite, sql: string) =>
  Number((await db.query<{ n: number }>(`select count(*)::int as n from ${sql}`)).rows[0].n)

/** Row counts for every reachable table, restricted to one family, keyed by table name. */
async function censusFor(db: PGlite, tables: string[], uid: string, learnerIds: string[]) {
  const ls = learnerIds.length ? learnerIds.map(l => `'${l}'`).join(',') : `'00000000-0000-4000-8000-000000000000'`
  const where: Record<string, string> = {
    'public.profiles':                 `public.profiles where id = '${uid}'`,
    'public.learners':                 `public.learners where created_by = '${uid}'`,
    'public.learner_access':           `public.learner_access where parent_id = '${uid}' or learner_id in (${ls})`,
    'public.learner_invites':          `public.learner_invites where invited_by = '${uid}' or learner_id in (${ls})`,
    'public.learner_progress':         `public.learner_progress where learner_id in (${ls})`,
    'public.learner_stats':            `public.learner_stats where learner_id in (${ls})`,
    'public.learner_state':            `public.learner_state where learner_id in (${ls})`,
    'public.learner_events':           `public.learner_events where learner_id in (${ls})`,
    'public.sessions':                 `public.sessions where learner_id in (${ls})`,
    'public.diagnostic_sessions':      `public.diagnostic_sessions where learner_id in (${ls})`,
    'public.diagnostic_plans':         `public.diagnostic_plans where learner_id in (${ls})`,
    'public.diagnostic_rechecks':      `public.diagnostic_rechecks where learner_id in (${ls})`,
    'public.diagnostic_items':         `public.diagnostic_items d join public.diagnostic_sessions s on s.id = d.session_id where s.learner_id in (${ls})`,
    'public.diagnostic_plan_progress': `public.diagnostic_plan_progress pp join public.diagnostic_plans p on p.id = pp.plan_id where p.learner_id in (${ls})`,
    'public.error_events':             `public.error_events where learner_id in (${ls})`,
    'public.grades':                   `public.grades where created_by = '${uid}'`,
    'public.subscriptions':            `public.subscriptions where account_id = '${uid}'`,
    'public.subscription_seats':       `public.subscription_seats s join public.subscriptions u on u.id = s.subscription_id where u.account_id = '${uid}'`,
    'public.admin_users':              `public.admin_users where user_id = '${uid}'`,
    'public.auth_events':              `public.auth_events where user_id = '${uid}'`,
    'public.billing_events':           `public.billing_events where account_id = '${uid}'`,
    'public.parent_pins':              `public.parent_pins where account_id = '${uid}'`,
    'public.lesson_progress':          `public.lesson_progress where learner_id in (${ls})`,
    'public.point_events':             `public.point_events where learner_id in (${ls})`,
    'public.game_settings':            `public.game_settings where learner_id in (${ls})`,
    'public.teacher_plans':            `public.teacher_plans where teacher_id = '${uid}'`,
    'public.exercise_results':         `public.exercise_results where learner_id in (${ls})`,
    'public.lesson_feedback':          `public.lesson_feedback where learner_id in (${ls})`,
    /**
     * ⚠️ AND THIS ONE IS A DECISION, NOT A MAPPING — flag it to the attorney before it ships.
     * `parental_consents.parent_id` cascades from auth.users, so closing an account destroys the
     * ONLY evidence that consent was ever given or withdrawn. That is what "delete everything we
     * hold about you" promises and what the Privacy Policy says today, so it is what the schema
     * does; but COPPA record-keeping usually wants the opposite, and squaring the two needs an
     * anonymised consent log plus a sentence in the policy. Neither exists, so nothing here
     * pretends otherwise.
     */
    'public.parental_consents':        `public.parental_consents where parent_id = '${uid}'`,
  }
  const out: Record<string, number> = { 'auth.users': await count(db, `auth.users where id = '${uid}'`) }
  for (const t of tables) {
    // ⚠️ A table with no clause is a table nobody decided about. Fail loudly rather than skip it —
    // a silent omission here is precisely how a surviving table would go unnoticed.
    if (!(t in where)) throw new Error(`${t} is reachable from an account and this census has no clause for it`)
    out[t] = await count(db, where[t])
  }
  return out
}

async function seedFamily(db: PGlite, uid: string, learners: string[], email: string) {
  await db.exec(`insert into auth.users (id, email, email_confirmed_at) values ('${uid}', '${email}', now())`)   // a confirmed account → trigger makes the profile
  const klass = (await db.query<{ id: string }>(`insert into public.grades (created_by, name, age_group) values ('${uid}', 'Class', '3-5') returning id`)).rows[0].id
  await db.exec(`insert into public.auth_events (user_id, event) values ('${uid}', 'login')`)
  await db.exec(`insert into public.teacher_plans (teacher_id, paid) values ('${uid}', true)`)   // a paid teacher: the row must go too
  // An admin deleting their own account is a real case, and admin_users is the table whose
  // survival would leave a dead uuid holding dashboard access.
  await db.exec(`insert into public.admin_users (user_id) values ('${uid}')`)
  // The dashboard PIN (2026-09-17): cascades from auth.users, so it must be gone with the account.
  await db.exec(`insert into public.parent_pins (account_id, salt, pin_hash) values ('${uid}', 's', 'h')`)
  await db.exec(`
    insert into public.subscriptions (account_id, status, seats_paid) values ('${uid}', 'active', 2);
    insert into public.billing_events (account_id, stripe_event_id, type)
      values ('${uid}', 'evt_${uid.slice(0, 8)}', 'checkout.session.completed');
  `)
  // Consent-once: ONE account consent covers every child of the family.
  const consent = await grantedConsent(db, uid)
  for (const l of learners) {
    await db.exec(`
      -- ⚠️ Triggers on public.learners already create the owner's learner_access row and the
      -- learner_stats row. Inserting them by hand is a duplicate-key error, and it is also how you
      -- find out the triggers are in the schema being tested.
      insert into public.learners (id, display_name, created_by, age_group, consent_id, attested_notice_version) values ('${l}', 'Kid', '${uid}', '3-5', '${consent}', '${FIXTURE_NOTICE}');
      insert into public.learner_state (learner_id) values ('${l}');
      insert into public.lesson_progress (learner_id, lesson_id, done) values ('${l}', 'g3m2-t1', true);
      insert into public.point_events (learner_id, reason, lesson_id, points) values ('${l}', 'lesson_done', 'g3m2-t1', 10);
      insert into public.game_settings (learner_id) values ('${l}');
      insert into public.exercise_results (learner_id, class_id, exercise_id, outcomes) values ('${l}', '${klass}', 'e1', '{first,worked}');
      insert into public.lesson_feedback (learner_id, lesson_id, screen, reasons) values ('${l}', 'g3m2-t1', '3', '{fast,words}');
      insert into public.learner_progress (learner_id, chapter, best_stars) values ('${l}', 'counting', 3);
      insert into public.sessions (learner_id, chapter, correct_count) values ('${l}', 'counting', 7);
      insert into public.learner_events (learner_id, event) values ('${l}', 'chapter_open');
      insert into public.error_events (learner_id, source, message) values ('${l}', 'client', 'boom');
      insert into public.learner_invites (learner_id, invited_by, invited_email)
        values ('${l}', '${uid}', 'friend@example.com');
      insert into public.subscription_seats (subscription_id, learner_id, seat_index)
        select id, '${l}', (select count(*) from public.subscription_seats) + 1
          from public.subscriptions where account_id = '${uid}';
    `)
    const s = (await db.query<{ id: string }>(`insert into public.diagnostic_sessions (learner_id, band) values ('${l}', '3-5') returning id`)).rows[0].id
    await db.exec(`insert into public.diagnostic_items (session_id, skill_id, correct) values ('${s}', 'countTo10', true)`)
    await db.exec(`insert into public.diagnostic_rechecks (learner_id, session_id, week, skill_id, gap_closed) values ('${l}', '${s}', 1, 'countTo10', true)`)
    const p = (await db.query<{ id: string }>(`insert into public.diagnostic_plans (learner_id, session_id, chapter_sequence) values ('${l}', '${s}', array['counting']) returning id`)).rows[0].id
    await db.exec(`insert into public.diagnostic_plan_progress (plan_id, chapter_id) values ('${p}', 'counting')`)
  }
}

/**
 * Call the RPC as a signed-in user.
 *
 * ⚠️ `authAgeSec` AND `iat` ARE DELIBERATELY SEPARATE ARGUMENTS, because that is the hole. supabase-js
 * refreshes the access token by itself about once an hour, minting a new `iat` while the person has
 * proved nothing — so a token can be sixty seconds old and belong to a session nobody has
 * authenticated since yesterday. `amr` is what does not move on refresh. The test below sets a fresh
 * `iat` with a stale `amr`, which is precisely the tablet-on-the-kitchen-table case.
 */
async function callDelete(
  db: PGlite, uid: string, email: string, confirm: string,
  { authAgeSec = 30, tokenAgeSec = 30 }: { authAgeSec?: number; tokenAgeSec?: number } = {},
) {
  const now = Math.floor(Date.now() / 1000)
  const jwt = {
    email,
    iat: now - tokenAgeSec,
    amr: [{ method: 'password', timestamp: now - authAgeSec }],
  }
  await db.exec(`select set_config('test.uid', '${uid}', false), set_config('test.jwt', '${JSON.stringify(jwt)}', false)`)
  return db.query(`select public.delete_my_account($1) as counts`, [confirm])
}

/** A token with no `amr` at all — an older or unusual one. Must be refused, not trusted. */
async function callDeleteNoAmr(db: PGlite, uid: string, email: string, confirm: string) {
  const jwt = { email, iat: Math.floor(Date.now() / 1000) }
  await db.exec(`select set_config('test.uid', '${uid}', false), set_config('test.jwt', '${JSON.stringify(jwt)}', false)`)
  return db.query(`select public.delete_my_account($1) as counts`, [confirm])
}

describe('deleting an account', () => {
  let db: PGlite
  let TABLES: string[]

  beforeAll(async () => {
    ({ db } = await loadSchema())
    TABLES = tablesReachableFromAnAccount(await foreignKeys(db))
    await seedFamily(db, A, [LA, LA2], 'a@example.com')
    await seedFamily(db, B, [LB], 'b@example.com')
  }, 120_000)

  it('the FK graph reaches every table a census must cover', () => {
    // Positive control on the derivation: if the walk returned nothing, every "0 rows" below would
    // be vacuously true.
    expect(TABLES.length).toBeGreaterThan(15)
    expect(TABLES).toContain('public.learners')
    expect(TABLES).toContain('public.error_events')
  })

  it('refuses without re-authentication, and changes nothing', async () => {
    const before = await censusFor(db, TABLES, A, [LA, LA2])
    // A family device carrying yesterday's session.
    await expect(callDelete(db, A, 'a@example.com', 'a@example.com', { authAgeSec: 60 * 60 * 26, tokenAgeSec: 60 * 60 * 26 }))
      .rejects.toThrow(/reauth_required/)
    expect(await censusFor(db, TABLES, A, [LA, LA2])).toEqual(before)
  })

  it('refuses a FRESHLY REFRESHED token whose sign-in is old — the hole an iat check would leave', async () => {
    const before = await censusFor(db, TABLES, A, [LA, LA2])
    // Token minted 30 seconds ago by the automatic refresh; the human last authenticated a day ago.
    // This is a tablet that has been left signed in, which is exactly the child's situation.
    await expect(callDelete(db, A, 'a@example.com', 'a@example.com', { authAgeSec: 60 * 60 * 26, tokenAgeSec: 30 }))
      .rejects.toThrow(/reauth_required/)
    expect(await censusFor(db, TABLES, A, [LA, LA2])).toEqual(before)
  })

  it('refuses a token carrying no amr claim at all, rather than trusting it', async () => {
    const before = await censusFor(db, TABLES, A, [LA, LA2])
    await expect(callDeleteNoAmr(db, A, 'a@example.com', 'a@example.com')).rejects.toThrow(/reauth_required/)
    expect(await censusFor(db, TABLES, A, [LA, LA2])).toEqual(before)
  })

  it('refuses when the typed email does not match, and changes nothing', async () => {
    const before = await censusFor(db, TABLES, A, [LA, LA2])
    await expect(callDelete(db, A, 'a@example.com', 'b@example.com')).rejects.toThrow(/confirm_mismatch/)
    await expect(callDelete(db, A, 'a@example.com', '')).rejects.toThrow(/confirm_mismatch/)
    expect(await censusFor(db, TABLES, A, [LA, LA2])).toEqual(before)
  })

  it('empties every reachable table for that account, and only that account', async () => {
    const beforeA = await censusFor(db, TABLES, A, [LA, LA2])
    const beforeB = await censusFor(db, TABLES, B, [LB])
    const censusB = beforeB

    // The fixture must actually HAVE rows in every table, or "0 after" proves nothing.
    for (const [t, n] of Object.entries(beforeA)) {
      expect(n, `${t} is empty BEFORE the delete — the fixture does not exercise it`).toBeGreaterThan(0)
    }

    await callDelete(db, A, 'a@example.com', 'a@example.com')

    const afterA = await censusFor(db, TABLES, A, [LA, LA2])
    for (const [t, n] of Object.entries(afterA)) {
      if (SURVIVORS.some(sv => sv.table === t)) continue
      expect(n, `${t} still has ${n} row(s) for the deleted account`).toBe(0)
    }

    // …and the same claim again without an ownership predicate, which is the one that can see a
    // stranded row. Every table must now hold exactly family B's rows.
    const totalsAfter = await totals(db, TABLES)
    for (const [t, n] of Object.entries(totalsAfter)) {
      // ⚠️ THE DRIFT GATE. Anything still holding family A's rows must be a DECLARED survivor with
      // a written legal reason. A table added six months from now and forgotten by the delete
      // fails here by name — which is the moment §11 would otherwise quietly become false.
      const declared = SURVIVORS.some(sv => sv.table === t)
      const expected = declared ? censusB[t] + beforeA[t] : censusB[t]
      expect(n, `${t} holds ${n} rows; family B has ${censusB[t]}. ` +
        `${n - expected} row(s) survived the deletion of family A, possibly with a nulled owner. ` +
        (declared ? 'It is a declared survivor, but the wrong number of rows remain.'
                  : `It is NOT in SURVIVORS (src/core/accountDeletion.ts). Either the delete must ` +
                    `cover it, or it is a deliberate exception that a parent has to be told about ` +
                    `and §11 of the Terms has to say out loud.`)).toBe(expected)
    }

    // ⚠️ THE SURVIVOR, ASSERTED RATHER THAN IGNORED — and specifically that it stops NAMING anyone.
    // billing_events.account_id is ON DELETE SET NULL. If that ever becomes CASCADE the row goes
    // (and accounting breaks); if it stops nulling, a deleted family is still named in it. Both
    // turn this red, and §11 changes with it either way.
    expect(await count(db, `public.billing_events where account_id = '${A}'`)).toBe(0)
    expect(await count(db, `public.billing_events where account_id is null`)).toBe(beforeA['public.billing_events'])

    // Family B, byte for byte.
    expect(await censusFor(db, TABLES, B, [LB])).toEqual(beforeB)
  })
})

/**
 * Child logins (2026-09-17, migration 20260917090504). A child's own login is an auth account linked to their learner
 * with access_role 'self'. Closing the parent's account must remove it — and must reach ONLY such accounts: another
 * family's child login, an invited co-parent, and an adult who somehow holds a 'self' row all stay.
 */
describe('deleting an account removes its children\'s logins, and nothing else', () => {
  const C1 = '0000c001-0000-4000-8000-000000000000'   // family A's child login
  const C2 = '0000c002-0000-4000-8000-000000000000'   // family B's child login
  const V  = '0000c003-0000-4000-8000-000000000000'   // an invited co-parent viewing family A's child
  const D  = '0000c004-0000-4000-8000-000000000000'   // an adult with their own learner AND a stray 'self' row on A's child
  const LD = '0000c005-0000-4000-8000-000000000000'
  let db: PGlite
  const users = async () => (await db.query<{ id: string }>(`select id from auth.users where id in ('${C1}','${C2}','${V}','${D}') order by id`)).rows.map(r => r.id)

  beforeAll(async () => {
    ({ db } = await loadSchema())
    await seedFamily(db, A, [LA], 'a@example.com')
    await seedFamily(db, B, [LB], 'b@example.com')
    await db.exec(`
      insert into auth.users (id, email, email_confirmed_at) values
        ('${C1}', 'kid1@learner.adaptivelearn.invalid', now()), ('${C2}', 'kid2@learner.adaptivelearn.invalid', now()),
        ('${V}', 'coparent@example.com', now()), ('${D}', 'other@example.com', now());`)
    // D's consent cannot be created until D's auth.users row exists, and an await inside the
    // template above would have run first — see the same trap in lessonPoints.test.ts.
    const dConsent = await grantedConsent(db, D)
    await db.exec(`
      insert into public.learners (id, display_name, created_by, age_group, consent_id, attested_notice_version) values ('${LD}', 'D kid', '${D}', '3-5', '${dConsent}', '${FIXTURE_NOTICE}');
      insert into public.learner_access (learner_id, parent_id, access_role) values
        ('${LA}', '${C1}', 'self'), ('${LB}', '${C2}', 'self'), ('${LA}', '${V}', 'viewer'), ('${LA}', '${D}', 'self');
    `)
  }, 120_000)

  it('removes family A\'s child login (account, profile and access) and reports it, keeping the other three', async () => {
    expect(await users()).toEqual([C1, C2, V, D])   // positive control: all four exist before
    const { rows } = await callDelete(db, A, 'a@example.com', 'a@example.com')
    expect((rows[0] as { counts: Record<string, number> }).counts.child_logins).toBe(1)
    expect(await users()).toEqual([C2, V, D])
    const left = async (sql: string) => Number((await db.query<{ n: number }>(`select count(*)::int as n from ${sql}`)).rows[0].n)
    expect(await left(`public.profiles where id = '${C1}'`)).toBe(0)
    expect(await left(`public.learner_access where parent_id = '${C1}'`)).toBe(0)
    expect(await left(`public.learner_access where parent_id = '${C2}' and access_role = 'self'`)).toBe(1)
  })
})
