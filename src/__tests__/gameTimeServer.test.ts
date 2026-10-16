/**
 * The game's end time comes from the database, not the URL (founder, 11 Oct: a child who edited `until` in the game's
 * URL played longer than they paid for; one who removed the query played with no limit at all). Two halves:
 * /api/game-time asks `game_wallet` with the caller's own token and answers seconds left by the server's clock;
 * public/play-time.js (in every game) plays exactly that long, counted on performance.now(), and sends the child back
 * to /play when it cannot get an answer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const KID = '11111111-2222-4333-8444-555555555555'

describe('/api/game-time', () => {
  const calls: { url: string; init: RequestInit }[] = []
  let answer: () => Response
  beforeEach(() => {
    calls.length = 0
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.test')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => { calls.push({ url, init }); return answer() }))
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-11T10:00:00Z'))
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })
  const ask = async (learner: string, token?: string) => {
    const { GET } = await import('@/app/api/game-time/route')
    const res = await GET(new Request(`https://radlic.test/api/game-time?learner=${learner}`, token ? { headers: { authorization: `Bearer ${token}` } } : {}))
    return { status: res.status, body: await res.json() }
  }
  const wallet = (playing_until: string | null) => () => Response.json({ balance: 40, playing_until })

  it('this child\'s adult: seconds left by the server\'s clock, asked with THEIR token for THIS child', async () => {
    answer = wallet('2026-10-11T10:01:30Z')
    expect(await ask(KID, 'adult-token')).toEqual({ status: 200, body: { left: 90, paused: false } })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://db.example.test/rest/v1/rpc/game_wallet')
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer adult-token')
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ p_learner: KID })
  })
  it('no game running, or one that has ended: 0 seconds', async () => {
    answer = wallet(null)
    expect((await ask(KID, 't')).body).toEqual({ left: 0, paused: false })
    answer = wallet('2026-10-11T09:59:00Z')
    expect((await ask(KID, 't')).body).toEqual({ left: 0, paused: false })
  })
  it('somebody else\'s child: game_wallet refuses (42501), and so does the route', async () => {
    answer = () => Response.json({ code: '42501', message: 'forbidden' }, { status: 403 })
    expect(await ask(KID, 'other-adult')).toEqual({ status: 403, body: { error: 'forbidden' } })
  })
  it('no token, or one the database rejects: 401, and without a token the database is not asked', async () => {
    answer = wallet('2026-10-11T10:01:30Z')
    expect((await ask(KID)).status).toBe(401)
    expect(calls).toHaveLength(0)
    answer = () => Response.json({ code: 'PGRST301' }, { status: 401 })
    expect((await ask(KID, 'expired')).status).toBe(401)
  })
  const act = async (body: unknown, token = 'adult-token') => {
    const { POST } = await import('@/app/api/game-time/route')
    const res = await POST(new Request(`https://radlic.test/api/game-time?learner=${KID}`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(body) }))
    return { status: res.status, body: await res.json() }
  }
  it('paused: GET answers the paused seconds and paused: true (the clock is not counted down)', async () => {
    answer = () => Response.json({ balance: 40, playing_until: null, paused_left: 75 })
    expect((await ask(KID, 't')).body).toEqual({ left: 75, paused: true })
  })
  it('POST pause / resume calls pause_game_time / resume_game_time with THEIR token for THIS child', async () => {
    answer = () => Response.json({ balance: 40, playing_until: null, paused_left: 75 })
    expect(await act({ action: 'pause' })).toEqual({ status: 200, body: { left: 75, paused: true } })
    answer = wallet('2026-10-11T10:01:15Z')
    expect(await act({ action: 'resume' })).toEqual({ status: 200, body: { left: 75, paused: false } })
    expect(calls.map(c => c.url)).toEqual(['https://db.example.test/rest/v1/rpc/pause_game_time', 'https://db.example.test/rest/v1/rpc/resume_game_time'])
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer adult-token')
    expect(JSON.parse(calls[1].init.body as string)).toEqual({ p_learner: KID })
  })
  it('POST: another adult\'s child is refused (42501 → 403); any other action is refused before anything is asked', async () => {
    answer = () => Response.json({ code: '42501', message: 'forbidden' }, { status: 403 })
    expect(await act({ action: 'pause' }, 'other-adult')).toEqual({ status: 403, body: { error: 'forbidden' } })
    calls.length = 0
    expect((await act({ action: 'end' })).status).toBe(400)
    expect((await act(null)).status).toBe(400)
    expect(calls).toHaveLength(0)
  })
  it('a learner that is not an id is refused before anything is asked', async () => {
    expect((await ask('kid-1', 't')).status).toBe(400)
    expect(calls).toHaveLength(0)
  })
})

describe('public/play-time.js, in every game', () => {
  const replace = vi.fn()
  let server: () => Promise<Response>
  beforeEach(() => {
    vi.resetModules(); replace.mockReset()
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearInterval', 'performance', 'Date'] })
    vi.stubGlobal('location', { ...window.location, hostname: 'radlic.com', replace })
    vi.stubGlobal('fetch', vi.fn(() => server()))
    localStorage.setItem('milo-auth', JSON.stringify({ access_token: 'adult-token' }))
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); localStorage.clear() })
  const start = async (learner: string | null) => {
    const { playTime } = await import('../../public/play-time.js')
    const shown: number[] = [], done = vi.fn()
    playTime({ learner, back: '/play?game=beathop', show: (s: number) => shown.push(s), done })
    return { shown, done }
  }
  const left = (s: number) => () => Promise.resolve(Response.json({ left: s }))
  // A server like the real one: the time is up at a fixed moment, and "left" shrinks with its clock.
  const until = (s: number) => { const at = Date.now() + s * 1000; return () => Promise.resolve(Response.json({ left: Math.max(0, Math.ceil((at - Date.now()) / 1000)) })) }
  const hidden = (h: boolean) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); document.dispatchEvent(new Event('visibilitychange')) }
  const asks = () => vi.mocked(fetch).mock.calls.length
  // Games started by earlier tests still listen on `document`, so a visibility test counts only its own child's asks.
  const KID2 = '22222222-2222-4222-8222-222222222222'
  const asksFor = (id: string) => vi.mocked(fetch).mock.calls.filter(([u]) => String(u).endsWith(id)).length

  it('plays exactly the seconds the server gave, then saves (done) and goes back to /play', async () => {
    server = until(5)
    const { shown, done } = await start(KID)
    await vi.advanceTimersByTimeAsync(4000)
    expect(done).not.toHaveBeenCalled()
    expect(shown.at(-1)).toBe(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(done).toHaveBeenCalledOnce()
    expect(replace).not.toHaveBeenCalled() // the "time's up" message shows first
    await vi.advanceTimersByTimeAsync(2500)
    expect(replace).toHaveBeenCalledWith('/play?game=beathop')
  })
  it('asks with the signed-in adult\'s token for this child', async () => {
    server = left(60)
    await start(KID)
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`/api/game-time?learner=${KID}`)
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer adult-token')
  })
  it('moving the device\'s clock forward or back changes nothing: it counts on performance.now()', async () => {
    server = () => Promise.resolve(Response.json({ left: asks() === 1 ? 5 : 0 })) // the server's own clock, not the device's
    const { done } = await start(KID)
    await vi.advanceTimersByTimeAsync(1000)
    vi.setSystemTime(Date.now() - 3_600_000) // the child sets the clock an hour back
    await vi.advanceTimersByTimeAsync(4000)
    expect(done).toHaveBeenCalledOnce()
  })
  it('on screen, the server is asked every 3 minutes (not every 30 s) and its answer wins: a stop elsewhere ends it', async () => {
    let s = 600
    server = () => Promise.resolve(Response.json({ left: s }))
    const KID3 = '33333333-3333-4333-8333-333333333333'
    const { done } = await start(KID3)
    await vi.advanceTimersByTimeAsync(10 * 60_000 - 1)
    expect(asksFor(KID3), 'asks in 10 minutes on screen: open + one every 3 min').toBe(1 + 3)
    s = 0 // stopped elsewhere
    await vi.advanceTimersByTimeAsync(3 * 60_000)
    expect(done).toHaveBeenCalledOnce()
  })
  it('a hidden tab asks nothing, and asks at once when it is shown again (a sleeping device may have paused its clock)', async () => {
    let s = 900
    server = () => Promise.resolve(Response.json({ left: s }))
    const { done } = await start(KID2)
    hidden(true)
    await vi.advanceTimersByTimeAsync(10 * 60_000)
    expect(asksFor(KID2), 'asked while hidden').toBe(1)
    s = 0 // the server's clock ran out while the tab was hidden
    hidden(false)
    await vi.advanceTimersByTimeAsync(0) // asks go through one in-order queue: a microtask, not a second
    expect(asksFor(KID2), 'not asked the moment it was shown').toBe(2)
    await vi.advanceTimersByTimeAsync(1000)
    expect(done).toHaveBeenCalledOnce()
    hidden(false)
  })
  it('at 0 it asks once more: time bought meanwhile elsewhere keeps the game going instead of being cut off', async () => {
    let bought = false
    server = () => Promise.resolve(Response.json({ left: asks() === 1 ? 5 : bought ? 60 : 0 }))
    const { done } = await start(KID)
    bought = true // more minutes bought on another tab before the 5 s ran out
    await vi.advanceTimersByTimeAsync(5000)
    expect(done, 'cut off although the server had more time').not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(55_000)
    expect(done).not.toHaveBeenCalled()
    bought = false
    await vi.advanceTimersByTimeAsync(5000)
    expect(done).toHaveBeenCalledOnce()
  })
  it('a failed ask at 0 ends the game (it never grows)', async () => {
    let ok = true
    server = () => ok ? left(5)() : Promise.reject(new Error('offline'))
    const { done } = await start(KID)
    ok = false
    await vi.advanceTimersByTimeAsync(5000)
    expect(done).toHaveBeenCalledOnce()
  })
  it('a later failed ask keeps the last answer: the time runs out, it never grows', async () => {
    let ok = true
    server = () => ok ? left(40)() : Promise.reject(new Error('offline'))
    const { done } = await start(KID)
    ok = false
    await vi.advanceTimersByTimeAsync(39_000)
    expect(done).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1000)
    expect(done).toHaveBeenCalledOnce()
    expect(replace).not.toHaveBeenCalled()
  })
  it('no first answer (offline, signed out, not this adult\'s child): straight back to /play, no time to play', async () => {
    server = () => Promise.resolve(Response.json({ error: 'forbidden' }, { status: 403 }))
    const { done } = await start(KID)
    await vi.advanceTimersByTimeAsync(0)
    expect(replace).toHaveBeenCalledWith('/play?game=beathop')
    expect(done).not.toHaveBeenCalled()
  })
  // A server like the real one with a pause button: the time runs out at a fixed moment unless paused.
  const pausable = (s: number) => {
    let at = Date.now() + s * 1000, frozen: number | null = null
    const leftNow = () => frozen ?? Math.max(0, Math.ceil((at - Date.now()) / 1000))
    const posts: string[] = []
    const fn = (init?: RequestInit) => {
      const action = init?.body ? JSON.parse(init.body as string).action : null
      if (action) posts.push(action)
      if (action === 'pause' && frozen === null) frozen = leftNow()
      if (action === 'resume' && frozen !== null) { at = Date.now() + frozen * 1000; frozen = null }
      return Promise.resolve(Response.json({ left: leftNow(), paused: frozen !== null }))
    }
    return { fn, posts, paused: () => frozen !== null }
  }
  const startWith = async (learner: string, srv: ReturnType<typeof pausable>) => {
    // games started by earlier tests are still running: their asks get "no time left", never this server's
    vi.mocked(fetch).mockImplementation(((u: string, init?: RequestInit) => String(u).endsWith(learner) ? srv.fn(init) : left(0)()) as typeof fetch)
    const { playTime } = await import('../../public/play-time.js')
    const shown: number[] = [], done = vi.fn()
    const time = playTime({ learner, back: '/play?game=beathop', show: (s: number) => shown.push(s), done })!
    return { shown, done, time }
  }
  it('Pause stops the clock: the count stands still, the server is told, and nothing runs out while paused', async () => {
    const srv = pausable(30)
    const { shown, done, time } = await startWith('55555550-5555-4555-8555-555555555550', srv)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(shown.at(-1)).toBe(20)
    time.pause()
    await vi.advanceTimersByTimeAsync(0)
    expect(srv.posts).toEqual(['pause'])
    await vi.advanceTimersByTimeAsync(10 * 60_000)                 // ten minutes on the Pause screen
    expect(shown.at(-1), 'the count moved while paused').toBe(20)
    expect(done).not.toHaveBeenCalled()
  })
  it('Keep playing resumes it from where it stood, and it then runs out on time', async () => {
    const srv = pausable(30)
    const { shown, done, time } = await startWith('55555551-5555-4555-8555-555555555551', srv)
    await vi.advanceTimersByTimeAsync(10_000)
    time.pause()
    await vi.advanceTimersByTimeAsync(60_000)
    time.resume()
    await vi.advanceTimersByTimeAsync(0)
    expect(srv.posts).toEqual(['pause', 'resume'])
    await vi.advanceTimersByTimeAsync(5000)
    expect(shown.at(-1)).toBe(15)
    await vi.advanceTimersByTimeAsync(15_000)
    expect(done).toHaveBeenCalledOnce()
  })
  it('a failed pause keeps the count frozen here, and the next answer (the server\'s clock, still running) wins', async () => {
    const srv = pausable(300), KID4 = '44444444-4444-4444-8444-444444444444'
    const { shown, time } = await startWith(KID4, srv)
    await vi.advanceTimersByTimeAsync(0)
    let fail = true
    vi.mocked(fetch).mockImplementation(((u: string, init?: RequestInit) => !String(u).endsWith(KID4) ? left(0)() : fail ? Promise.reject(new Error('offline')) : srv.fn(init)) as typeof fetch)
    time.pause()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(shown.at(-1)).toBe(300)
    fail = false
    hidden(true); hidden(false)                                    // shown again: it asks
    await vi.advanceTimersByTimeAsync(1000)
    expect(shown.at(-1), 'the answer did not set the frozen count').toBe(240)   // 300 less the minute the server ran on
    expect(srv.paused(), 'the pause was not sent again').toBe(true)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(shown.at(-1), 'the count moved while paused').toBe(240)
  })
  it('a game left paused (tab closed) and opened again resumes the server\'s clock instead of playing on a paused one', async () => {
    const srv = pausable(60)
    srv.fn({ body: JSON.stringify({ action: 'pause' }) })         // paused, then the tab closed
    srv.posts.length = 0
    const { done } = await startWith('55555552-5555-4555-8555-555555555552', srv)
    await vi.advanceTimersByTimeAsync(0)
    expect(srv.posts).toEqual(['resume'])
    await vi.advanceTimersByTimeAsync(60_000)
    expect(done).toHaveBeenCalledOnce()
  })
  it('after time is up, pause and resume do nothing (the "Time\'s up" screen must not pause)', async () => {
    const srv = pausable(2)
    const { done, time } = await startWith('55555553-5555-4555-8555-555555555553', srv)
    await vi.advanceTimersByTimeAsync(2000)
    expect(done).toHaveBeenCalledOnce()
    time.pause(); time.resume()
    await vi.advanceTimersByTimeAsync(0)
    expect(srv.posts).toEqual([])
  })
  it('opened without /play (the query removed) on the real site: back to /play, nothing asked', async () => {
    server = left(600)
    await start(null)
    expect(replace).toHaveBeenCalledWith('/play?game=beathop')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('opened without /play on localhost (building the game): it plays, nothing asked', async () => {
    vi.stubGlobal('location', { ...window.location, hostname: 'localhost', replace })
    server = left(600)
    await start(null)
    expect(replace).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
})
