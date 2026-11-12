# MUJ Study Buddy — HTTP API

All responses are JSON. Errors: `{ error: string, code?: string, details?: unknown }` with 400 (validation), 401 (no session), 403 (not admin), 404, 409 (conflict), 413 (too large), 503 (Firebase not configured), 500.
Admin endpoints require the `__session` cookie (set by `POST /api/auth/session`). Admin handlers are wrapped in `withAdmin()` from `src/lib/auth/require-admin.ts`.
Query params are parsed with the Zod schemas in `src/lib/validations/*`. Timestamps in responses are ISO strings (`Serialized<T>`).

## Auth
| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/session` | `{ idToken }` | 200 `{ ok: true, user: AdminSession }` + Set-Cookie. 403 if the account has no `admin` claim (cookie NOT set). |
| GET | `/api/auth/session` | – | 200 `{ user: AdminSession \| null }` |
| DELETE | `/api/auth/session` | – | 200 `{ ok: true }` clears cookie |

## Public
| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/api/notes` | `noteSearchInput` (`q, programId, departmentId, semesterId, subjectId, unit, type, tag, since, sort, limit, cursor`) | `PaginatedResult<NoteSummary>` — published only |
| GET | `/api/notes/[noteId]` | – | `{ note: Note, related: NoteSummary[] }` published only, else 404 |
| GET | `/api/files/[noteId]` | `download=1` optional | Streams the published PDF (`Content-Type: application/pdf`, inline or attachment, `Cache-Control: public, max-age=3600`). 404 for drafts/unknown. Supports single-part `Range` requests and `If-None-Match`. |
| GET | `/api/catalog` | `programId?` | `CatalogTree` (active only). With `programId`, semesters/subjects are limited to that program. |

## Admin — notes (`src/app/api/admin/notes/…`)
| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/api/admin/notes` | `adminNoteListInput` (adds `status=draft\|published\|archived\|all`) | `PaginatedResult<Note>` |
| POST | `/api/admin/notes/prepare` | `{ originalFileName, fileSizeBytes, mimeType }` | `{ noteId, storagePath, maxUploadBytes, chunkBytes }` — allocates an id and tells the browser where to upload (`notes/drafts/{noteId}/{sanitizedName}`). Validates size/type against site settings. |
| PUT | `/api/admin/notes/upload?path=&index=&size=` | raw bytes of chunk `index` (`application/octet-stream`) | `{ chunkCount }` — stores one ≤ 960 KiB chunk in Firestore. 400 `BAD_PATH`/`BAD_CHUNK`/`NOT_PDF`, 409 `SIZE_MISMATCH`/`FILE_SEALED`, 413 over the limit. |
| POST | `/api/admin/notes` | `createNoteInput` (`noteId`, metadata, `file`) | 201 `{ note: Note, duplicates: NoteSummary[] }` — verifies the file at `file.storagePath` exists, is complete (`FILE_INCOMPLETE` otherwise) and its size/contentType match, denormalises subject/semester/program labels, computes `searchTokens`, status `draft`, version 1. `duplicates` = other notes with same `contentHash` or same title in the subject (warning only). |
| GET | `/api/admin/notes/[id]` | – | `{ note: Note, duplicates: NoteSummary[], audit: AuditLog[] }` |
| PATCH | `/api/admin/notes/[id]` | `updateNoteInput` | `{ note }` — re-denormalises + rebuilds searchTokens; if published, stays published. |
| DELETE | `/api/admin/notes/[id]` | – | `{ ok: true }` — deletes draft + published files, then the doc. |
| POST | `/api/admin/notes/[id]/publish` | – | `{ note }` — copies `notes/drafts/…` → `notes/published/…`, verifies the copy, sets `status=published`, `publishedAt`, `storagePath` to the published path, then deletes the draft copy. On any failure the doc stays `draft` and the published copy (if any) is removed, and the response is a 500 with the error. 409 if already published. |
| POST | `/api/admin/notes/[id]/unpublish` | – | `{ note }` — copies published → drafts, sets `status=draft`, `publishedAt=null`, removes published copy. |
| POST | `/api/admin/notes/[id]/archive` | – | `{ note }` — like unpublish but `status=archived` (file kept in drafts). |
| POST | `/api/admin/notes/[id]/replace-file` | `replaceFileInput` (`{ file }`, uploaded to drafts under the SAME noteId) | `{ note }` — version+1; if the note was published, the new file is published in place (old published file removed) so the public link keeps working. |
| GET | `/api/admin/notes/[id]/file` | `download=1` optional | Streams the current file regardless of status (admin preview). |

## Admin — catalogue (`/api/admin/catalog/[kind]`, kind ∈ `universities|departments|programs|semesters|subjects`)
| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/api/admin/catalog/[kind]` | – | `{ items: X[] }` including inactive |
| POST | `/api/admin/catalog/[kind]` | matching `*Input` schema; optional `id` (slug-ish) | 201 `{ item }`. 409 on duplicate slug within parent. |
| PATCH | `/api/admin/catalog/[kind]/[id]` | partial input | `{ item }`. Changing name/code of subject/semester/program also updates the denormalised fields on its notes (`subjectName`, `subjectCode`, `semesterNumber`, `programName`, `programSlug`, `searchTokens`). |
| DELETE | `/api/admin/catalog/[kind]/[id]` | – | `{ ok: true }`. 409 with `{ code: "HAS_CHILDREN", details: { notes, subjects, … } }` if anything references it. |

## Admin — faculty / community / announcements / settings
| Method | Path | Body | Response |
|---|---|---|---|
| GET/POST | `/api/admin/faculty` | `facultyInput` | `{ items }` / 201 `{ item }` |
| GET/PATCH/DELETE | `/api/admin/faculty/[id]` | partial | `{ item }` / `{ ok }` |
| GET/POST | `/api/admin/community` | `communityItemInput` | `{ items }` / 201 `{ item }` |
| GET/PATCH/DELETE | `/api/admin/community/[id]` | partial | |
| GET/POST | `/api/admin/announcements` | `announcementInput` | |
| GET/PATCH/DELETE | `/api/admin/announcements/[id]` | partial | |
| GET/PUT | `/api/admin/settings` | `siteSettingsInput` | `{ settings: SiteSettings }` |
| GET | `/api/admin/stats` | – | `{ notes: { draft, published, archived }, subjects, programs, faculty, recentActivity: AuditLog[] }` |
| GET | `/api/admin/audit` | `limit?, targetId?` | `{ items: AuditLog[] }` |

Every mutating admin handler writes an audit log via `writeAuditLog(session, action, collection, id, metadata)`.

## Browser upload flow (admin)
1. Admin picks a PDF → client validates extension/type/size (limit from `GET /api/admin/settings`).
2. `POST /api/admin/notes/prepare` → `{ noteId, storagePath, chunkBytes }`.
3. Client computes SHA-256 (`crypto.subtle.digest`) and page count (pdfjs `getDocument` on the ArrayBuffer, best-effort) while uploading the file as sequential `PUT /api/admin/notes/upload` chunk requests (retries with backoff, cancellable), showing progress. Authorised by the admin session cookie — no browser Firebase session is needed.
4. `POST /api/admin/notes` with metadata + `file` details → draft created.
5. Admin previews via `/api/admin/notes/[id]/file`, then `POST …/publish`.
