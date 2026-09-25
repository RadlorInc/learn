/**
 * Signed out, only radlic.com/ leaves for the landing page on radlor.com; every other route stays in the app.
 * The unit half (signed in, offline, the installed app, what mounts it) is src/__tests__/landingRedirect.test.ts.
 *
 *   npm run dev -- -p 3099        (a fake .env.local is enough: a signed-out session never reaches Supabase)
 *   E2E_BASE_URL=http://localhost:3099 npx playwright test e2e/landing-redirect.spec.ts
 *
 * radlor.com is answered HERE (page.route), so a run never touches the real site — and a navigation to it is seen.
 */
import { test, expect } from '@playwright/test'

const LANDING = 'https://radlor.com/radlic'
const STAYS = ['/auth', '/help', '/legal/privacy', '/parent', '/lesson?id=g3m1-t1', '/modules', '/consent/respond', '/email/unsubscribe']

async function visit(page: import('@playwright/test').Page, path: string) {
  const hits: string[] = []
  await page.route('https://radlor.com/**', r => { hits.push(r.request().url()); return r.fulfill({ body: 'the landing page' }) })
  await page.goto(path)
  await page.waitForTimeout(3000)   // the session check runs after hydration
  return hits
}

test('signed out, radlic.com/ goes to the landing page on radlor.com', async ({ page }) => {
  expect(await visit(page, '/')).toEqual([LANDING])
  expect(page.url()).toBe(LANDING)
})

for (const path of STAYS) {
  test(`signed out, ${path} stays in the app`, async ({ page }) => {
    expect(await visit(page, path)).toEqual([])
    expect(new URL(page.url()).hostname).not.toBe('radlor.com')
  })
}
