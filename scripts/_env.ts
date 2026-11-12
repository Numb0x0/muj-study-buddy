/**
 * Shared bootstrap for CLI scripts.
 *
 *   default            loads .env.local then .env (local emulators)
 *   FIREBASE_ENV=live  loads ONLY .env.live.local (the real project) — used by
 *                      `npm run seed:live`, `seed:faculty:live`, `admin:*:live`
 */
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const live = process.env.FIREBASE_ENV === "live";
const files = live ? [".env.live.local"] : [".env.local", ".env"];

if (live && !existsSync(resolve(process.cwd(), ".env.live.local"))) {
  console.error("✖ FIREBASE_ENV=live but .env.live.local is missing. See README §4.");
  process.exit(1);
}

for (const f of files) {
  const p = resolve(process.cwd(), f);
  if (existsSync(p)) config({ path: p, override: false, quiet: true });
}

if (live) {
  // Never let a stray emulator variable send live commands to the emulators.
  for (const k of ["FIRESTORE_EMULATOR_HOST", "FIREBASE_AUTH_EMULATOR_HOST", "FIREBASE_STORAGE_EMULATOR_HOST"]) delete process.env[k];
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
    console.error("✖ .env.live.local has NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true — set it to false.");
    process.exit(1);
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error("✖ FIREBASE_SERVICE_ACCOUNT_KEY is empty in .env.live.local.\n  Firebase console → Project settings → Service accounts → Generate new private key, then paste the JSON (one line) after the = sign.");
    process.exit(1);
  }
  console.log(`● LIVE project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
}

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`✖ Missing ${name}. Copy .env.example → .env.local and fill it in.`);
    process.exit(1);
  }
  return v;
}

export function usingEmulators() {
  return process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
}
