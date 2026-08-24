import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";

const SHOTS = "screenshots";
fs.mkdirSync(SHOTS, { recursive: true });

// Mock the backend so the review is deterministic and offline.
async function mockApi(page: Page) {
  await page.route("**/api/transcribe", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ text: "um so i think we should uh meet at 2 actually 3 period" }),
    });
  });
  await page.route("**/api/cleanup", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ cleaned: "So I think we should meet at 3.", usedRaw: false }),
    });
  });
}

test("installable: manifest is linked and valid", async ({ page }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  const res = await page.request.get(new URL(href!, "http://localhost:4173").toString());
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.name).toBe("WhimprFlow");
  expect(manifest.display).toBe("standalone");
  expect(Array.isArray(manifest.icons) && manifest.icons.length).toBeGreaterThan(0);
  const has512 = manifest.icons.some((i: { sizes: string }) => i.sizes.includes("512"));
  expect(has512).toBeTruthy();
});

test("service worker registers", async ({ page }) => {
  await page.goto("/");
  const registered = await page.waitForFunction(
    async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration();
      return !!reg;
    },
    undefined,
    { timeout: 15_000 },
  );
  expect(await registered.jsonValue()).toBeTruthy();
});

test("idle record screen renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Tap to dictate")).toBeVisible();
  // Tone/structure now lives under the record button, not in Settings.
  await expect(page.getByRole("button", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start recording" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/01-record-idle.png`, fullPage: true });
});

test("full record → clean → export flow", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Start recording" }).click();
  // Recording UI: timer + stop control.
  await expect(page.getByRole("button", { name: "Stop and clean up" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/02-recording.png`, fullPage: true });

  // Let a little audio accumulate, then stop.
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Stop and clean up" }).click();

  // Result: the cleaned text lands in the editable textarea.
  const textarea = page.locator("textarea");
  await expect(textarea).toBeVisible({ timeout: 20_000 });
  await expect(textarea).toHaveValue("So I think we should meet at 3.");

  // The three single-note destinations. The webhook is gone; bulk export lives
  // in Settings and History instead.
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Notes / Share" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Obsidian" })).toBeVisible();
  await expect(page.getByRole("button", { name: "n8n / Webhook" })).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/03-result.png`, fullPage: true });

  // Copy is wired and gives feedback. In headless Chromium the Clipboard API is
  // often blocked, so the app's fallback message is an acceptable outcome — what
  // we verify is that the button fires and surfaces a toast either way.
  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByText(/Copied|Clipboard/)).toBeVisible();

  // History recorded the dictation.
  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByText("So I think we should meet at 3.")).toBeVisible();
});

test("insights (empty state) renders", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Insights" }).click();
  await expect(page.getByText("Nothing to measure yet")).toBeVisible();
});

test("insights (populated) + settings render and persist", async ({ page }) => {
  // Seed a few dictations so Insights shows the editorial stat sheet + chart.
  const now = Math.floor(Date.now() / 1000);
  await page.addInitScript((n) => {
    const rec = (words: number, dur: number, ago: number) => ({
      ts_unix: n - ago * 86400,
      words,
      duration_ms: dur,
      chars: words * 6,
      text: "Seeded dictation for the insights review.",
      app: null,
    });
    localStorage.setItem(
      "whimpr.history",
      JSON.stringify([rec(42, 18000, 0), rec(31, 15000, 1), rec(58, 20000, 2)]),
    );
  }, now);

  await page.goto("/");
  await page.getByRole("button", { name: "Insights" }).click();
  await expect(page.getByText("Last 7 days")).toBeVisible();
  await expect(page.getByText("words dictated", { exact: false })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/04-insights.png`, fullPage: true });

  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("How much to edit")).toBeVisible();
  // Set an Obsidian vault and confirm it persists across reload (localStorage).
  await page.getByPlaceholder("My Vault").fill("DJ Vault");
  await page.screenshot({ path: `${SHOTS}/05-settings.png`, fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByPlaceholder("My Vault")).toHaveValue("DJ Vault");
});


// ── Themes ──────────────────────────────────────────────────────────────────

const THEMES = [
  { id: "signature", name: "Signature", idle: "Tap to dictate" },
  { id: "eden", name: "Garden of Eden", idle: "Speak it into being" },
  { id: "cascade", name: "The Matrix", idle: "AWAITING INPUT" },
  { id: "bikini", name: "Bikini Bottom", idle: "Ready when you are!" },
  { id: "shinobi", name: "Shinobi", idle: "One breath, then speak" },
];

for (const theme of THEMES) {
  test(`theme: ${theme.id} paints its own palette and voice`, async ({ page }) => {
    await page.addInitScript((id) => localStorage.setItem("whimpr.theme", id), theme.id);
    await page.goto("/");

    // The theme's own copy, not the default's.
    await expect(page.getByText(theme.idle)).toBeVisible();

    // Its palette actually reached :root, and the record control is themed.
    const root = page.locator("html");
    await expect(root).toHaveAttribute("data-wf-theme", theme.id);
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--wf-accent").trim(),
    );
    expect(accent).not.toBe("");
    await expect(page.getByRole("button", { name: "Start recording" })).toBeVisible();

    // Body text must not be painted with an unresolved custom property, which is
    // how a missing token silently renders as transparent.
    const bodyColor = await page.evaluate(() => getComputedStyle(document.body).color);
    expect(bodyColor).toMatch(/^(rgb|oklch|color)/);

    await page.screenshot({ path: `${SHOTS}/theme-${theme.id}.png`, fullPage: true });
  });
}

test("theme picker switches worlds and survives reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();

  await page.getByRole("button", { name: "Bikini Bottom" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-wf-theme", "bikini");

  // Shinobi exposes a variant toggle; the others do not.
  await expect(page.getByRole("button", { name: "Crimson" })).toHaveCount(0);
  await page.getByRole("button", { name: "Shinobi" }).click();
  await page.getByRole("button", { name: "Lightning" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-wf-variant", "kakashi");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-wf-theme", "shinobi");
  await expect(page.locator("html")).toHaveAttribute("data-wf-variant", "kakashi");
});

// ── Cleanup levels + bulk export ────────────────────────────────────────────

test("each cleanup level explains what it edits", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();

  await expect(page.getByText("0% drift")).toBeVisible();
  await expect(page.getByText("85% drift")).toBeVisible();

  // Expanding a level shows the before/after and the guarantees.
  await page.getByRole("button", { name: /^High/ }).click();
  await expect(page.getByText("You say")).toBeVisible();
  await expect(page.getByText(/never as a question to answer/)).toBeVisible();
  await expect(page.getByText(/Every fact, name, number, date/)).toBeVisible();
});

test("bulk export offers every destination and guards the Obsidian link", async ({ page }) => {
  const now = Math.floor(Date.now() / 1000);
  await page.addInitScript((n) => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      ts_unix: n - i * 3600,
      words: 8,
      duration_ms: 9000,
      chars: 48,
      text: `Seeded dictation number ${i} for the export review.`,
      app: null,
    }));
    localStorage.setItem("whimpr.history", JSON.stringify(rows));
    localStorage.setItem("whimpr.settings", JSON.stringify({ obsidian_vault: "DJ Vault" }));
  }, now);

  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("button", { name: /Download \.md/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Copy all/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /To Obsidian/ })).toBeEnabled();

  // The .md export must actually produce a file.
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download \.md/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^whimprflow-.*\.md$/);

  // History selection drives the same destinations.
  await page.getByRole("button", { name: "History" }).click();
  await page.getByRole("button", { name: "Select", exact: true }).click();
  await page.getByRole("button", { name: /Select all/ }).click();
  await expect(page.getByText(/5 dictations/)).toBeVisible();
});
