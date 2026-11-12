/**
 * Removes abandoned uploads: stored files (fileBlobs/*) under
 * notes/drafts/{id}/ or notes/published/{id}/ that aren't the current file of
 * an existing note (e.g. an admin uploaded a file but closed the tab before
 * saving, or a replace-file upload was cancelled).
 *
 *   npm run cleanup:orphans               (dry run — lists what would be deleted)
 *   npm run cleanup:orphans -- --delete   (actually delete)
 *
 * Only touches files older than --min-age-hours (default 24) so uploads in
 * progress are never removed.
 */
import "./_env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Timestamp } from "firebase-admin/firestore";
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

/** Accepts "--min-age-hours N" or "--min-age-hours=N"; exits on anything else. */
function parseMinAgeHours(args: string[]): number {
  const eq = args.find((a) => a.startsWith("--min-age-hours="));
  const idx = args.indexOf("--min-age-hours");
  if (!eq && idx === -1) return 24;
  const raw = eq ? eq.split("=")[1] : args[idx + 1];
  const n = Number(raw);
  if (raw === undefined || raw.startsWith("--") || !Number.isFinite(n) || n < 0) {
    console.error(`✖ --min-age-hours needs a non-negative number (got "${raw ?? ""}").`);
    process.exit(1);
  }
  return n;
}

async function main() {
  init();
  const doDelete = process.argv.includes("--delete");
  const minAgeMs = parseMinAgeHours(process.argv.slice(2)) * 3600_000;
  const db = getFirestore();
  const blobs = await db.collection("fileBlobs").select("path", "noteId", "size", "updatedAt").get();
  const currentPath = new Map<string, string | null>();
  let candidates = 0;
  let bytes = 0;
  for (const b of blobs.docs) {
    const { path, noteId, size, updatedAt } = b.data() as { path: string; noteId: string; size: number; updatedAt?: Timestamp };
    if (!currentPath.has(noteId)) {
      const note = await db.collection("notes").doc(noteId).get();
      currentPath.set(noteId, note.exists ? ((note.get("storagePath") as string) ?? null) : null);
    }
    if (currentPath.get(noteId) === path) continue;
    const age = Date.now() - (updatedAt?.toMillis() ?? 0);
    if (age < minAgeMs) continue;
    candidates++;
    bytes += size ?? 0;
    console.log(`${doDelete ? "deleting" : "would delete"}  ${path}`);
    if (doDelete) await db.recursiveDelete(b.ref).catch((e: Error) => console.error("  failed:", e.message));
  }
  const mb = (bytes / 1048576).toFixed(1);
  console.log(candidates ? `\n${candidates} orphaned file(s), ${mb} MB${doDelete ? " deleted" : " found (dry run; pass --delete to remove)"}` : "No orphaned uploads.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
