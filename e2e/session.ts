import type { Page } from '@playwright/test'

/**
 * Seed a signed-in Supabase session, before any app code runs.
 *
 * ⚠️ WHY THIS EXISTS. The camera guard (`src/core/arChapters.ts`) refuses to render an AR chapter
 * when there is no session — on ANY url, not just the `?taste=1` one, because the live leak was a
 * deep link and the URL is the picker. `all-chapters` and `short-landscape` drive
 * `/teen-preview?c=<id>` logged out, so without this they would quietly start grading the consent
 * card for eight chapters and report them clean: a check that cannot tell it graded the wrong
 * screen will tell you the right one is fine. That is the exact fault `start-card.spec.ts` was
 * written for, and it must not be reintroduced by the fix for something else.
 *
 * ⚠️ THIS IS NOT A SECURITY BYPASS AND DOES NOT WEAKEN THE GUARD. The guard's job is that the
 * PRODUCT never offers a camera to a visitor who has not signed up and been shown the consent line.
 * Nothing can stop a person from hand-writing a session into their own browser to turn on their own
 * camera; that is them, not us. `supabase-js` never verifies the signature client-side, so an
 * unsigned token is enough for `getSession()`.
 */
export async function seedSession(page: Page) {
  await page.addInitScript(() => {
    const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const exp = Math.floor(Date.now() / 1000) + 3600
    const sub = '00000000-0000-4000-8000-000000000001'
    const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', exp, aud: 'authenticated' })}.e2e`
    localStorage.setItem('milo-auth', JSON.stringify({
      access_token: jwt,
      refresh_token: 'e2e-refresh',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: exp,
      user: { id: sub, aud: 'authenticated', role: 'authenticated', email: 'e2e@milo.invalid', app_metadata: {}, user_metadata: {}, created_at: new Date(0).toISOString() },
    }))
  })
}
