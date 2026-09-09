import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': resolve(process.cwd(), 'src') } },
  test: {
    environment: 'jsdom',        // provides localStorage / window for the storage-backed helpers
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
    /**
     * ⚠️ NOT COSMETIC. Vitest's default is 5s, and `questionQualitySweep`'s Q6 sweep runs
     * TIERS x DRAWS generated rounds through seven regexes per string: `measurementUnits`
     * alone measures **1959 ms on a dev Mac**, and a GitHub free runner is ~3x slower — so it
     * timed out at 5000 ms and CI went RED on every push from 2026-08-20. Vercel deploys
     * through its own git integration, so a red pipeline stopped nothing; it only meant a real
     * failure could no longer be told apart from the flake.
     * The sweep is a whole-corpus property check, not a unit test — give it room rather than
     * shrinking DRAWS, which is the coverage the sweep exists for.
     */
    testTimeout: 20_000,
  },
})
