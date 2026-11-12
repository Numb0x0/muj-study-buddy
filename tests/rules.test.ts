/**
 * Firestore security-rules tests (@firebase/rules-unit-testing). There are no
 * Storage rules: the project runs on the Spark plan and keeps PDFs in
 * Firestore (fileBlobs/*), which clients can never read or write.
 *
 *   npm run test:rules        (starts throwaway emulators, runs, shuts down)
 *   npm run test:rules:live   (uses already-running emulators; isolated project id)
 *
 * Uses its own project id so app data in the dev emulators is never touched.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { Bytes, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where, setLogLevel } from "firebase/firestore";

const PROJECT = "demo-rules-test";
// Expected denials are logged as warnings by the SDK; keep output readable.
setLogLevel("silent");
let env: RulesTestEnvironment;
let passed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`  ✖ ${name}\n      ${(err as Error).message.split("\n")[0]}`);
  }
}

const pdf = new TextEncoder().encode("%PDF-1.4\n%%EOF\n");
const blobId = encodeURIComponent("notes/published/n1/a.pdf");
const draftBlobId = encodeURIComponent("notes/drafts/n1/a.pdf");

async function main() {
  env = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
  await env.clearFirestore();

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "notes/pub"), { status: "published", title: "Published" });
    await setDoc(doc(db, "notes/draft"), { status: "draft", title: "Draft" });
    await setDoc(doc(db, "notes/arch"), { status: "archived", title: "Archived" });
    await setDoc(doc(db, "subjects/active"), { isActive: true, name: "Active" });
    await setDoc(doc(db, "subjects/hidden"), { isActive: false, name: "Hidden" });
    await setDoc(doc(db, "programs/p1"), { isActive: true });
    await setDoc(doc(db, "faculty/f1"), { isActive: true, name: "Test" });
    await setDoc(doc(db, "faculty/f2"), { isActive: false, name: "Hidden" });
    await setDoc(doc(db, "faculty/f3"), { isActive: true, isVerified: false, name: "Unverified", phone: "+91 00000 00000", email: null });
    await setDoc(doc(db, "faculty/f4"), { isActive: true, isVerified: true, name: "Verified", phone: "+91 11111 11111", email: "v@example.com" });
    await setDoc(doc(db, "siteSettings/general"), { siteName: "x" });
    await setDoc(doc(db, "auditLogs/a1"), { action: "note.create" });
    await setDoc(doc(db, "secret/x"), { a: 1 });
    for (const id of [blobId, draftBlobId]) {
      await setDoc(doc(db, `fileBlobs/${id}`), { path: decodeURIComponent(id), noteId: "n1", size: pdf.length, chunkCount: 1 });
      await setDoc(doc(db, `fileBlobs/${id}/chunks/00000`), { data: Bytes.fromUint8Array(pdf) });
    }
  });

  const anon = env.unauthenticatedContext();
  const student = env.authenticatedContext("student", { email: "s@example.com" });
  const admin = env.authenticatedContext("admin", { email: "a@example.com", admin: true });
  const fakeAdmin = env.authenticatedContext("faker", { admin: "true" }); // string, not boolean

  console.log("Firestore — public visitors");
  await test("can read a published note", () => assertSucceeds(getDoc(doc(anon.firestore(), "notes/pub"))));
  await test("cannot read a draft note", () => assertFails(getDoc(doc(anon.firestore(), "notes/draft"))));
  await test("cannot read an archived note", () => assertFails(getDoc(doc(anon.firestore(), "notes/arch"))));
  await test("can list notes only when filtering status == published", async () => {
    await assertSucceeds(getDocs(query(collection(anon.firestore(), "notes"), where("status", "==", "published"))));
    await assertFails(getDocs(collection(anon.firestore(), "notes")));
  });
  await test("can read active catalogue, not inactive", async () => {
    await assertSucceeds(getDoc(doc(anon.firestore(), "subjects/active")));
    await assertFails(getDoc(doc(anon.firestore(), "subjects/hidden")));
    await assertSucceeds(getDoc(doc(anon.firestore(), "programs/p1")));
  });
  await test("can read active faculty, not inactive", async () => {
    await assertSucceeds(getDoc(doc(anon.firestore(), "faculty/f1")));
    await assertFails(getDoc(doc(anon.firestore(), "faculty/f2")));
  });
  await test("cannot read unverified faculty contact data directly; verified is readable", async () => {
    await assertFails(getDoc(doc(anon.firestore(), "faculty/f3")));
    await assertSucceeds(getDoc(doc(anon.firestore(), "faculty/f4")));
  });
  await test("can read site settings", () => assertSucceeds(getDoc(doc(anon.firestore(), "siteSettings/general"))));
  await test("cannot read audit logs", () => assertFails(getDoc(doc(anon.firestore(), "auditLogs/a1"))));
  await test("cannot read unknown collections", () => assertFails(getDoc(doc(anon.firestore(), "secret/x"))));
  await test("cannot write anything", async () => {
    await assertFails(setDoc(doc(anon.firestore(), "notes/new"), { status: "published" }));
    await assertFails(setDoc(doc(anon.firestore(), "subjects/active"), { isActive: true, name: "hacked" }));
    await assertFails(deleteDoc(doc(anon.firestore(), "notes/pub")));
  });

  console.log("Firestore — signed-in non-admin");
  await test("cannot read drafts", () => assertFails(getDoc(doc(student.firestore(), "notes/draft"))));
  await test("cannot write", () => assertFails(setDoc(doc(student.firestore(), "notes/x"), { status: "draft" })));
  await test("a string 'true' admin claim is not accepted", () => assertFails(getDoc(doc(fakeAdmin.firestore(), "notes/draft"))));

  console.log("Firestore — admin claim");
  await test("can read drafts and audit logs", async () => {
    await assertSucceeds(getDoc(doc(admin.firestore(), "notes/draft")));
    await assertSucceeds(getDoc(doc(admin.firestore(), "auditLogs/a1")));
  });
  await test("still cannot write directly (server-only writes)", async () => {
    await assertFails(setDoc(doc(admin.firestore(), "notes/x"), { status: "published" }));
    await assertFails(deleteDoc(doc(admin.firestore(), "notes/pub")));
  });

  console.log("Stored PDF bytes (fileBlobs) — server-only");
  for (const [who, ctx] of [["public visitors", anon], ["signed-in non-admins", student], ["admins", admin]] as const) {
    await test(`${who} cannot read file metadata or chunks, even for published files`, async () => {
      await assertFails(getDoc(doc(ctx.firestore(), `fileBlobs/${blobId}`)));
      await assertFails(getDoc(doc(ctx.firestore(), `fileBlobs/${blobId}/chunks/00000`)));
      await assertFails(getDoc(doc(ctx.firestore(), `fileBlobs/${draftBlobId}/chunks/00000`)));
      await assertFails(getDocs(collection(ctx.firestore(), "fileBlobs")));
    });
    await test(`${who} cannot write or delete file data`, async () => {
      await assertFails(setDoc(doc(ctx.firestore(), `fileBlobs/${encodeURIComponent("notes/drafts/n9/x.pdf")}`), { size: 1 }));
      await assertFails(setDoc(doc(ctx.firestore(), `fileBlobs/${blobId}/chunks/00001`), { data: Bytes.fromUint8Array(pdf) }));
      await assertFails(deleteDoc(doc(ctx.firestore(), `fileBlobs/${blobId}`)));
    });
  }

  await env.cleanup();
  console.log(`\n${passed} passed, ${failures.length} failed`);
  assert.equal(failures.length, 0, `Failed: ${failures.join("; ")}`);
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await env?.cleanup().catch(() => {});
  process.exit(1);
});
