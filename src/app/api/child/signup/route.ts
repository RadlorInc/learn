import { NextResponse, type NextRequest } from 'next/server'
import { callerKey, overLimit } from '../../_rateLimit'

/**
 * A child's first sign-in: class code + their own name + a password they choose.
 *
 * ⚠️⚠️ THIS IS THE ONLY PLACE A CHILD ACCOUNT IS EVER CREATED OR LINKED, AND IT HOLDS THE SERVICE
 * ROLE. Read the whole file before changing any of it.
 *
 * WHY IT HAS TO BE SERVER-SIDE, rather than a `security definer` RPC the client could call: a child
 * has no email address, so their account carries a synthesized one that nobody will ever confirm —
 * and `handle_new_user` only creates a profile once `email_confirmed_at` is set. Only the admin API
 * can create a user pre-confirmed. Since the service role is needed regardless, adding an RPC as
 * well would be a second, weaker door onto the same room.
 *
 * WHAT IT REFUSES, and each one matters:
 *   · a join code that matches no class;
 *   · a name that matches no child on that class's roster;
 *   · a name matching MORE than one child — it refuses rather than guessing, because guessing hands
 *     one child's account to another child;
 *   · a child who has already been claimed. FIRST CLAIM WINS AND A CLAIM IS FINAL.
 *
 * ⚠️ THE RESIDUAL RISK, WRITTEN DOWN BECAUSE IT CANNOT BE CODED AWAY: anyone holding a class code
 * can claim any UNCLAIMED child on that roster by typing their name. A name is a username, not a
 * secret — that is what "the child's username is their name" means, and it was the ask. What limits
 * it is that a claim is one-shot, visible to the teacher, and the code is rotatable. If a real
 * school needs more, the answer is a per-child PIN the teacher hands out, not a longer class code.
 *
 * ⚠️ It is rate-limited unlike /api/stripe/webhook, and for the opposite reason: an anonymous caller
 * CAN create a row here, so the limiter is the thing standing between a scraper and a roster.
 */

const LIMIT = 8
const WINDOW_MS = 60_000
const MIN_PASSWORD = 6

/** The synthesized address. Never shown to the child — they sign in with their name. */
function emailFor(name: string, joinCode: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'child'
  // `.invalid` is reserved by RFC 2606 and can never be routed, so one of these addresses cannot
  // become a real mailbox and no confirmation mail can ever be sent to a child.
  return `${slug}.${joinCode.toLowerCase()}@learner.milo.invalid`
}

async function rest(url: string, key: string, path: string, init?: RequestInit) {
  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json', ...(init?.headers ?? {}),
    },
  })
}

export async function POST(req: NextRequest) {
  if (overLimit(callerKey(req, 'child-signup'), LIMIT, WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  let body: { joinCode?: string; name?: string; password?: string }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 }) }

  const joinCode = (body.joinCode ?? '').trim().toUpperCase()
  const name     = (body.name ?? '').trim().replace(/\s+/g, ' ')
  const password = body.password ?? ''

  if (!joinCode || !name) return NextResponse.json({ ok: false, error: 'missing' }, { status: 400 })
  if (password.length < MIN_PASSWORD) return NextResponse.json({ ok: false, error: 'weak_password' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  // ⚠️ NO ANON FALLBACK, unlike /api/lead. If this ever worked on the anon key it would mean the
  // roster was readable from a browser, so a missing key must stop the flow rather than degrade it.
  if (!url || !key) return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })

  // 1. The class.
  const gRes = await rest(url, key, `/rest/v1/grades?select=id,age_group&join_code=eq.${encodeURIComponent(joinCode)}`)
  if (!gRes.ok) return NextResponse.json({ ok: false, error: 'lookup_failed' }, { status: 502 })
  const grades = await gRes.json() as { id: string; age_group: string }[]
  if (!grades.length) return NextResponse.json({ ok: false, error: 'no_class' }, { status: 404 })
  const grade = grades[0]

  // 2. The child on that roster. Matched case-insensitively — they are typing their own name from
  //    memory, and `Aarav` and `aarav` are the same six-year-old.
  const lRes = await rest(url, key,
    `/rest/v1/learners?select=id,display_name&grade_id=eq.${grade.id}`)
  if (!lRes.ok) return NextResponse.json({ ok: false, error: 'lookup_failed' }, { status: 502 })
  const roster = await lRes.json() as { id: string; display_name: string }[]
  const matches = roster.filter(l => l.display_name.trim().toLowerCase() === name.toLowerCase())

  if (matches.length === 0) return NextResponse.json({ ok: false, error: 'no_child' }, { status: 404 })
  // ⚠️ Refuse, never guess. Two children called Aarav in one class is the case where picking either
  // one is worse than failing: it silently gives one child the other's account and progress.
  if (matches.length > 1)  return NextResponse.json({ ok: false, error: 'ambiguous_name' }, { status: 409 })
  const learner = matches[0]

  // 3. Already claimed? A claim is final, so this is a refusal and not an overwrite.
  const aRes = await rest(url, key,
    `/rest/v1/learner_access?select=id&learner_id=eq.${learner.id}&access_role=eq.self`)
  if (!aRes.ok) return NextResponse.json({ ok: false, error: 'lookup_failed' }, { status: 502 })
  if ((await aRes.json() as unknown[]).length) {
    return NextResponse.json({ ok: false, error: 'already_claimed' }, { status: 409 })
  }

  // 4. The account, created already-confirmed because nobody can ever confirm a `.invalid` address.
  const email = emailFor(learner.display_name, joinCode)
  const uRes = await rest(url, key, '/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  if (!uRes.ok) {
    // A duplicate address means two classes produced the same slug+code, which the unique join code
    // makes impossible — so this is genuinely unexpected and must not be reported as success.
    const detail = await uRes.text()
    console.error('[child/signup] create user failed', uRes.status, detail.slice(0, 200))
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 502 })
  }
  const created = await uRes.json() as { id?: string }
  if (!created.id) return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 502 })

  // 5. The link. THIS is what every RLS policy reads — see the migration's section 3.
  const linkRes = await rest(url, key, '/rest/v1/learner_access', {
    method: 'POST',
    body: JSON.stringify({ learner_id: learner.id, parent_id: created.id, access_role: 'self' }),
  })
  if (!linkRes.ok) {
    // ⚠️ The account now exists but reaches nothing. Roll it back rather than leaving a child with
    // credentials that sign in to an empty app — a half-made account is the state nobody debugs.
    await rest(url, key, `/auth/v1/admin/users/${created.id}`, { method: 'DELETE' })
    console.error('[child/signup] link failed', linkRes.status, (await linkRes.text()).slice(0, 200))
    return NextResponse.json({ ok: false, error: 'link_failed' }, { status: 502 })
  }

  // 6. The profile. `learner` is the least privileged role in the enum, so writing it here grants
  //    nothing — it is what stops the child being offered the Teacher/Parent picker.
  await rest(url, key, '/rest/v1/profiles', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: created.id, role: 'learner', display_name: learner.display_name, avatar_index: 0 }),
  })

  // The client signs in with this; the child never sees or types it.
  return NextResponse.json({ ok: true, email })
}

/** Where a returning child's sign-in resolves their name + class code back to their address. */
export async function GET(req: NextRequest) {
  if (overLimit(callerKey(req, 'child-signin'), LIMIT, WINDOW_MS)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }
  const joinCode = (req.nextUrl.searchParams.get('joinCode') ?? '').trim().toUpperCase()
  const name     = (req.nextUrl.searchParams.get('name') ?? '').trim().replace(/\s+/g, ' ')
  if (!joinCode || !name) return NextResponse.json({ ok: false, error: 'missing' }, { status: 400 })
  // ⚠️ Deliberately does NOT check the roster and never says whether the child exists. It is a pure
  // string derivation, so an unauthenticated caller learns nothing about who is in a class — the
  // password check at sign-in is what refuses them. The POST above can afford to be specific
  // because it needs a password to do anything; this cannot.
  return NextResponse.json({ ok: true, email: emailFor(name, joinCode) })
}
