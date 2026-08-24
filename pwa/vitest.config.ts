import { defineConfig } from "vitest/config";

// Unit tests live under src/. The Playwright browser review (tests-e2e/) is run
// separately via `pnpm e2e`, so keep it out of the Vitest run.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["tests-e2e/**", "node_modules/**", "dist/**"],
  },
});
