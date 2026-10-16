import { NextResponse } from 'next/server'

/**
 * GET /api/game-time?learner=<id> with the signed-in adult's token: how many seconds of paid game time this child has
 * left, by the server's clock, and whether it is paused. The games (public/play-time.js) ask this when they open, when
 * shown again, every 3 min on screen and at 0, and play only that long — the end time is never taken from the game's
 * URL or the device's clock, so editing either plays no longer.
 * POST /api/game-time?learner=<id> {"action":"pause"|"resume"} (same token): the game's Pause screen stops the paid
 * clock and "Keep playing" starts it again (pause_game_time / resume_game_time). Answers the same { left, paused }.
 *
 * The token goes straight to the database function, which refuses a caller who is not one of this child's adults
 * (42501): this route decides nothing itself. 401 = no or bad token, 403 = not this caller's child, 502 = the database
 * did not answer.
 */
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RPC = { pause: 'pause_game_time', resume: 'resume_game_time' } as const
const out = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'cache-control': 'no-store' } })

async function ask(req: Request, fn: string) {
  const learner = new URL(req.url).searchParams.get('learner') ?? ''
  if (!UUID.test(learner)) return out({ error: 'bad_learner' }, 400)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!url || !anon || !token) return out({ error: 'unauthenticated' }, 401)

  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { apikey: anon, Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ p_learner: learner }),
  }).catch(() => null)
  if (!res) return out({ error: 'unreachable' }, 502)
  if (res.status === 401) return out({ error: 'unauthenticated' }, 401)
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { code?: string } | null
    return err?.code === '42501' ? out({ error: 'forbidden' }, 403) : out({ error: 'failed' }, 502)
  }
  const wallet = (await res.json().catch(() => null)) as { playing_until?: string | null; paused_left?: number | null } | null
  if (!wallet) return out({ error: 'failed' }, 502)
  if (typeof wallet.paused_left === 'number') return out({ left: wallet.paused_left, paused: true })
  const ends = wallet.playing_until ? Date.parse(wallet.playing_until) : NaN
  return out({ left: Number.isFinite(ends) ? Math.max(0, Math.ceil((ends - Date.now()) / 1000)) : 0, paused: false })
}

export const GET = (req: Request) => ask(req, 'game_wallet')

export async function POST(req: Request) {
  const { action } = ((await req.json().catch(() => null)) ?? {}) as { action?: unknown }
  if (action !== 'pause' && action !== 'resume') return out({ error: 'bad_action' }, 400)
  return ask(req, RPC[action])
}
