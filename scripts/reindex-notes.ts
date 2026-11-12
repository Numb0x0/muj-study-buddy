/**
 * Maintenance: recompute searchTokens for every note (after tokenizer changes)
 * and remove fields that must not live on publicly readable documents
 * (e.g. legacy `uploadedByEmail`).
 *
 *   npm run reindex            (dry run)
 *   npm run reindex -- --write
 */
import "./_env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { computeSearchTokens } from "../src/lib/note-tokens";
import type { NoteDoc } from "../src/types/note";
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

const FORBIDDEN_FIELDS = ["uploadedByEmail"];

async function main() {
  init();
  const write = process.argv.includes("--write");
  const db = getFirestore();
  const programs = new Map<string, string>();
  for (const p of (await db.collection("programs").get()).docs) programs.set(p.id, String(p.data().shortName ?? ""));
  const notes = await db.collection("notes").get();
  let changed = 0;
  let batch = db.batch();
  let ops = 0;
  for (const d of notes.docs) {
    const n = d.data() as NoteDoc & Record<string, unknown>;
    const tokens = computeSearchTokens({ ...n, programShortName: programs.get(n.programId) });
    const patch: Record<string, unknown> = {};
    if (JSON.stringify(tokens) !== JSON.stringify(n.searchTokens ?? [])) patch.searchTokens = tokens;
    for (const f of FORBIDDEN_FIELDS) if (f in n) patch[f] = FieldValue.delete();
    if (!Object.keys(patch).length) continue;
    changed++;
    console.log(`${write ? "updating" : "would update"} ${d.id}  (${Object.keys(patch).join(", ")})`);
    if (write) {
      batch.update(d.ref, patch);
      if (++ops === 400) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
  }
  if (write && ops) await batch.commit();
  console.log(`\n${notes.size} notes checked, ${changed} ${write ? "updated" : "need updating (dry run; pass --write)"}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
