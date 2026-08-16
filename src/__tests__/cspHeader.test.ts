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

  it('the allowances every AR chapter depends on are still there', async () => {
    // Enforcing the policy without these kills the 9–11 band's camera, and nothing fails until a
    // child opens it: MediaPipe fetches WASM from jsDelivr, its model from storage.googleapis.com,
    // instantiates WebAssembly, and runs its detector in a blob: worker.
    const p = await csp('production')
    expect(p).toContain("'wasm-unsafe-eval'")
    expect(p).toMatch(/script-src [^;]*https:\/\/cdn\.jsdelivr\.net/)
    expect(p).toMatch(/connect-src [^;]*https:\/\/storage\.googleapis\.com/)
    expect(p).toMatch(/worker-src [^;]*blob:/)
    // The mobile-autoplay unlock plays a `data:` WAV inside a user gesture; blocked, every recorded
    // voice clip in bands 12–18 silently falls back to browser speech. Found on prod, in the console.
    expect(p).toMatch(/media-src [^;]*data:/)
    expect(p).toContain("frame-ancestors 'none'")
    expect(p).toContain("object-src 'none'")
  })
})
