/**
 * radlic.com/ sends a signed-out visitor to the landing page on radlor.com, and nobody else anywhere (founder's
 * decision, 2026-09-25). Two halves, and both are needed:
 *   · `/` itself: signed out → radlor.com/radlic; signed in → home; could not tell → stays; the installed app → /auth.
 *   · every OTHER route: nothing sends anyone to radlor.com — no other page mounts the redirect, and no
 *     next.config rule touches radlic.com at all.
 * The browser half (a real page load on each route) is e2e/landing-redirect.spec.ts.
 *
 * ⚠️ The landing address is written out here by hand, never imported from site.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const LANDING = 'https://radlor.com/radlic'

const w = vi.hoisted(() => ({ session: null as unknown, throws: false, replaced: [] as string[], left: [] as string[] }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
const router = { replace: (u: string) => { w.replaced.push(u) } }
vi.mock('@/data/auth', () => ({
  getCurrentSession: async () => { if (w.throws) throw new Error('offline'); return w.session },
}))

let installed = false
beforeEach(() => {
  w.session = null; w.throws = false; w.replaced = []; w.left = []; installed = false
  Object.defineProperty(window, 'location', { configurable: true, value: { ...window.location, replace: (u: string) => { w.left.push(u) } } })
  window.matchMedia = ((q: string) => ({ matches: installed && q.includes('fullscreen'), addEventListener() {}, removeEventListener() {} })) as never
})

async function visitRoot() {
  const { default: ResumeSignedIn } = await import('@/app/ResumeSignedIn')
  const root = createRoot(document.createElement('div'))
  await act(async () => { root.render(createElement(ResumeSignedIn)) })
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
  root.unmount()
}

describe('radlic.com/', () => {
  it('signed out → the landing page on radlor.com, and nowhere in the app', async () => {
    await visitRoot()
    expect(w.left).toEqual([LANDING])
    expect(w.replaced).toEqual([])
  })

  it('signed in → home, and NOT the landing page (the positive twin)', async () => {
    w.session = { user: { id: 'u1' } }
    await visitRoot()
    expect(w.replaced).toEqual(['/parent'])
    expect(w.left).toEqual([])
  })

  it('could not tell (offline, storage blocked) → stays put', async () => {
    w.throws = true
    await visitRoot()
    expect(w.left).toEqual([])
    expect(w.replaced).toEqual([])
  })

  it('opened from the home screen, signed out → sign-in, never out to a web page', async () => {
    installed = true
    await visitRoot()
    expect(w.replaced).toEqual(['/auth'])
    expect(w.left).toEqual([])
  })
})

describe('every other route is untouched', () => {
  const APP = join(process.cwd(), 'src/app')
  const files = (readdirSync(APP, { recursive: true }) as string[]).filter(f => /\.(tsx?|mts)$/.test(f))

  it('reads the app folder (positive control: the known mounting page is found)', () => {
    expect(files).toContain('page.tsx')
    expect(files.length).toBeGreaterThan(40)
  })

  it('only src/app/page.tsx mounts the redirect', () => {
    const mounting = files.filter(f => /from ['"](\.\/|@\/app\/|\.\.\/)+ResumeSignedIn['"]/.test(readFileSync(join(APP, f), 'utf8')))
    expect(mounting).toEqual(['page.tsx'])
  })

  it('nothing else navigates to the landing page (the address lives in site.ts; only ResumeSignedIn leaves for it)', () => {
    const src = (f: string) => readFileSync(join(APP, f), 'utf8')
    expect(files.filter(f => src(f).includes('radlor.com/radlic'))).toEqual(['site.ts'])
    const leaves = files.filter(f => /LANDING_URL/.test(src(f)) && /location\.(replace|assign|href)/.test(src(f)))
    expect(leaves).toEqual(['ResumeSignedIn.tsx'])
  })

  it("no next.config rule applies to radlic.com's / (only the pre-rename host, and the two retired routes)", async () => {
    const { default: config } = await import('../../next.config')
    const rules = (await config.redirects?.()) ?? []
    const bare = rules.filter(r => !r.has)
    // N17 (2026-09-26): /menu and /demo were deleted and redirect on every host. Nothing else may.
    expect(bare.map(r => r.source).sort(), 'a redirect with no host condition applies to radlic.com').toEqual(['/demo', '/menu'])
    for (const r of rules.filter(r => r.has)) expect(r.has).toEqual([{ type: 'host', value: 'adaptivelearn.radlor.com' }])
  })
})
