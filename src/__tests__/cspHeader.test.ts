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
async function csp(env: string): Promise<string> {
  // NODE_ENV is readonly in the Next type defs; the config reads it at call time, so it has to move.
  const env_ = process.env as Record<string, string | undefined>
  const was = env_.NODE_ENV
  env_.NODE_ENV = env
  try {
    const rules = await config.headers!()
    const h = rules.flatMap((r) => r.headers).find((x) => x.key === 'Content-Security-Policy')
    return h!.value
  } finally {
    env_.NODE_ENV = was
  }
}

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
})
