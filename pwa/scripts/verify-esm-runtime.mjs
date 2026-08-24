// Reproduces how Vercel actually builds and runs the serverless functions, then
// invokes the cleanup handler for real.
//
// This exists because the production 500 was invisible to every other check we
// had: the app typecheck excludes api/, the unit tests import the TypeScript
// sources through Vite's resolver, and the e2e suite mocks the backend. Only
// Node's own ESM resolver, running the compiled output, sees the fault.
//
// Compiles api/ + src/pipeline/ to ESM under a "type": "module" package, exactly
// as Vercel does, then imports the built handler and calls it.

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const out = mkdtempSync(join(tmpdir(), "wf-esm-"));
let failed = false;

try {
  execFileSync(
    "npx",
    [
      "tsc",
      "--module", "nodenext",
      "--moduleResolution", "nodenext",
      "--target", "ES2022",
      "--skipLibCheck",
      "--outDir", out,
      "--rootDir", ".",
      "api/cleanup.ts",
      "api/transcribe.ts",
      "api/health.ts",
    ],
    { stdio: "pipe" },
  );

  // Vercel runs the functions as native ESM. This is the flag that made the
  // extensionless imports fatal.
  writeFileSync(join(out, "package.json"), JSON.stringify({ type: "module" }));

  const { default: handler } = await import(pathToFileURL(join(out, "api/cleanup.js")).href);

  // Minimal req/res doubles matching what the platform passes in.
  const captured = {};
  const res = {
    status(code) {
      captured.code = code;
      return this;
    },
    json(body) {
      captured.body = body;
      return this;
    },
  };

  // level "none" bypasses the network entirely, so this exercises module
  // resolution and the handler without needing an API key.
  await handler(
    { method: "POST", body: { raw: "um so i think we should uh meet at 3", level: "none" } },
    res,
  );

  if (captured.code !== 200) {
    console.error(`FAIL: expected 200, got ${captured.code}`, captured.body);
    failed = true;
  } else if (captured.body?.cleaned !== "um so i think we should uh meet at 3") {
    console.error("FAIL: handler did not return the transcript", captured.body);
    failed = true;
  } else {
    console.log(`OK: compiled ESM handler resolved its imports and returned ${captured.code}.`);
  }
} catch (e) {
  const text = String(e.stdout || "") + String(e.message || e);
  if (text.includes("ERR_MODULE_NOT_FOUND")) {
    console.error(
      "FAIL: the compiled function cannot resolve its imports under Node ESM.\n" +
        "This is the exact fault that returned 500 on every dictation.\n" +
        "Relative imports in api/ and src/pipeline/ need explicit .js extensions.\n",
    );
  }
  console.error(text.slice(0, 1500));
  failed = true;
} finally {
  rmSync(out, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
