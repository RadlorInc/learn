/**
 * The one thing that must never be true of the shipped CSP.
 *
 * `script-src` carries `'unsafe-eval'` in DEV, because React's development build calls `eval()` for
 * its debugging features and without it every page logs a console error — which silently broke the
 * C7 chapter gate (contract: zero console errors) against the dev server it is documented to drive.
 * That allowance is the single most dangerous thing in the policy if it ever reaches production, and
 * it is a one-character edit away from doing so. `next.config.ts` is not otherwise gated at all.
 */
import { describe, it, expect } from 'vitest'
import config from '../../next.config'

/** Drive the real `headers()` at a given NODE_ENV and pull out the policy the browser would get. */
async function header(key: string, env: string, supabaseUrl?: string): Promise<string> {
  // NODE_ENV is readonly in the Next type defs; the config reads it at call time, so it has to move.
  const env_ = process.env as Record<string, string | undefined>
  const was = env_.NODE_ENV, wasUrl = env_.NEXT_PUBLIC_SUPABASE_URL
  env_.NODE_ENV = env
  if (supabaseUrl !== undefined) env_.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl
  try {
    const rules = await config.headers!()
    const h = rules.flatMap((r) => r.headers).find((x) => x.key === key)
    return h!.value
  } finally {
    env_.NODE_ENV = was
    if (wasUrl === undefined) delete env_.NEXT_PUBLIC_SUPABASE_URL
    else env_.NEXT_PUBLIC_SUPABASE_URL = wasUrl
  }
}
const csp = (env: string, supabaseUrl?: string) => header('Content-Security-Policy', env, supabaseUrl)

const scriptSrc = (policy: string) => policy.split('; ').find((d) => d.startsWith('script-src '))!

describe('Content-Security-Policy', () => {
  it("⚠️ production script-src has NO 'unsafe-eval'", async () => {
    // Matched with the surrounding spaces so it cannot hit `'wasm-unsafe-eval'`, which is a
    // different and much narrower allowance (WebAssembly only) that MediaPipe genuinely needs.
    expect(scriptSrc(await csp('production'))).not.toMatch(/ 'unsafe-eval'/)
  })

  it("dev script-src DOES carry 'unsafe-eval', or the chapter gate cannot run locally", async () => {
    expect(scriptSrc(await csp('development'))).toMatch(/ 'unsafe-eval'/)
  })

  it('grants nothing for code that is not here any more', async () => {
    /**
     * ⚠️ THIS ASSERTION WAS INVERTED ON 2026-09-20 AND THAT IS THE POINT. It used to require
     * 'wasm-unsafe-eval', jsDelivr, storage.googleapis.com and a blob: worker, because MediaPipe
     * hand-tracking needed all four. The AR chapters were deleted; the grants were not load-bearing
     * any more, and a grant nobody uses is reach nobody re-examines.
     *
     * So it now fails the other way: re-adding any of them WITHOUT the code that needs them goes
     * red. Put them back in the same commit as a real WASM/CDN dependency, never ahead of one.
     */
    const p = await csp('production')
    expect(p, "'wasm-unsafe-eval' is granted but nothing runs WASM").not.toContain("'wasm-unsafe-eval'")
    expect(p, 'jsDelivr is granted but nothing loads from it').not.toMatch(/https:\/\/cdn\.jsdelivr\.net/)
    expect(p, 'storage.googleapis.com is granted but nothing fetches from it').not.toMatch(/https:\/\/storage\.googleapis\.com/)
    expect(p, 'a blob: worker is granted but only our own service worker exists').not.toMatch(/worker-src [^;]*blob:/)
  })

  it('keeps the allowances the app still depends on', async () => {
    const p = await csp('production')
    // The mobile-autoplay unlock plays a `data:` WAV inside a user gesture; blocked, every recorded
    // lesson clip silently falls back to browser speech. Found on prod, in the console.
    expect(p).toMatch(/media-src [^;]*data:/)
    expect(p).toContain("frame-ancestors 'none'")
    expect(p).toContain("object-src 'none'")
  })

  /**
   * SEC-11 (docs/review/SECURITY-AUDIT.md). The app talks to ONE Supabase project; a
   * `*.supabase.co` wildcard also lets injected script post to an attacker's project. The project
   * URL below is written out by hand, as production's shape (measured on radlic.com's bundle).
   */
  const PROJECT = 'https://abcdefghijklmnopqrst.supabase.co'
  const connectSrc = (p: string) => p.split('; ').find((d) => d.startsWith('connect-src '))!

  it('connect-src names the one Supabase project, REST and realtime, and no wildcard', async () => {
    const c = connectSrc(await csp('production', PROJECT))
    expect(c).not.toContain('*.supabase.co')
    // positive control: the app's own project IS reachable, over https AND wss
    expect(c.split(' ')).toEqual(["connect-src", "'self'", 'https://abcdefghijklmnopqrst.supabase.co', 'wss://abcdefghijklmnopqrst.supabase.co'])
  })

  it('a local stack URL keeps its port and maps http to ws', async () => {
    expect(connectSrc(await csp('development', 'http://127.0.0.1:54321/'))).toBe(
      "connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321")
  })

  it('a build with no Supabase URL falls back to the wildcard rather than breaking sign-in', async () => {
    expect(connectSrc(await csp('production', ''))).toBe("connect-src 'self' https://*.supabase.co wss://*.supabase.co")
  })

  it('Permissions-Policy grants no camera — nothing opens one since the AR chapters went', async () => {
    const pp = await header('Permissions-Policy', 'production')
    expect(pp).toContain('camera=()')
    expect(pp).not.toContain('camera=(self)')
    expect(pp).toContain('microphone=()')
  })
})
