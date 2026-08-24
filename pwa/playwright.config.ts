import { defineConfig, devices } from "@playwright/test";

// Browser review runs against the production build served by `vite preview`,
// in a mobile viewport, with Chromium's fake media devices so MediaRecorder
// produces a real blob headlessly.
export default defineConfig({
  testDir: "./tests-e2e",
  timeout: 60_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "off",
    permissions: ["microphone"],
    launchOptions: {
      // The preinstalled Chromium doesn't match this @playwright/test version's
      // pinned build, so use the provided binary directly (full chrome, not the
      // headless shell) instead of downloading.
      executablePath: process.env.PW_CHROMIUM || "/opt/pw-browsers/chromium",
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        "--autoplay-policy=no-user-gesture-required",
      ],
    },
  },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "pnpm preview",
    port: 4173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
