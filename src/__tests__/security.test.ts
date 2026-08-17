/**
 * The security properties from the 2026-08-17 audit that a future edit could silently undo.
 *
 * Each one is here because it is INVISIBLE in review: nothing type-checks, nothing fails at runtime,
 * and the app keeps working while the protection is gone.
 *
 * 1. NO DOM-XSS SINKS. This is the load-bearing one. The shipped CSP carries
 *    `script-src 'unsafe-inline'` (Next's inline bootstrap needs it, and removing it means a
 *    per-request nonce, which would force every statically-prerendered page dynamic). That is only
 *    an acceptable risk because the app has NO injection sink — React escapes by default and
 *    nothing writes raw HTML. The day someone adds `dangerouslySetInnerHTML`, the CSP stops being
 *    a backstop and the accepted risk quietly becomes a real one. So the premise is gated, not the
 *    header: keep this true and `'unsafe-inline'` stays tolerable.
 *
 * 2. `fetch` DOES NOT THROW ON 4xx/5xx. A bare `await fetch(...)` in a write path reports a 403 as
 *    success. `/api/lead` shipped exactly that, so a revoked grant would have thrown every lead away
 *    while returning `{ok:true}`. Both server write paths must read `res.ok`.
 *
 * 3. THE RATE LIMITER MUST NOT WIPE ALL COUNTERS. `hits.clear()` on a full map makes filling the map
 *    the bypass — flood it and every abuser's count resets. Eviction must be partial.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = join(__dirname, '..')

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return filesUnder(path)
    return /\.tsx?$/.test(name) ? [path] : []
  })
}

const rel = (p: string) => p.slice(SRC.length + 1)

describe('security', () => {
  it('has no DOM-XSS sinks — the premise that makes CSP unsafe-inline tolerable', () => {
    // Anchored on real syntax, not prose, so a comment discussing the rule cannot trip it.
    const SINKS: [RegExp, string][] = [
      [/dangerouslySetInnerHTML\s*=/, 'dangerouslySetInnerHTML'],
      [/\.innerHTML\s*=[^=]/, 'innerHTML assignment'],
      [/\.outerHTML\s*=[^=]/, 'outerHTML assignment'],
      [/\bnew Function\s*\(/, 'new Function()'],
      [/\bdocument\.write\s*\(/, 'document.write()'],
    ]
    const violations = filesUnder(SRC)
      .filter(p => !rel(p).startsWith('__tests__'))
      .flatMap(p => {
        const src = readFileSync(p, 'utf8')
        return SINKS.filter(([re]) => re.test(src)).map(([, label]) => `${rel(p)}: ${label}`)
      })
    expect(violations).toEqual([])
  })

  it('server write paths check res.ok — fetch does not throw on 4xx/5xx', () => {
    for (const f of ['app/api/lead/route.ts', 'infra/errorSink.ts']) {
      const src = readFileSync(join(SRC, f), 'utf8')
      expect(src, `${f} must read res.ok on its fetch`).toMatch(/res\.ok/)
    }
  })

  it('the rate limiter never wipes every counter at once', () => {
    const src = readFileSync(join(SRC, 'app/api/_rateLimit.ts'), 'utf8')
    // `__resetRateLimit` is the documented test seam and is allowed to clear.
    const body = src.slice(0, src.indexOf('export function __resetRateLimit'))
    // Strip comments first: the file EXPLAINS why it must not call `hits.clear()`, and a source
    // pattern that matches its own prose reports the file it was written to protect.
    const code = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    expect(code).not.toMatch(/hits\.clear\s*\(/)
  })

  it('does not collect a child date of birth anywhere', () => {
    const violations = filesUnder(SRC)
      .filter(p => !rel(p).startsWith('__tests__'))
      .filter(p => /date_of_birth/.test(readFileSync(p, 'utf8')))
      .map(rel)
    expect(violations).toEqual([])
  })
})
