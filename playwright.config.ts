import { defineConfig } from '@playwright/test'

// E2E harness. Drives the running dev server (start it via the preview tooling:
// `milo-dev` on port 3017 — never raw-Bash a dev server). Public routes like
// /teen-preview?c=<id> need no auth; auth-gated flows seed a confirmed user at the
// DB layer (see e2e/README.md). Personas live in e2e/personas.ts.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3017',
    headless: true,
    viewport: { width: 1280, height: 820 },
    trace: 'retain-on-failure',
    /**
     * ⚠️ VERCEL'S WAF CHALLENGES AUTOMATION, AND IT LOOKS EXACTLY LIKE FLAKINESS.
     * A run against production makes hundreds of requests from one IP; at roughly forty of them
     * Vercel starts serving a JS challenge instead of the app — `403` with
     * `x-vercel-mitigated: challenge`. A real browser solves that transparently and Playwright
     * cannot, so the navigation dies as `net::ERR_ABORTED` and reads as a broken chapter. Measured:
     * it hit at tests 41–42 of a prod sweep, the same two chapters passed on the other two frames
     * minutes later, and the block persisted well past 20s — so RETRIES DO NOT HELP, they just fail
     * slower. (It also blocks every path afterwards, static assets included.)
     *
     * ⚠️⚠️ AND THE HEADERS BELOW DO **NOT** FIX THAT. They bypass DEPLOYMENT PROTECTION (the
     * Vercel-Authentication login wall); the challenge above comes from the FIREWALL, which is a
     * separate system. Its remedy is a firewall IP bypass, and on this account that is plan-gated —
     * `vercel firewall system-bypass list` answers *"IP Bypass is unavailable for this plan"*. So
     * the real fix for the sweep is not to run it against production at all (see the launch-day
     * runbook); the automatic mitigation is time-limited and clears itself.
     *
     * These headers are kept because they solve a real and DIFFERENT problem: this project has
     * `ssoProtection: all_except_custom_domains`, so PREVIEW deployments sit behind Vercel
     * Authentication and no automation can reach them without a bypass secret. Generate one at
     * Settings → Deployment Protection → Protection Bypass for Automation and export it:
     *   VERCEL_AUTOMATION_BYPASS_SECRET=… E2E_BASE_URL=https://<preview-url> npm run test:chapters
     * Unset, this is inert and nothing changes. `x-vercel-set-bypass-cookie` makes the browser carry
     * it on subsequent navigations too, which a header alone does not cover once the page starts
     * fetching its own subresources. (Shape taken from Vercel's own documented Playwright example.)
     */
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          'x-vercel-set-bypass-cookie': 'true',
        }
      : {},
  },
  projects: [{ name: 'chromium' }],
})
