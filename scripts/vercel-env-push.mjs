// Copies the live Firebase settings from .env.live.local into the linked
// Vercel project's PRODUCTION environment variables (encrypted by Vercel).
// Prints variable names only — never values.
//
//   npm run vercel:env                 (site URL defaults to https://muj-study-buddy.vercel.app)
//   npm run vercel:env -- https://your-domain.in
//
// Requires `npx vercel login` and a linked project (.vercel/project.json).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const FILE = ".env.live.local";
if (!existsSync(FILE)) throw new Error(`${FILE} not found`);
if (!existsSync(".vercel/project.json")) throw new Error("Not linked to a Vercel project — run `npx vercel link` first.");

const env = {};
for (const line of readFileSync(FILE, "utf8").split("\n")) {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
  if (m) env[m[1]] = m[2];
}
env.NEXT_PUBLIC_SITE_URL = process.argv[2] ?? "https://muj-study-buddy.vercel.app";

if (!env.FIREBASE_SERVICE_ACCOUNT_KEY) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is empty in .env.live.local");
if (env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== "false") throw new Error("NEXT_PUBLIC_USE_FIREBASE_EMULATORS must be false in .env.live.local");

const SECRET = new Set(["FIREBASE_SERVICE_ACCOUNT_KEY"]);
let failed = 0;
for (const [name, value] of Object.entries(env)) {
  const args = ["vercel", "env", "add", name, "--environment", "production", "--force", "--yes", SECRET.has(name) ? "--sensitive" : "--no-sensitive"];
  // Value goes through stdin so it never appears in the process list or shell history.
  const r = spawnSync("npx", args, { input: value, encoding: "utf8" });
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log(`${ok ? "✔" : "✖"} ${name}${SECRET.has(name) ? " (secret)" : ""}`);
  if (!ok) console.log(`   ${(r.stderr || r.stdout).split("\n").filter(Boolean).slice(-1)[0]?.replaceAll(value, "<value>") ?? ""}`);
}
console.log(failed ? `\n${failed} variable(s) failed.` : `\nAll ${Object.keys(env).length} variables saved to Vercel (production).`);
process.exit(failed ? 1 : 0);
