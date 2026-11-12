/**
 * End-to-end test of the admin workflow against the running dev server and
 * the Firebase Emulator Suite. Exercises auth, the chunked upload API, upload
 * validation, draft privacy, publish/unpublish, replace (multi-chunk + byte
 * ranges), search, catalogue integrity, delete.
 *
 *   npm run emulators         (terminal 1)
 *   npm run dev               (terminal 2, with NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true)
 *   npm run test:e2e          (terminal 3)
 *
 * Refuses to run unless emulators are enabled — it creates and deletes data.
 */
import "../scripts/_env";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { UPLOAD_CHUNK_BYTES as CHUNK } from "../src/constants/upload";
import { makePdf } from "./make-pdf";

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS !== "true") {
  console.error("✖ Refusing to run: set NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true (this test writes data).");
  process.exit(1);
}

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key";
const PROGRAM = "muj-btech-robotics-ai";
const SEM = `${PROGRAM}-sem-5`;

if (!getApps().length) initializeApp({ projectId: PROJECT });

let passed = 0;
const failures: string[] = [];
async function step(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failures.push(`${name}: ${(err as Error).message}`);
    console.log(`  ✖ ${name}\n      ${(err as Error).message}`);
  }
}

async function userToken(email: string, admin: boolean): Promise<string> {
  const auth = getAuth();
  let user = await auth.getUserByEmail(email).catch(() => null);
  if (!user) user = await auth.createUser({ email, emailVerified: true });
  await auth.updateUser(user.uid, { password: "test-password-123" });
  await auth.setCustomUserClaims(user.uid, admin ? { admin: true } : {});
  const res = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "test-password-123", returnSecureToken: true }),
  });
  const body = (await res.json()) as { idToken?: string; error?: unknown };
  if (!body.idToken) throw new Error(`sign-in failed: ${JSON.stringify(body.error)}`);
  return body.idToken;
}

let cookie = "";
async function api<T = Record<string, unknown>>(method: string, path: string, body?: unknown, opts: { auth?: boolean } = { auth: true }) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(opts.auth !== false && cookie ? { Cookie: cookie } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, data: data as T, headers: res.headers };
}

/** PUT one chunk to the upload API. `as` = session cookie to send (default: the admin's). */
async function putChunk(path: string, index: number, size: number, body: Buffer, as: string | null = cookie) {
  const res = await fetch(`${BASE}/api/admin/notes/upload?path=${encodeURIComponent(path)}&index=${index}&size=${size}`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream", ...(as ? { Cookie: as } : {}) },
    body: new Uint8Array(body),
  });
  const data = (await res.json().catch(() => ({}))) as { code?: string };
  return { status: res.status, code: data.code };
}

/** Upload a whole file the way the browser does (sequential chunks). Returns the first failure, or 200. */
async function uploadFile(path: string, bytes: Buffer, as: string | null = cookie) {
  const n = Math.max(1, Math.ceil(bytes.length / CHUNK));
  for (let i = 0; i < n; i++) {
    const r = await putChunk(path, i, bytes.length, bytes.subarray(i * CHUNK, Math.min(bytes.length, (i + 1) * CHUNK)), as);
    if (r.status !== 200) return r;
  }
  return { status: 200, code: undefined };
}

/** Whether a stored file exists for this path (reads Firestore directly, like the server). */
async function blobExists(path: string) {
  return (await getFirestore().collection("fileBlobs").doc(encodeURIComponent(path)).get()).exists;
}

type Note = { id: string; status: string; storagePath: string; version: number; title: string; searchTokens: string[]; subjectId: string };

async function main() {
  console.log(`E2E against ${BASE} (project ${PROJECT})\n`);
  const adminToken = await userToken("e2e-admin@example.com", true);
  const studentToken = await userToken("e2e-student@example.com", false);
  const pdf = makePdf(["Kinematics unit 1", "Page two", "Page three"]);
  const pdfHash = createHash("sha256").update(pdf).digest("hex");
  let subjectId = "";
  let noteId = "";
  let storagePath = "";

  console.log("Auth");
  await step("admin API rejects requests without a session (401)", async () => {
    const r = await api("GET", "/api/admin/notes", undefined, { auth: false });
    assert.equal(r.status, 401);
  });
  await step("non-admin Google account cannot create a session (403, no cookie)", async () => {
    const r = await api("POST", "/api/auth/session", { idToken: studentToken }, { auth: false });
    assert.equal(r.status, 403);
    assert.equal(r.headers.get("set-cookie"), null);
  });
  await step("forged/invalid token is rejected", async () => {
    const r = await api("POST", "/api/auth/session", { idToken: "x".repeat(40) }, { auth: false });
    assert.ok(r.status === 401 || r.status === 400, `got ${r.status}`);
  });
  await step("admin account gets an httpOnly session cookie", async () => {
    const r = await api("POST", "/api/auth/session", { idToken: adminToken }, { auth: false });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    const set = r.headers.get("set-cookie") ?? "";
    assert.match(set, /__session=/);
    assert.match(set, /HttpOnly/i);
    cookie = set.split(";")[0];
  });
  await step("GET /api/auth/session returns the admin", async () => {
    const r = await api<{ user: { email: string } }>("GET", "/api/auth/session");
    assert.equal(r.data.user.email, "e2e-admin@example.com");
  });
  await step("/admin redirects to login without cookie, renders with cookie", async () => {
    const anon = await fetch(`${BASE}/admin`, { redirect: "manual" });
    assert.equal(anon.status, 307);
    const authed = await fetch(`${BASE}/admin`, { headers: { Cookie: cookie }, redirect: "manual" });
    assert.equal(authed.status, 200);
  });

  console.log("\nCatalogue");
  await step("create a subject under Semester 5 (lineage copied from parent)", async () => {
    const r = await api<{ item: { id: string; programId: string; universityId: string } }>("POST", "/api/admin/catalog/subjects", {
      semesterId: SEM,
      universityId: "muj",
      departmentId: "muj-robotics-ai",
      programId: PROGRAM,
      code: "E2E3152",
      name: "E2E Mobile Robotics",
      slug: "e2e-mobile-robotics",
      units: [
        { number: 1, title: "Kinematics" },
        { number: 2, title: "Localisation" },
      ],
      order: 9,
      isActive: true,
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    subjectId = r.data.item.id;
    assert.equal(r.data.item.programId, PROGRAM);
  });
  await step("duplicate subject code in same semester is rejected (409)", async () => {
    const r = await api("POST", "/api/admin/catalog/subjects", {
      semesterId: SEM, universityId: "muj", departmentId: "muj-robotics-ai", programId: PROGRAM,
      code: "E2E3152", name: "Dup", slug: "dup-subject", units: [], order: 1, isActive: true,
    });
    assert.equal(r.status, 409);
  });
  await step("cross-site admin requests are blocked by the Origin check (403)", async () => {
    const res = await fetch(`${BASE}/api/admin/catalog/universities`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: "https://evil.example" },
      body: JSON.stringify({ name: "x" }),
    });
    assert.equal(res.status, 403);
  });
  await step("javascript: URLs are rejected in admin input", async () => {
    const r = await api("POST", "/api/admin/announcements", { title: "x", body: "y", url: "javascript:alert(1)" });
    assert.equal(r.status, 400);
  });
  await step("invalid catalogue input is rejected with field errors (400)", async () => {
    const r = await api<{ code: string }>("POST", "/api/admin/catalog/programs", { name: "" });
    assert.equal(r.status, 400);
    assert.equal(r.data.code, "VALIDATION");
  });

  console.log("\nUpload validation");
  await step("prepare rejects non-PDF types (415)", async () => {
    const r = await api("POST", "/api/admin/notes/prepare", { originalFileName: "a.docx", fileSizeBytes: 10, mimeType: "application/msword" });
    assert.equal(r.status, 415);
  });
  await step("prepare rejects files over the size limit (413)", async () => {
    const r = await api("POST", "/api/admin/notes/prepare", { originalFileName: "big.pdf", fileSizeBytes: 26 * 1024 * 1024, mimeType: "application/pdf" });
    assert.equal(r.status, 413);
  });
  await step("prepare allocates a note id and drafts path", async () => {
    const r = await api<{ noteId: string; storagePath: string }>("POST", "/api/admin/notes/prepare", { originalFileName: "Kinematics Notes.pdf", fileSizeBytes: pdf.length, mimeType: "application/pdf" });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    noteId = r.data.noteId;
    storagePath = r.data.storagePath;
    assert.match(storagePath, new RegExp(`^notes/drafts/${noteId}/`));
  });

  console.log("\nUpload API (files are stored in Firestore — Spark plan, no Cloud Storage)");
  await step("anonymous users cannot upload (401)", async () => {
    assert.equal((await uploadFile(storagePath, pdf, null)).status, 401);
  });
  await step("a forged session cookie cannot upload (403)", async () => {
    assert.equal((await uploadFile(storagePath, pdf, "__session=forged-value")).status, 403);
  });
  await step("uploads outside the drafts area are rejected (400)", async () => {
    assert.equal((await uploadFile(`notes/published/${noteId}/x.pdf`, pdf)).status, 400);
  });
  await step("non-PDF bytes are rejected on the first chunk (NOT_PDF)", async () => {
    const r = await uploadFile(`notes/drafts/${noteId}/x.pdf`, Buffer.from("PNG pretending to be a PDF"));
    assert.equal(r.status, 400);
    assert.equal(r.code, "NOT_PDF");
  });
  await step("chunks of the wrong length are rejected (BAD_CHUNK)", async () => {
    const r = await putChunk(`notes/drafts/${noteId}/len.pdf`, 0, pdf.length + 5, pdf);
    assert.equal(r.status, 400);
    assert.equal(r.code, "BAD_CHUNK");
  });
  await step("files over the size limit are rejected (413)", async () => {
    assert.equal((await putChunk(`notes/drafts/${noteId}/big.pdf`, 0, 26 * 1024 * 1024, pdf.subarray(0, 10))).status, 413);
  });
  await step("admins can upload a PDF to drafts", async () => {
    assert.equal((await uploadFile(storagePath, pdf)).status, 200);
    assert.ok(await blobExists(storagePath));
  });

  console.log("\nDraft workflow");
  await step("createDraft rejects an incomplete upload (FILE_INCOMPLETE)", async () => {
    const prep = await api<{ noteId: string; storagePath: string }>("POST", "/api/admin/notes/prepare", { originalFileName: "half.pdf", fileSizeBytes: CHUNK + 100, mimeType: "application/pdf" });
    const half = Buffer.concat([pdf, Buffer.alloc(CHUNK + 100 - pdf.length, 0x20)]);
    assert.equal((await putChunk(prep.data.storagePath, 0, half.length, half.subarray(0, CHUNK))).status, 200);
    const r = await api<{ code: string }>("POST", "/api/admin/notes", {
      noteId: prep.data.noteId, programId: PROGRAM, semesterId: SEM, subjectId, title: "Half", resourceType: "notes", unitNumber: null, tags: [],
      file: { originalFileName: "half.pdf", storagePath: prep.data.storagePath, mimeType: "application/pdf", fileSizeBytes: half.length, contentHash: null, pageCount: null },
    });
    assert.equal(r.status, 400, JSON.stringify(r.data));
    assert.equal(r.data.code, "FILE_INCOMPLETE");
  });
  await step("createDraft rejects mismatched file size", async () => {
    const r = await api("POST", "/api/admin/notes", {
      noteId, programId: PROGRAM, semesterId: SEM, subjectId, title: "Bad", resourceType: "notes", unitNumber: 1, tags: [],
      file: { originalFileName: "Kinematics Notes.pdf", storagePath, mimeType: "application/pdf", fileSizeBytes: pdf.length + 1, contentHash: pdfHash, pageCount: 3 },
    });
    assert.equal(r.status, 400);
  });
  await step("createDraft rejects a unit not defined for the subject", async () => {
    const r = await api("POST", "/api/admin/notes", {
      noteId, programId: PROGRAM, semesterId: SEM, subjectId, title: "Bad unit", resourceType: "notes", unitNumber: 9, tags: [],
      file: { originalFileName: "Kinematics Notes.pdf", storagePath, mimeType: "application/pdf", fileSizeBytes: pdf.length, contentHash: pdfHash, pageCount: 3 },
    });
    assert.equal(r.status, 400);
  });
  await step("createDraft stores a draft with denormalised labels + search tokens", async () => {
    const r = await api<{ note: Note & { subjectCode: string; unitTitle: string; semesterNumber: number } }>("POST", "/api/admin/notes", {
      noteId, programId: PROGRAM, semesterId: SEM, subjectId, title: "Forward Kinematics Notes", description: "DH parameters", resourceType: "notes", unitNumber: 1, tags: ["dh", "kinematics"],
      file: { originalFileName: "Kinematics Notes.pdf", storagePath, mimeType: "application/pdf", fileSizeBytes: pdf.length, contentHash: pdfHash, pageCount: 3 },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    assert.equal(r.data.note.status, "draft");
    assert.equal(r.data.note.subjectCode, "E2E3152");
    assert.equal(r.data.note.unitTitle, "Kinematics");
    assert.equal(r.data.note.semesterNumber, 5);
  });
  await step("a file attached to a note can't be overwritten (409 FILE_SEALED)", async () => {
    const r = await putChunk(storagePath, 0, pdf.length, pdf);
    assert.equal(r.status, 409);
    assert.equal(r.code, "FILE_SEALED");
  });
  await step("drafts are invisible publicly (API list, note API, file, page)", async () => {
    const list = await api<{ items: { id: string }[] }>("GET", `/api/notes?subjectId=${subjectId}`, undefined, { auth: false });
    assert.ok(!list.data.items.some((n) => n.id === noteId));
    assert.equal((await api("GET", `/api/notes/${noteId}`, undefined, { auth: false })).status, 404);
    assert.equal((await fetch(`${BASE}/api/files/${noteId}`)).status, 404);
    assert.equal((await fetch(`${BASE}/notes/${noteId}`)).status, 404);
  });
  await step("admin can preview the draft file", async () => {
    const res = await fetch(`${BASE}/api/admin/notes/${noteId}/file`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 200);
    assert.equal(Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString(), "%PDF-");
  });
  await step("admin preview requires a session", async () => {
    assert.equal((await fetch(`${BASE}/api/admin/notes/${noteId}/file`)).status, 401);
  });

  let dupId = "";
  await step("duplicate upload (same content hash) is flagged", async () => {
    const prep = await api<{ noteId: string; storagePath: string }>("POST", "/api/admin/notes/prepare", { originalFileName: "copy.pdf", fileSizeBytes: pdf.length, mimeType: "application/pdf" });
    assert.equal((await uploadFile(prep.data.storagePath, pdf)).status, 200);
    const r = await api<{ duplicates: { id: string }[]; note: { id: string } }>("POST", "/api/admin/notes", {
      noteId: prep.data.noteId, programId: PROGRAM, semesterId: SEM, subjectId, title: "Another copy", resourceType: "pyq", unitNumber: null, tags: [],
      file: { originalFileName: "copy.pdf", storagePath: prep.data.storagePath, mimeType: "application/pdf", fileSizeBytes: pdf.length, contentHash: pdfHash, pageCount: 3 },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    dupId = r.data.note.id;
    assert.ok(r.data.duplicates.some((d) => d.id === noteId), "expected the first note in duplicates");
  });
  await step("createDraft rejects a path with no uploaded file (FILE_MISSING)", async () => {
    const prep = await api<{ noteId: string; storagePath: string }>("POST", "/api/admin/notes/prepare", { originalFileName: "ghost.pdf", fileSizeBytes: 11, mimeType: "application/pdf" });
    const r = await api<{ code: string }>("POST", "/api/admin/notes", {
      noteId: prep.data.noteId, programId: PROGRAM, semesterId: SEM, subjectId, title: "Ghost", resourceType: "notes", unitNumber: null, tags: [],
      file: { originalFileName: "ghost.pdf", storagePath: prep.data.storagePath, mimeType: "application/pdf", fileSizeBytes: 11, contentHash: null, pageCount: null },
    });
    assert.equal(r.status, 400);
    assert.equal(r.data.code, "FILE_MISSING");
  });

  console.log("\nPublishing");
  await step("publish moves the file to published/ and flips status", async () => {
    const r = await api<{ note: Note }>("POST", `/api/admin/notes/${noteId}/publish`);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.note.status, "published");
    assert.match(r.data.note.storagePath, /^notes\/published\//);
    assert.ok(await blobExists(r.data.note.storagePath), "published copy should exist");
    assert.equal(await blobExists(storagePath), false, "draft copy should be gone");
  });
  await step("publishing twice is rejected (409)", async () => {
    assert.equal((await api("POST", `/api/admin/notes/${noteId}/publish`)).status, 409);
  });
  await step("concurrent publishes of one draft: one wins, the live file survives", async () => {
    const [a, b] = await Promise.all([api("POST", `/api/admin/notes/${dupId}/publish`), api("POST", `/api/admin/notes/${dupId}/publish`)]);
    assert.deepEqual([a.status, b.status].sort(), [200, 409], `got ${a.status}/${b.status}`);
    const file = await fetch(`${BASE}/api/files/${dupId}`);
    assert.equal(file.status, 200, "published file must still exist");
    assert.equal(Buffer.from(await file.arrayBuffer()).length, pdf.length);
  });
  await step("'lab' filter covers manuals, experiments and viva — with or without a subject", async () => {
    const r = await api("PATCH", `/api/admin/notes/${dupId}`, { resourceType: "viva" });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    const all = await api<{ items: { id: string }[] }>("GET", `/api/notes?type=lab`, undefined, { auth: false });
    assert.ok(all.data.items.some((n) => n.id === dupId));
    const scoped = await api<{ items: { id: string }[] }>("GET", `/api/notes?type=lab&subjectId=${subjectId}`, undefined, { auth: false });
    assert.ok(scoped.data.items.some((n) => n.id === dupId), "subject-scoped lab filter must include viva");
    const exact = await api<{ items: { id: string }[] }>("GET", `/api/notes?type=lab-manual&subjectId=${subjectId}`, undefined, { auth: false });
    assert.ok(!exact.data.items.some((n) => n.id === dupId), "explicit lab-manual must not include viva");
  });
  await step("pagination cursors are stable and validated", async () => {
    const p1 = await api<{ items: { id: string }[]; nextCursor: string | null; hasMore: boolean }>("GET", `/api/notes?subjectId=${subjectId}&limit=1`, undefined, { auth: false });
    assert.equal(p1.data.items.length, 1);
    assert.ok(p1.data.hasMore && p1.data.nextCursor);
    const p2 = await api<{ items: { id: string }[]; hasMore: boolean }>("GET", `/api/notes?subjectId=${subjectId}&limit=1&cursor=${p1.data.nextCursor}`, undefined, { auth: false });
    assert.equal(p2.data.items.length, 1);
    assert.notEqual(p2.data.items[0].id, p1.data.items[0].id);
    assert.equal((await api("GET", `/api/notes?cursor=not-a-real-cursor`, undefined, { auth: false })).status, 400);
    assert.equal((await api("GET", `/api/notes?cursor=a%2Fb`, undefined, { auth: false })).status, 400);
  });
  await step("admin 'All' tab search works across statuses", async () => {
    const r = await api<{ items: { id: string }[] }>("GET", `/api/admin/notes?q=kinem`);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.ok(r.data.items.some((n) => n.id === noteId));
  });
  await step("'unit 1' search matches unit 1 only", async () => {
    const u1 = await api<{ items: { id: string }[] }>("GET", `/api/notes?q=${encodeURIComponent("unit 1")}`, undefined, { auth: false });
    assert.ok(u1.data.items.some((n) => n.id === noteId));
    const u2 = await api<{ items: { id: string }[] }>("GET", `/api/notes?q=${encodeURIComponent("unit 2")}`, undefined, { auth: false });
    assert.ok(!u2.data.items.some((n) => n.id === noteId));
  });
  await step("junk session cookie: admin pages redirect without leaking data", async () => {
    for (const path of ["/admin", "/admin/notes", `/admin/notes/${noteId}`]) {
      const res = await fetch(`${BASE}${path}`, { headers: { Cookie: "__session=junk" }, redirect: "manual" });
      assert.equal(res.status, 307, path);
      const body = await res.text();
      assert.ok(!body.includes("Forward Kinematics Notes") && !body.includes("e2e-admin@example.com") && !body.includes("storagePath"), `leak on ${path}`);
    }
  });
  await step("published note is publicly listed, searchable and readable", async () => {
    const list = await api<{ items: { id: string }[] }>("GET", `/api/notes?subjectId=${subjectId}`, undefined, { auth: false });
    assert.ok(list.data.items.some((n) => n.id === noteId));
    const search = await api<{ items: { id: string }[] }>("GET", `/api/notes?q=kinem`, undefined, { auth: false });
    assert.ok(search.data.items.some((n) => n.id === noteId), "prefix search should match");
    const bySubjectCode = await api<{ items: { id: string }[] }>("GET", `/api/notes?q=e2e3152&type=notes`, undefined, { auth: false });
    assert.ok(bySubjectCode.data.items.some((n) => n.id === noteId), "course-code search should match");
    const miss = await api<{ items: { id: string }[] }>("GET", `/api/notes?q=thermodynamics`, undefined, { auth: false });
    assert.ok(!miss.data.items.some((n) => n.id === noteId));
    assert.equal((await fetch(`${BASE}/notes/${noteId}`)).status, 200);
  });
  await step("public note API hides internal fields (uploader, storage path, tokens)", async () => {
    const r = await api<{ note: Record<string, unknown> }>("GET", `/api/notes/${noteId}`, undefined, { auth: false });
    for (const k of ["uploadedBy", "uploadedByEmail", "storagePath", "searchTokens", "contentHash"]) assert.ok(!(k in r.data.note), `leaked ${k}`);
  });
  await step("public file streams as PDF and supports byte ranges", async () => {
    const full = await fetch(`${BASE}/api/files/${noteId}`);
    assert.equal(full.status, 200);
    assert.equal(full.headers.get("content-type"), "application/pdf");
    assert.equal(Buffer.from(await full.arrayBuffer()).length, pdf.length);
    const part = await fetch(`${BASE}/api/files/${noteId}`, { headers: { Range: "bytes=0-4" } });
    assert.equal(part.status, 206);
    assert.equal(Buffer.from(await part.arrayBuffer()).toString(), "%PDF-");
    const dl = await fetch(`${BASE}/api/files/${noteId}?download=1`, { method: "HEAD" });
    assert.match(dl.headers.get("content-disposition") ?? "", /^attachment/);
  });
  await step("subject page lists the published note", async () => {
    const html = await (await fetch(`${BASE}/subjects/${subjectId}`)).text();
    assert.ok(html.includes("Forward Kinematics Notes"));
  });

  console.log("\nEditing");
  await step("metadata update rebuilds search tokens", async () => {
    const r = await api<{ note: Note }>("PATCH", `/api/admin/notes/${noteId}`, { title: "Robot Arm Kinematics", tags: ["dh", "manipulator"] });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.ok(r.data.note.searchTokens.includes("manipulator"));
    const kept = r.data.note as unknown as { unitNumber: number | null; description: string };
    assert.equal(kept.unitNumber, 1, "partial update must not reset the unit");
    assert.equal(kept.description, "DH parameters", "partial update must not clear the description");
    const search = await api<{ items: { id: string }[] }>("GET", `/api/notes?q=manipul`, undefined, { auth: false });
    assert.ok(search.data.items.some((n) => n.id === noteId));
  });
  await step("renaming the subject syncs denormalised fields on its notes", async () => {
    const r = await api("PATCH", `/api/admin/catalog/subjects/${subjectId}`, { name: "E2E Mobile Robotics II" });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    const n = await api<{ note: { subjectName: string } }>("GET", `/api/notes/${noteId}`, undefined, { auth: false });
    assert.equal(n.data.note.subjectName, "E2E Mobile Robotics II");
  });
  // ~2.5 chunks: a valid PDF followed by whitespace padding (allowed after %%EOF).
  const v2Base = makePdf(["Version two", "More pages", "Even more", "Four"]);
  const v2 = Buffer.concat([v2Base, Buffer.alloc(Math.floor(CHUNK * 2.5) - v2Base.length, 0x20)]);
  await step("replace file (multi-chunk) on a published note keeps it live and bumps version", async () => {
    const path = `notes/drafts/${noteId}/kinematics-v2.pdf`;
    assert.equal((await uploadFile(path, v2)).status, 200);
    const r = await api<{ note: Note }>("POST", `/api/admin/notes/${noteId}/replace-file`, {
      file: { originalFileName: "kinematics-v2.pdf", storagePath: path, mimeType: "application/pdf", fileSizeBytes: v2.length, contentHash: createHash("sha256").update(v2).digest("hex"), pageCount: 4 },
    });
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.note.version, 2);
    assert.equal(r.data.note.status, "published");
    const file = await fetch(`${BASE}/api/files/${noteId}`);
    assert.ok(Buffer.from(await file.arrayBuffer()).equals(v2), "downloaded bytes should match the upload");
  });
  await step("public file supports byte ranges across chunk boundaries (206)", async () => {
    const start = CHUNK - 10;
    const end = 2 * CHUNK + 9;
    const res = await fetch(`${BASE}/api/files/${noteId}`, { headers: { Range: `bytes=${start}-${end}` } });
    assert.equal(res.status, 206);
    assert.equal(res.headers.get("content-range"), `bytes ${start}-${end}/${v2.length}`);
    assert.ok(Buffer.from(await res.arrayBuffer()).equals(v2.subarray(start, end + 1)));
    assert.equal((await fetch(`${BASE}/api/files/${noteId}`, { headers: { Range: `bytes=${v2.length}-` } })).status, 416);
  });
  await step("public file answers conditional requests with 304", async () => {
    const first = await fetch(`${BASE}/api/files/${noteId}`, { method: "HEAD" });
    const etag = first.headers.get("etag");
    assert.ok(etag);
    assert.equal((await fetch(`${BASE}/api/files/${noteId}`, { headers: { "If-None-Match": etag } })).status, 304);
  });
  await step("deleting a subject that still has notes is blocked (409 HAS_CHILDREN)", async () => {
    const r = await api<{ code: string }>("DELETE", `/api/admin/catalog/subjects/${subjectId}`);
    assert.equal(r.status, 409);
    assert.equal(r.data.code, "HAS_CHILDREN");
  });
  await step("removing a unit that notes still use is blocked (409 UNIT_IN_USE)", async () => {
    const r = await api<{ code: string }>("PATCH", `/api/admin/catalog/subjects/${subjectId}`, { units: [{ number: 2, title: "Localisation" }] });
    assert.equal(r.status, 409, JSON.stringify(r.data).slice(0, 400));
    assert.equal(r.data.code, "UNIT_IN_USE");
  });
  await step("subject credits can be set and cleared", async () => {
    const set = await api<{ item: { credits: number | null } }>("PATCH", `/api/admin/catalog/subjects/${subjectId}`, { credits: 4 });
    assert.equal(set.data.item.credits, 4);
    const cleared = await api<{ item: { credits: number | null } }>("PATCH", `/api/admin/catalog/subjects/${subjectId}`, { credits: null });
    assert.equal(cleared.status, 200, JSON.stringify(cleared.data));
    assert.equal(cleared.data.item.credits ?? null, null);
  });
  await step("hiding a program hides its semesters and subjects publicly", async () => {
    try {
      assert.equal((await api("PATCH", `/api/admin/catalog/programs/${PROGRAM}`, { isActive: false })).status, 200);
      assert.equal((await fetch(`${BASE}/semesters/${SEM}`)).status, 404);
      assert.equal((await fetch(`${BASE}/subjects/${subjectId}`)).status, 404);
      const tree = await api<{ semesters: { id: string }[]; subjects: { id: string }[] }>("GET", "/api/catalog", undefined, { auth: false });
      assert.ok(!tree.data.semesters.some((x) => x.id === SEM) && !tree.data.subjects.some((x) => x.id === subjectId));
    } finally {
      await api("PATCH", `/api/admin/catalog/programs/${PROGRAM}`, { isActive: true });
    }
    assert.equal((await fetch(`${BASE}/semesters/${SEM}`)).status, 200);
  });
  await step("unverified faculty contact details never reach public pages", async () => {
    const created = await api<{ item: { id: string } }>("POST", "/api/admin/faculty", {
      universityId: "muj", departmentId: "muj-robotics-ai", name: "E2E Unverified Person", designation: "Test", departmentLabel: "Robotics & AI",
      phone: "+91 98765 00000", email: "unverified-e2e@example.com", isVerified: false, isActive: true, order: 99,
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    try {
      for (const path of ["/faculty", `/faculty/${created.data.item.id}`, "/"]) {
        const html = await (await fetch(`${BASE}${path}`)).text();
        assert.ok(!html.includes("98765 00000") && !html.includes("unverified-e2e@example.com"), `contact leaked on ${path}`);
      }
      assert.equal((await fetch(`${BASE}/faculty/does-not-exist`)).status, 404);
    } finally {
      await api("DELETE", `/api/admin/faculty/${created.data.item.id}`);
    }
  });

  console.log("\nUnpublish & delete");
  await step("unpublish hides the note publicly again", async () => {
    const r = await api<{ note: Note }>("POST", `/api/admin/notes/${noteId}/unpublish`);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.equal(r.data.note.status, "draft");
    assert.equal((await fetch(`${BASE}/api/files/${noteId}`)).status, 404);
    assert.equal((await fetch(`${BASE}/notes/${noteId}`)).status, 404);
  });
  await step("data persists: admin detail shows audit trail", async () => {
    const r = await api<{ audit: { action: string }[] }>("GET", `/api/admin/notes/${noteId}`);
    const actions = r.data.audit.map((a) => a.action);
    for (const a of ["note.create", "note.publish", "note.update", "note.replaceFile", "note.unpublish"]) assert.ok(actions.includes(a), `missing ${a}`);
  });
  await step("delete removes notes and their stored files", async () => {
    for (const id of [noteId, dupId]) {
      const r = await api("DELETE", `/api/admin/notes/${id}`);
      assert.equal(r.status, 200);
      assert.equal((await api("GET", `/api/admin/notes/${id}`)).status, 404);
    }
    for (const id of [noteId, dupId]) {
      const left = await getFirestore().collection("fileBlobs").where("noteId", "==", id).get();
      assert.equal(left.size, 0, `stored files left for ${id}`);
    }
  });
  await step("empty subject can now be deleted", async () => {
    assert.equal((await api("DELETE", `/api/admin/catalog/subjects/${subjectId}`)).status, 200);
  });
  await step("logout clears the session", async () => {
    const r = await api("DELETE", "/api/auth/session");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("set-cookie") ?? "", /__session=;/);
  });

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    for (const f of failures) console.log(`  • ${f}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
