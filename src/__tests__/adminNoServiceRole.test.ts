/**
 * The service role key must never reach anything the browser can load.
 *
 * ⚠️ WHAT A VALUE-GREP OF THE BUNDLE CAN AND CANNOT PROVE. Grepping `.next/static` for the key's
 * VALUE is the right check and it was run (2026-09-05) — the positive control passed, i.e. the same
 * grep does find the anon key, so the instrument works. But `SUPABASE_SERVICE_ROLE_KEY` is NOT set
 * in the local environment, so there was no value to search for: that run proves the grep works and
 * nothing about the key. Re-run it against a Vercel build, where the variable exists.
 *
 * What IS provable here is structural, and it is what actually stops the leak: Next.js only inlines
 * env vars whose name begins with NEXT_PUBLIC_. A key without that prefix cannot reach the client
 * bundle however carelessly it is referenced, and a key WITH it cannot be kept out however careful
 * everyone is. So the name is the mechanism, and this asserts the name.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

const SRC = resolve(__dirname, '..')
function walk(d: string, out: string[] = []): string[] {
  for (const e of readdirSync(d)) {
    const p = join(d, e)
    if (statSync(p).isDirectory()) { if (e !== '__tests__') walk(p, out) }
    else if (/\.tsx?$/.test(p)) out.push(p)
  }
  return out
}
const FILES = walk(SRC)

describe('the service role key stays server-only', () => {
  it('no NEXT_PUBLIC_ variable name contains SERVICE', () => {
    const bad: string[] = []
    for (const f of FILES) {
      for (const m of readFileSync(f, 'utf8').matchAll(/NEXT_PUBLIC_[A-Z0-9_]*/g)) {
        if (/SERVICE/.test(m[0])) bad.push(`${f.replace(SRC, 'src')}: ${m[0]}`)
      }
    }
    expect(bad, `a NEXT_PUBLIC_ name mentioning SERVICE is inlined into the client bundle:\n  ${bad.join('\n  ')}`).toEqual([])
  })

  it('positive control: the regex does find the NEXT_PUBLIC_ names that exist', () => {
    // Without this, "found nothing" and "cannot see anything" are the same result.
    const names = new Set<string>()
    for (const f of FILES) for (const m of readFileSync(f, 'utf8').matchAll(/NEXT_PUBLIC_[A-Z0-9_]*/g)) names.add(m[0])
    expect(names.has('NEXT_PUBLIC_SUPABASE_URL')).toBe(true)
    expect(names.size).toBeGreaterThan(1)
  })

  it("/admin's read path never references the service role key", () => {
    // The route forwards the CALLER'S token so admin_assert() decides. If it ever reached for the
    // service role it would bypass RLS for every request, from a file the browser can trigger.
    const route = readFileSync(resolve(SRC, 'app/api/admin/metrics/route.ts'), 'utf8')
    // ⚠️ ANCHORED ON A REAL READ, not the string. The first version matched /SERVICE_ROLE/ and went
    // red on the file's own comment saying the key is never read here — a gate tripping on its own
    // prose, which CLAUDE.md already records as a way to waste a morning.
    expect(route).not.toMatch(/process\.env\.[A-Z_]*SERVICE_ROLE/)
    expect(route).toMatch(/Authorization: auth/)   // it forwards, it does not impersonate
  })

  it('no client component imports a service-role client', () => {
    const bad = FILES.filter(f => {
      const s = readFileSync(f, 'utf8')
      return s.includes("'use client'") && /process\.env\.[A-Z_]*SERVICE_ROLE/.test(s)
    })
    expect(bad.map(f => f.replace(SRC, 'src'))).toEqual([])
  })
})
