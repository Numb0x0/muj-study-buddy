# Security model

## Identities

| Who | How they're identified | What they can do |
| --- | --- | --- |
| Visitor / student | Nobody; no login | Read published notes and active catalogue, faculty, community and settings |
| Signed-in Google user without role | Firebase ID token | Nothing more than a visitor; the session endpoint refuses them |
| Administrator | Firebase custom claim `admin: true` | Everything in `/admin` and `/api/admin/*` |

Google sign-in never grants admin by itself. The claim can only be set by `scripts/set-admin-claim.ts`, which runs with the Admin SDK and the service-account key on the owner's machine. There is no admin-registration page.

## Sessions

1. The browser signs in with Google (Firebase Auth) and sends the ID token to `POST /api/auth/session`.
2. The server verifies the token (`checkRevoked`), requires `admin === true` and a sign-in less than 5 minutes old, then mints a Firebase **session cookie** (`__session`, httpOnly, SameSite=Lax, Secure in production, 5 days).
3. Every admin **page** awaits `requireAdminPage()` (`src/lib/auth/guard.ts`) before loading data, and every admin API handler uses `withAdmin`; both verify the cookie with `verifySessionCookie(…, checkRevoked=true)` and re-check the claim. The dashboard layout check alone would not be enough, because Next renders layouts and pages in parallel and a page's data would still be serialised into a redirect response. `src/proxy.ts` only redirects cookie-less visitors to the login page and is not a security boundary.
4. Mutating admin requests also reject a mismatched `Origin` header, as CSRF defence in depth on top of SameSite.
5. `npm run admin:revoke` removes the claim and revokes refresh tokens, so existing sessions die immediately.

## Data access

- **Firestore rules** (`firestore.rules`): public read only for `status == 'published'` notes and `isActive == true` catalogue, faculty and community docs; site settings are public; audit logs are admin-read only; **all client writes are denied**, admins included. Writes happen only through the Admin SDK in route handlers, after Zod validation, with an audit log entry.
- Published note documents contain no personal data. The uploader is stored as a uid, and emails live only in admin-only audit logs. The public note API returns an explicit allowlist of fields. `npm run reindex -- --write` strips legacy fields from old documents.
- Faculty contact fields (email, phone, office, profile link) are removed on the server unless the profile is marked verified, so they never reach the browser. Firestore rules also block direct client reads of unverified profiles that hold contact data.
- **PDF bytes** (`fileBlobs/*` in Firestore — the project is on the Spark plan, which has no Cloud Storage): no client can read or write them, admins included (catch-all deny in `firestore.rules`, covered by `npm run test:rules`). The server streams published files through `/api/files/[noteId]` only when the note is published, and drafts through the admin-only preview route.
- **Upload API** (`PUT /api/admin/notes/upload`): admin session cookie + Origin check like every admin route; path must be in the note's drafts area; each chunk must have the exact expected length (≤ 960 KiB); the first chunk must start with `%PDF-`; the total size must be within the site limit (≤ 25 MB); a path already attached to a note is sealed (409).
- **Images**: campus and faculty photos are static files in `public/images`; there is no image upload endpoint. Admin image fields accept only bundled paths (`/images/campus|faculty/…`) or `http(s)` URLs.

## Upload pipeline

Every copy uses a uniquely named object, and every status change commits in a transaction that first checks the note's status and file haven't changed. A request that loses a race can only clean up its own copy, never the live file.

The server never trusts the client's description of a file. Before a draft is created it checks:

- that the file path belongs to the note id it was allocated (`/api/admin/notes/prepare`);
- that the file exists, every chunk is present, and its size and content type match;
- that the first bytes are `%PDF-` (fake PDFs are deleted);
- that program, semester, subject and unit exist and belong together.

## Publish atomicity

Publish, unpublish, archive and replace all use the same sequence:

1. Copy the file to the destination (chunks first, metadata last).
2. Verify every chunk of the copy is present.
3. Update Firestore, in a transaction for publish.
4. Delete the source.

If step 3 fails, the copy is deleted and the note keeps pointing at the original file. A crash between steps 3 and 4 can leave a redundant object behind; `npm run cleanup:orphans` finds and removes those.

## Secrets

- `.env*` files, service-account JSON, emulator data and `data/private/` (faculty contact import, including personal phone numbers) are git-ignored.
- `firebase-admin` is imported only from `server-only` modules; client bundles get only the public `NEXT_PUBLIC_FIREBASE_*` web config.
- Admin-entered links must be `http(s)` URLs (no `javascript:`). React escapes all rendered text.

## Tests

`npm run test:rules` covers 29 security-rules cases. `npm run test:e2e` covers 53 cases across authorization, Origin checks, upload validation, draft privacy and the publish lifecycle.
