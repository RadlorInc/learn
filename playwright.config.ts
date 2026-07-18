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
  },
  projects: [{ name: 'chromium' }],
})
