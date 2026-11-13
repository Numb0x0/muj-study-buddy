// Installs a Firebase service-account key into .env.live.local (git-ignored)
// straight from the JSON file the Firebase console downloads, so the key never
// has to be copied or pasted anywhere.
//
//   npm run key:set -- ~/Downloads/your-project-firebase-adminsdk-xxxxx.json
//
// Afterwards: `npm run vercel:env`, redeploy, then delete the old key in the
// console and delete the downloaded JSON file.
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

const ENV_FILE = ".env.live.local";
const arg = process.argv[2];
if (!arg) {
  console.error("Usage: npm run key:set -- path/to/service-account.json");
  process.exit(1);
}
const file = arg.replace(/^~(?=\/)/, homedir());
if (!existsSync(file)) {
  console.error(`✖ File not found: ${file}`);
  process.exit(1);
}
if (!existsSync(ENV_FILE)) {
  console.error(`✖ ${ENV_FILE} is missing. See the README.`);
  process.exit(1);
}

let key;
try {
  key = JSON.parse(readFileSync(file, "utf8"));
} catch {
  console.error("✖ That file is not valid JSON.");
  process.exit(1);
}
if (key.type !== "service_account" || !key.private_key || !key.client_email) {
  console.error("✖ That file is not a service-account key.");
  process.exit(1);
}

const env = readFileSync(ENV_FILE, "utf8");
const projectId = /^NEXT_PUBLIC_FIREBASE_PROJECT_ID=(.*)$/m.exec(env)?.[1]?.trim();
if (projectId && key.project_id !== projectId) {
  console.error(`✖ This key is for project "${key.project_id}", but ${ENV_FILE} uses "${projectId}".`);
  process.exit(1);
}
if (!/^FIREBASE_SERVICE_ACCOUNT_KEY=.*$/m.test(env)) {
  console.error(`✖ ${ENV_FILE} has no FIREBASE_SERVICE_ACCOUNT_KEY= line.`);
  process.exit(1);
}

const encoded = Buffer.from(JSON.stringify(key)).toString("base64");
writeFileSync(ENV_FILE, env.replace(/^FIREBASE_SERVICE_ACCOUNT_KEY=.*$/m, () => `FIREBASE_SERVICE_ACCOUNT_KEY=${encoded}`));
chmodSync(ENV_FILE, 0o600);

// Only the key's id is printed, so you can tell old and new keys apart in the console.
console.log(`✔ Key ${String(key.private_key_id).slice(0, 8)}… for ${key.project_id} saved to ${ENV_FILE}.`);
console.log("Next: npm run vercel:env, redeploy, delete the old key in the Firebase console, then delete the downloaded file.");
