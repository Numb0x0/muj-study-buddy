/**
 * Grant or revoke the `admin` custom claim for a Google account.
 *
 *   npm run admin:grant -- you@gmail.com
 *   npm run admin:revoke -- you@gmail.com
 *   npm run admin:list
 *
 * The user must have signed in with Google at least once (so the Firebase
 * Auth user exists) — OR pass --create to pre-create the user record.
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY (or emulators) in .env.local.
 */
import "./_env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { requireEnv, usingEmulators } from "./_env";

function init() {
  if (getApps().length) return;
  const projectId = requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (sa) {
    const raw = sa.trim().startsWith("{") ? sa : Buffer.from(sa, "base64").toString("utf8");
    const j = JSON.parse(raw);
    initializeApp({ credential: cert({ projectId: j.project_id, clientEmail: j.client_email, privateKey: j.private_key.replace(/\\n/g, "\n") }), projectId });
  } else if (usingEmulators()) {
    initializeApp({ projectId });
  } else {
    console.error("✖ Need FIREBASE_SERVICE_ACCOUNT_KEY or NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true");
    process.exit(1);
  }
}

async function main() {
  init();
  const auth = getAuth();
  const [cmd, email, ...flags] = process.argv.slice(2);
  const create = flags.includes("--create");

  if (cmd === "list") {
    const res = await auth.listUsers(1000);
    const admins = res.users.filter((u) => u.customClaims?.admin === true);
    if (!admins.length) console.log("No administrators yet.");
    for (const u of admins) console.log(`• ${u.email ?? u.uid}  (uid ${u.uid})`);
    return;
  }

  if (!email || !["grant", "revoke"].includes(cmd ?? "")) {
    console.log("Usage:\n  tsx scripts/set-admin-claim.ts grant <email> [--create]\n  tsx scripts/set-admin-claim.ts revoke <email>\n  tsx scripts/set-admin-claim.ts list");
    process.exit(1);
  }

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    if (!create) {
      console.error(`✖ No Firebase user with email ${email}. Ask them to sign in with Google once, or re-run with --create.`);
      process.exit(1);
    }
    user = await auth.createUser({ email, emailVerified: true, displayName: email.split("@")[0] });
    console.log(`• Created user ${user.uid}`);
  }

  const existing = user.customClaims ?? {};
  if (cmd === "grant") {
    await auth.setCustomUserClaims(user.uid, { ...existing, admin: true });
    console.log(`✔ ${email} is now an administrator. They must sign out and back in for it to take effect.`);
  } else {
    const { admin: _drop, ...rest } = existing as Record<string, unknown>;
    void _drop;
    await auth.setCustomUserClaims(user.uid, rest);
    await auth.revokeRefreshTokens(user.uid);
    console.log(`✔ Admin removed from ${email} and sessions revoked.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
