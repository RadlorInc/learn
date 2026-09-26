#!/usr/bin/env node
// Live smoke for radlic.com — run after every production deploy that touches the app.
//
//   node scripts/smoke-live.mjs                      # all checks against https://radlic.com
//   SMOKE_SW=v239 node scripts/smoke-live.mjs        # after a service-worker bump
//   SMOKE_BASE=http://localhost:3000 SMOKE_ONLY=email-login node scripts/smoke-live.mjs
//
// Exit 0 = looked, every check passed · 1 = a check failed (named) · 2 = could not look (network,
// no browser). Never 0 for "could not look".
//
// ⚠️ THE SIGN-IN FORM IS NOT IN THE SERVER HTML. /auth ships 0 <input>s; the form is drawn in the
// browser. A curl check cannot see it, so `email-login` drives a real Chromium. And the field is
// deliberately `type="text"` in login mode (one field takes a parent's email OR a child's username,
// since 712e71a5), so it is found by its role — autocomplete="username" + the email placeholder —
// never by `type=email`, which was the wrong instrument once already (2026-09-26).
// ⚠️ The signed-out redirect `radlic.com/` → radlor.com/radlic is CLIENT-side too (HTTP says 200),
// so it is also checked in the browser, in a fresh (signed-out) context.
import { chromium } from '@playwright/test'

const BASE = (process.env.SMOKE_BASE ?? 'https://radlic.com').replace(/\/$/, '')
const SW = process.env.SMOKE_SW ?? 'v239'
const ONLY = process.env.SMOKE_ONLY
const LANDING = 'https://radlor.com/radlic'
const cb = () => `cb=${Date.now()}`

let failed = 0
let blind = 0
const ok = (m) => console.log(`  ok    ${m}`)
const bad = (m) => { console.log(`  FAIL  ${m}`); failed++ }
const cannot = (m) => { console.log(`  VOID  ${m} — could not look`); blind++ }

async function get(url, init) {
  try { return await fetch(url, { redirect: 'manual', ...init }) } catch (e) { cannot(`${url}: ${e.message}`); return null }
}

const checks = {
  async landing() {
    const r = await get(`${BASE}/?${cb()}`); if (!r) return
    const html = await r.text()
    r.status === 200 && html.includes(`rel="canonical" href="${LANDING}"`)
      ? ok(`/ 200, canonical → ${LANDING}`) : bad(`/ answered ${r.status} or its canonical is not ${LANDING}`)
    const l = await get(`${LANDING}?${cb()}`); if (!l) return
    const t = await l.text()
    l.status === 200 && /grades 3 to 8/i.test(t) ? ok(`${LANDING} 200, says "grades 3 to 8"`) : bad(`${LANDING} answered ${l.status} or lost "grades 3 to 8"`)
  },
  async waitlist() {
    const r = await get('https://radlor.com/waitlist'); if (!r) return
    r.status === 308 && r.headers.get('location')?.endsWith('/radlic')
      ? ok('radlor.com/waitlist → 308 /radlic') : bad(`radlor.com/waitlist answered ${r.status} → ${r.headers.get('location')}`)
  },
  async sw() {
    const r = await get(`${BASE}/sw.js?${cb()}`); if (!r) return
    const v = /const VERSION\s*=\s*'(v\d+)'/.exec(await r.text())?.[1]
    v === SW ? ok(`service worker ${v}`) : bad(`service worker is '${v}', expected ${SW}`)
  },
  async og() {
    const r = await get(`${BASE}/opengraph-image?${cb()}`); if (!r) return
    const b = new Uint8Array(await r.arrayBuffer())
    r.status === 200 && b[0] === 0x89 && b[1] === 0x50 ? ok('/opengraph-image is a real PNG') : bad(`/opengraph-image answered ${r.status}, not a PNG`)
  },
  async 'email-login'(browser) {
    const page = await (await browser.newContext()).newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${BASE}/auth?${cb()}`, { waitUntil: 'domcontentloaded' })
    // the state the defect lives in: AFTER the client has drawn the form
    const id = page.locator('input[autocomplete="username"][placeholder*="you@example.com"]')
    const pw = page.locator('input[type="password"][autocomplete="current-password"]')
    try { await id.first().waitFor({ state: 'visible', timeout: 15000 }) } catch { /* reported below */ }
    const idCount = await id.count(); const pwCount = await pw.count()
    idCount === 1 ? ok('/auth: the email-or-username field is drawn') : bad(`/auth: email-or-username field found ${idCount} time(s), expected 1`)
    pwCount === 1 ? ok('/auth: the password field is drawn') : bad(`/auth: password field found ${pwCount} time(s), expected 1`)
    if (idCount === 1) {
      await id.fill('smoke@example.com')
      ;(await id.inputValue()) === 'smoke@example.com' ? ok('/auth: the field takes an email address') : bad('/auth: the field did not keep a typed email')
    }
    ;(await page.getByRole('button', { name: 'Sign in', exact: true }).count()) >= 1 ? ok('/auth: a "Sign in" button') : bad('/auth: no "Sign in" button')
    ;(await page.getByRole('button', { name: 'Continue with Google' }).count()) === 1 ? ok('/auth: "Continue with Google"') : bad('/auth: no "Continue with Google"')
    errors.length ? bad(`/auth: ${errors.length} page error(s): ${errors[0].slice(0, 120)}`) : ok('/auth: no page errors')
  },
  async 'signed-out-redirect'(browser) {
    const page = await (await browser.newContext()).newPage()
    await page.goto(`${BASE}/?${cb()}`)
    try { await page.waitForURL((u) => u.href.startsWith(LANDING), { timeout: 15000 }); ok(`signed-out / → ${LANDING} (in the browser)`) }
    catch { bad(`signed-out / stayed at ${page.url()}`) }
  },
}

const names = ONLY ? ONLY.split(',') : Object.keys(checks)
console.log(`smoke: ${BASE} · ${names.join(', ')}`)
let browser = null
try {
  for (const n of names) {
    if (!checks[n]) { cannot(`unknown check '${n}'`); continue }
    if (checks[n].length && !browser) {
      try { browser = await chromium.launch() } catch (e) { cannot(`chromium: ${e.message.split('\n')[0]}`); continue }
    }
    try { await checks[n](browser) } catch (e) { cannot(`${n}: ${e.message.split('\n')[0]}`) }
  }
} finally { await browser?.close() }

if (failed) { console.log(`✗ ${failed} check(s) FAILED`); process.exit(1) }
if (blind) { console.log(`⚠️ ${blind} check(s) could not look — NOT reporting clean`); process.exit(2) }
console.log('✓ all checks passed'); process.exit(0)
