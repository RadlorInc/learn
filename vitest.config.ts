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
    /**
     * ⚠️ AND IT CANNOT STOP A SYNCHRONOUS LOOP (ARC-07, measured 2026-09-26 on vitest 4.1.11): the
     * timeout is a timer on the worker's event loop, which the loop is blocking, and vitest 4 has
     * no option that kills a busy fork (teardownTimeout/hookTimeout are timers too). A `for(;;)`
     * with a 1 s timeout was still running at 60 s, and killing the run left the fork orphaned
     * (ppid 1, spinning). In CI the job's `timeout-minutes` is the bound; locally, after killing a
     * hung run: `pkill -f "$PWD/node_modules/vitest/dist/workers"`.
     */
    testTimeout: 20_000,
  },
})
