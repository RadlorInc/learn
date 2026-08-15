import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // ⚠️ NOT OURS TO LINT, and leaving them in made `npx eslint` useless as a gate: it reported
    // 3,991 problems, of which ~129 errors came from a separate project's BUILD OUTPUT
    // (`labs-demo/dist`), a Python virtualenv, and recovered scratch files. A gate nobody can read
    // is a gate nobody runs — which is how a real error hides in the noise.
    "labs-demo/**",        // a separate Vite project with its own toolchain
    "python script/**",    // a virtualenv, not source
    "docs/recovered/**",   // scratch, and git-ignored
    "scratch/**",
  ]),
]);

export default eslintConfig;
