// `npm run dev:live` — run the website locally against the REAL Firebase
// project (.env.live.local) instead of the emulators (.env.local).
//
// Next.js never overrides variables that are already set, so loading
// .env.live.local into this process first (and blanking the emulator hosts)
// wins over .env.local.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const FILE = ".env.live.local";
if (!existsSync(FILE)) {
  console.error(`✖ ${FILE} is missing. See README §4.`);
  process.exit(1);
}

const env = { ...process.env };
for (const line of readFileSync(FILE, "utf8").split("\n")) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
  if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
}
// Empty strings are falsy for both our code and the Admin SDK, and stop
// .env.local's emulator hosts from being applied.
for (const k of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST"]) env[k] = "";
env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS = "false";

if (!env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.warn("⚠ FIREBASE_SERVICE_ACCOUNT_KEY is empty in .env.live.local — pages will show empty states and admin sign-in will fail until you add it.");
}
console.log(`● Running against LIVE project ${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID} → http://localhost:3000`);

const child = spawn("npx", ["next", "dev", ...process.argv.slice(2)], { stdio: "inherit", env, shell: process.platform === "win32" });
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
