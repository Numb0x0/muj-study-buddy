/**
 * Imports the Mechatronics faculty list into Firestore.
 *
 *   npm run seed:faculty                              (reads data/private/faculty.json)
 *   npm run seed:faculty -- --file path/to/faculty.json
 *   npm run seed:faculty -- --force                   (also update profiles that already exist)
 *
 * The JSON holds personal mobile numbers, so it lives in the git-ignored
 * data/private/ folder and is never committed. Every profile is imported with
 * isVerified = false: contact details stay hidden on the public site until an
 * admin ticks "Verified" in Admin → Faculty. Re-running never resets a
 * profile an admin has already verified, and without --force leaves existing
 * profiles untouched.
 *
 * Expected shape: { faculty: [{ id, order, name, designation|null, email|null, phone|null, photo|null }] }
 */
import "./_env";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { z } from "zod";
import { facultyInput } from "../src/lib/validations/faculty";
import { FACULTY_PHOTO_IDS, facultyPhotoPath } from "../src/constants/images";
import { requireEnv, usingEmulators } from "./_env";

const UNIVERSITY_ID = "muj";
const DEPARTMENT_ID = "muj-robotics-ai";
const DEPARTMENT_LABEL = "Mechatronics Engineering";

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

const sourceRecord = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int().min(0),
  name: z.string().min(1),
  designation: z.string().min(1).nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  photo: z.string().nullable(),
});
const sourceFile = z.object({ faculty: z.array(sourceRecord).min(1) });

function argValue(flag: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const file = resolve(argValue("--file") ?? "data/private/faculty.json");
  if (!existsSync(file)) {
    console.error(`✖ ${file} not found. Copy faculty.json there (it is git-ignored) or pass --file <path>.`);
    process.exit(1);
  }
  const force = process.argv.includes("--force");
  const { faculty } = sourceFile.parse(JSON.parse(readFileSync(file, "utf8")));

  init();
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  console.log(`Importing ${faculty.length} faculty profiles from ${file}…`);
  for (const f of faculty) {
    const hasPhoto = (FACULTY_PHOTO_IDS as readonly string[]).includes(f.id);
    if (f.photo && !hasPhoto) console.warn(`  ! ${f.id}: photo listed in JSON but public/images/faculty/${f.id}.webp is not bundled — using the default avatar`);
    // Same validation the admin API applies.
    const data = facultyInput.parse({
      universityId: UNIVERSITY_ID,
      departmentId: DEPARTMENT_ID,
      name: f.name,
      // The source lists no designation for some people; say so plainly rather than guess.
      designation: f.designation ?? "Faculty member",
      departmentLabel: DEPARTMENT_LABEL,
      email: f.email ?? "",
      phone: f.phone ?? "",
      officeLocation: null,
      profileUrl: "",
      imageUrl: hasPhoto ? facultyPhotoPath(f.id) : "",
      specializations: [],
      bio: null,
      isVerified: false,
      isFeatured: false,
      order: f.order,
      isActive: true,
    });

    const ref = db.collection("faculty").doc(f.id);
    const snap = await ref.get();
    if (snap.exists && !force) {
      console.log(`  = faculty/${f.id} (exists, skipped — pass --force to update)`);
      continue;
    }
    await ref.set(
      {
        ...data,
        // Never undo an admin's verification on re-import.
        isVerified: snap.exists ? snap.get("isVerified") === true : false,
        createdAt: snap.exists ? (snap.get("createdAt") ?? FieldValue.serverTimestamp()) : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    console.log(`  ${snap.exists ? "~" : "+"} faculty/${f.id}${hasPhoto ? "" : " (default avatar)"}`);
  }
  console.log("✔ Done. Contact details stay hidden until you tick “Verified” in Admin → Faculty.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
