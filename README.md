# MUJ Study Buddy

A study-resources website for students of the Department of Mechatronics Engineering at Manipal University Jaipur (B.Tech Mechatronics and B.Tech Robotics & AI).

**Live site:** <https://muj-study-buddy.vercel.app>

> This is a student-run project. It is not an official MUJ website and is not affiliated with the university.

## Why I made this

Notes, previous year papers and lab material usually end up scattered across WhatsApp groups and Drive links. I wanted one place where everything is sorted by program, semester and subject, and where anyone can open a PDF without logging in.

## Features

**For students (no login needed)**

- Browse resources by program → semester → subject, or search and filter them
- Read PDFs in the browser or download them
- Curriculum page with the semester-wise scheme (L-T-P-C, credits), electives and syllabus topics for the 2024 batch and the 2025 onwards batch
- Faculty directory
- Small tools: SGPA/CGPA calculator, attendance calculator, study timer, unit converter
- Community page for announcements, events and study groups

**For admins**

- Google sign-in, limited to accounts that have been given the admin role
- Upload a PDF as a private draft, preview it, then publish, unpublish, replace or delete it
- Manage programs, semesters, subjects, faculty, announcements and site settings
- Faculty email and phone stay hidden on the public site until an admin marks the profile as verified

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript
- Tailwind CSS 4
- Firebase Authentication and Firestore (free Spark plan)
- Zod for validation
- react-pdf for the PDF viewer
- Hosted on Vercel

## How it works

- Public pages are rendered on the server and read from Firestore through the Admin SDK. The browser never talks to the database directly.
- Every change goes through an admin API route that checks the session cookie and the admin role, validates the input and writes an audit log entry. The Firestore rules deny all writes from the browser.
- The free Firebase plan has no Cloud Storage, so uploaded PDFs are stored in Firestore in chunks of about 1 MB and streamed back through `/api/files/[noteId]`. Only published files are served.
- Campus and faculty photos are static files in `public/images`.
- The curriculum is transcribed from the department's scheme and syllabus PDFs into `src/data/curriculum`. Where those documents disagree with each other, the differences are listed in [docs/CURRICULUM.md](docs/CURRICULUM.md).

More detail: [docs/API.md](docs/API.md) and [docs/SECURITY.md](docs/SECURITY.md).

## Running it locally

You need Node.js 20 or 22, and Java 11+ for the Firebase emulators. No Firebase account is needed for local development.

```bash
git clone <this repo>
cd muj-study-buddy
npm install
cp .env.example .env.local
```

In `.env.local`, set `NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-muj-study-buddy` and `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`. Then use two terminals:

```bash
# terminal 1
npm run emulators

# terminal 2
npm run seed     # programs, semesters and subjects from the official schemes
npm run dev
```

The site runs at <http://localhost:3000>.

To use the admin dashboard locally, open <http://localhost:3000/admin/login> and sign in through the emulator's fake Google screen with any email. It will say you are not an administrator. Run `npm run admin:grant -- that@email.com` and sign in again.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server (uses the emulators) |
| `npm run build` | Production build |
| `npm run emulators` | Start the Firebase Auth and Firestore emulators |
| `npm run seed` | Add the catalogue (safe to run again) |
| `npm run seed:faculty` | Import faculty from `data/private/faculty.json` (not in the repo) |
| `npm run admin:grant -- email` | Give a Google account the admin role |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint checks |
| `npm run test:e2e` | API tests (needs the emulators and dev server running) |
| `npm run test:rules` | Firestore security rules tests |
| `npm run test:browser` | Browser test with Playwright (`npx playwright install chromium` once) |
| `npm run test:curriculum` | Checks the curriculum data adds up |

## Using a real Firebase project

1. Create a Firebase project, enable **Google** sign-in under Authentication and create a Firestore database. Cloud Storage and the Blaze plan are not needed.
2. Copy `.env.example` to `.env.live.local` and fill in the web app config and the service account key. Set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`. This file is git-ignored; never commit it.
3. Point `.firebaserc` at your project and run `npm run deploy:rules`.
4. Run `npm run seed:live`, then `npm run dev:live`, sign in once at `/admin/login` and run `npm run admin:grant:live -- your@gmail.com`.

Commands ending in `:live` use `.env.live.local`. Everything else, including the tests, uses the emulators.

**Keeping the service account key safe.** It only ever lives in `.env.live.local` on your machine and in Vercel's environment variables. It is never committed and never sent to the browser (only `NEXT_PUBLIC_*` values are). To replace a key: generate a new one in the Firebase console, run `npm run key:set -- path/to/downloaded.json`, then `npm run vercel:env`, redeploy, and delete the old key in the console.

## Deploying

The site is deployed on Vercel:

1. `npx vercel login`, then `npx vercel link`
2. `npm run vercel:env` copies the values from `.env.live.local` into the Vercel project's environment variables
3. `npx vercel deploy --prod`
4. `npm run auth:domain:live -- your-site.vercel.app` adds the domain to Firebase's authorized sign-in domains

## Project structure

```
src/
  app/(public)/      public pages
  app/admin/         admin dashboard
  app/api/           API routes
  components/        UI components
  data/curriculum/   schemes and syllabus data
  lib/               Firebase setup, queries, services, validation
  types/             shared types
scripts/             seeding, admin roles and deploy helpers
tests/               API, security rules, browser and curriculum tests
docs/                API, security and curriculum notes
```

## Known limitations

- B.Tech Mechatronics is listed, but its subjects are empty until I get its scheme and syllabus.
- Search matches titles, subjects, course codes and tags. It does not search inside PDFs.
- The free Firebase plan limits the database to 1 GiB, which also has to hold the PDFs.
- Student accounts, bookmarks and a syllabus tracker are not built yet.

## Content

The curriculum comes from the department's scheme and syllabus documents, and the programme description on the About page from its admissions brochure. Uploaded notes and papers belong to their authors. If something should not be here, use the contact page and it will be taken down.
