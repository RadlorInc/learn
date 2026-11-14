import { describe, expect, it } from 'vitest'
import { siteUrlFrom } from '@/app/site'

/**
 * A preview build runs against the STAGING database, so every link it mails (sign-up confirm, consent) and the Stripe
 * return URL must point back at that preview, not at production — a staging token opened on app.radlor.com cannot resolve.
 * Expected values are written out by hand.
 */
describe('SITE_URL on each Vercel environment', () => {
  it('production: NEXT_PUBLIC_SITE_URL wins, even with preview variables present', () => {
    expect(siteUrlFrom({
      NEXT_PUBLIC_SITE_URL: 'https://app.radlor.com',
      VERCEL_ENV: 'production',
      VERCEL_BRANCH_URL: 'adaptivelearn-git-release-radlor1.vercel.app',
      VERCEL_PROJECT_PRODUCTION_URL: 'app.radlor.com',
    })).toBe('https://app.radlor.com')
  })

  it('preview: the branch URL, not the production host', () => {
    expect(siteUrlFrom({
      VERCEL_ENV: 'preview',
      VERCEL_BRANCH_URL: 'adaptivelearn-git-some-branch-radlor1.vercel.app',
      VERCEL_PROJECT_PRODUCTION_URL: 'app.radlor.com',
    })).toBe('https://adaptivelearn-git-some-branch-radlor1.vercel.app')
  })

  it('a production build without NEXT_PUBLIC_SITE_URL never takes the branch URL', () => {
    expect(siteUrlFrom({
      VERCEL_ENV: 'production',
      VERCEL_BRANCH_URL: 'adaptivelearn-git-release-radlor1.vercel.app',
      VERCEL_PROJECT_PRODUCTION_URL: 'app.radlor.com',
    })).toBe('https://app.radlor.com')
  })

  it('local, nothing set: app.radlor.com', () => {
    expect(siteUrlFrom({})).toBe('https://app.radlor.com')
  })
})
