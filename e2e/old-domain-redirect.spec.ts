import { test, expect } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import https from 'node:https'
import http from 'node:http'
import type { AddressInfo } from 'node:net'

/**
 * The old domain's redirect keeps the PATH, the QUERY and the #FRAGMENT — in a real browser, against the app's real
 * redirect response (`oldDomainRedirects` in src/app/site.ts, served by next.config.ts).
 *
 * ⚠️ WHY A BROWSER. A consent email sent before the move carries `https://adaptivelearn.radlor.com/consent/respond#t=…`,
 * and the token lives in the fragment, which is never sent to a server. So no server-side test can see whether it
 * survives: the property belongs to the browser following a Location that has no fragment of its own. The vitest half
 * (`oldDomainRedirect.test.ts`) asserts the Location carries none; this half watches Chromium keep the original's.
 *
 * ⚠️ WHY NOT `page.route`. Playwright does not intercept the request a browser makes by FOLLOWING a fulfilled
 * redirect — measured 2026-09-24: the follow-up went to the real radlic.com (then a parked domain) twice before this
 * was rewritten. So nothing here is routed. Chromium's resolver maps the two hosts to two local HTTPS servers and
 * EVERY OTHER NAME TO NOTFOUND, so a leak is impossible rather than unlikely:
 *   adaptivelearn.radlor.com → a local TLS proxy that forwards to the app with the old Host header, untouched
 *   radlic.com               → a local stub that reports `location.href`
 *
 * Needs the app running with SITE_URL = https://radlic.com (the default when NEXT_PUBLIC_SITE_URL is unset):
 *   E2E_BASE_URL=http://localhost:3072 npx playwright test e2e/old-domain-redirect.spec.ts
 */
const APP = new URL(process.env.E2E_BASE_URL || 'http://localhost:3017')

// ⚠️ Servers are made in beforeAll, never at module load: Playwright also loads this file to COLLECT the tests, and a
// server listening there keeps the runner alive for ever (measured: it hung until killed).
let oldHost: https.Server, newHost: https.Server
function servers() {
const dir = mkdtempSync(join(tmpdir(), 'old-domain-'))
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost',
  '-keyout', join(dir, 'k.pem'), '-out', join(dir, 'c.pem')], { stdio: 'ignore' })
const tls = { key: readFileSync(join(dir, 'k.pem')), cert: readFileSync(join(dir, 'c.pem')) }

oldHost = https.createServer(tls, async (req, res) => {
  // Forward to the app AS the old host, and hand back exactly what it said — including a 308, un-followed.
  // ⚠️ `http.request`, not `fetch`: `host` is a forbidden header to fetch and is silently dropped, so the app would
  // have answered as localhost and nothing would ever redirect.
  const up = http.request({ host: APP.hostname, port: APP.port, path: req.url, method: req.method, headers: { ...req.headers, host: 'adaptivelearn.radlor.com' } },
    r => { res.writeHead(r.statusCode!, r.headers); r.pipe(res) })
  req.pipe(up)
})
newHost = https.createServer(tls, (_req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' })
  res.end('<p id="at"></p><script>document.getElementById("at").textContent = location.href</script>')
})
}
const listen = (s: https.Server) => new Promise<number>(ok => s.listen(0, '127.0.0.1', () => ok((s.address() as AddressInfo).port)))
let rules = ''
test.beforeAll(async () => {
  servers()
  const [a, b] = [await listen(oldHost), await listen(newHost)]
  rules = `MAP adaptivelearn.radlor.com:443 127.0.0.1:${a}, MAP radlic.com:443 127.0.0.1:${b}, MAP * ~NOTFOUND`
})
test.afterAll(() => { oldHost.close(); newHost.close() })

async function browse(browserType: import('@playwright/test').BrowserType, url: string) {
  const browser = await browserType.launch({ args: [`--host-resolver-rules=${rules}`] })
  const page = await (await browser.newContext({ ignoreHTTPSErrors: true })).newPage()
  const hops: string[] = []
  page.on('response', r => hops.push(`${r.status()} ${new URL(r.url()).host}`))
  await page.goto(url)
  const at = await page.locator('#at').textContent()
  await browser.close()
  return { at, hops }
}

for (const [from, to] of [
  ['/consent/respond?lang=es#t=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'https://radlic.com/consent/respond?lang=es#t=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
  ['/consent/withdraw#t=BBBB', 'https://radlic.com/consent/withdraw#t=BBBB'],
  ['/email/unsubscribe#t=CCCC', 'https://radlic.com/email/unsubscribe#t=CCCC'],
  ['/parent?view=account', 'https://radlic.com/parent?view=account'],
  ['/', 'https://radlic.com/'],
] as const) {
  test(`${from} → ${to}`, async ({ playwright }) => {
    const { at, hops } = await browse(playwright.chromium, `https://adaptivelearn.radlor.com${from}`)
    expect(hops, 'control: the OLD host answered with the app\'s own permanent redirect, then the new host answered').toEqual(['308 adaptivelearn.radlor.com', '200 radlic.com'])
    expect(at).toBe(to)
  })
}

test('control: /api/* is not redirected — the old host still answers it (webhooks, one-click unsubscribe, cron)', async () => {
  const status = await new Promise<number>((ok, no) => http.get({ host: APP.hostname, port: APP.port, path: '/api/health', headers: { host: 'adaptivelearn.radlor.com' } },
    r => { r.resume(); ok(r.statusCode!) }).on('error', no))
  expect(status).toBe(200)
  const page = await new Promise<number>((ok, no) => http.get({ host: APP.hostname, port: APP.port, path: '/help', headers: { host: 'adaptivelearn.radlor.com' } },
    r => { r.resume(); ok(r.statusCode!) }).on('error', no))
  expect(page, 'control: the same request shape DOES see the redirect on a page').toBe(308)
})
