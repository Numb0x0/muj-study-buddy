/**
 * Seeds the academic catalogue: Manipal University Jaipur → Department of
 * Mechatronics Engineering → B.Tech Robotics & AI, one program per scheme:
 *
 *   muj-btech-robotics-ai       2025–26 onwards scheme, Semesters 1–8
 *   muj-btech-robotics-ai-2024  2024 batch scheme, Semesters 3–8
 *   muj-btech-mechatronics      the department's other branch: Semesters 1–8,
 *                               no subjects until its scheme is provided
 *
 * Subjects come from the official schemes in src/data/curriculum (every
 * course, plus each program-elective / flexi-core option in its semester).
 * Units are left empty: the syllabus documents list topics, not units, and
 * admins can add units per subject from Admin → Catalogue.
 *
 *   npm run seed                 (idempotent: existing docs are left untouched)
 *   npm run seed -- --force      (overwrite seeded docs)
 */
import "./_env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { catalogSubjects, CURRICULA } from "../src/data/curriculum";
import { SITE } from "../src/constants/site";
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

const force = process.argv.includes("--force");

const UNIVERSITY_ID = "muj";
// Id kept from the first version of the seed so existing references stay valid.
const DEPARTMENT_ID = "muj-robotics-ai";
const PROGRAM_ID = CURRICULA["2025"].programId;
const PROGRAM_2024_ID = CURRICULA["2024"].programId;
const MECHATRONICS_ID = "muj-btech-mechatronics";

async function upsert(col: string, id: string, data: Record<string, unknown>) {
  const db = getFirestore();
  const ref = db.collection(col).doc(id);
  const snap = await ref.get();
  if (snap.exists && !force) {
    console.log(`  = ${col}/${id} (exists, skipped)`);
    return;
  }
  await ref.set(
    {
      ...data,
      createdAt: snap.exists ? snap.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`  ${snap.exists ? "~" : "+"} ${col}/${id}`);
}

async function main() {
  init();
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  console.log("Seeding catalogue…");
  await upsert("universities", UNIVERSITY_ID, {
    name: "Manipal University Jaipur",
    shortName: "MUJ",
    slug: "manipal-university-jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    website: "https://jaipur.manipal.edu",
    isActive: true,
  });

  await upsert("departments", DEPARTMENT_ID, {
    universityId: UNIVERSITY_ID,
    name: "Department of Mechatronics Engineering",
    shortName: "Mechatronics",
    slug: "mechatronics",
    description: "School of Engineering, Faculty of Science, Technology and Architecture. Runs two B.Tech branches: Mechatronics, and Robotics & Artificial Intelligence.",
    order: 1,
    isActive: true,
  });

  const programs = [
    {
      id: PROGRAM_ID,
      name: "B.Tech Robotics and Artificial Intelligence (2025 onwards)",
      shortName: "B.Tech R&AI · 2025 onwards",
      slug: "btech-robotics-ai",
      description: "Scheme for students admitted from 2025–26: 160 credits over eight semesters.",
      order: 1,
      curriculum: CURRICULA["2025"],
    },
    {
      id: PROGRAM_2024_ID,
      name: "B.Tech Robotics and Artificial Intelligence (2024 batch)",
      shortName: "B.Tech R&AI · 2024 batch",
      slug: "btech-robotics-ai-2024",
      description: "Scheme for students admitted in 2024 (160 credits). Semesters 3–8 are listed; the scheme document doesn't include the first year.",
      order: 2,
      curriculum: CURRICULA["2024"],
    },
  ];

  for (const p of programs) {
    await upsert("programs", p.id, {
      universityId: UNIVERSITY_ID,
      departmentId: DEPARTMENT_ID,
      name: p.name,
      shortName: p.shortName,
      slug: p.slug,
      degreeType: "B.Tech",
      durationYears: 4,
      totalSemesters: 8,
      description: p.description,
      order: p.order,
      isActive: true,
    });

    for (const sem of p.curriculum.semesters) {
      await upsert("semesters", `${p.id}-sem-${sem.number}`, {
        universityId: UNIVERSITY_ID,
        departmentId: DEPARTMENT_ID,
        programId: p.id,
        number: sem.number,
        name: `Semester ${sem.number}`,
        slug: `semester-${sem.number}`,
        isActive: true,
      });
    }

    for (const sub of catalogSubjects(p.curriculum)) {
      await upsert("subjects", `${p.id}-sem-${sub.semester}-${sub.key}`, {
        universityId: UNIVERSITY_ID,
        departmentId: DEPARTMENT_ID,
        programId: p.id,
        semesterId: `${p.id}-sem-${sub.semester}`,
        code: sub.code.toUpperCase(),
        name: sub.name,
        slug: sub.key,
        credits: sub.credits,
        description: sub.description,
        units: [],
        order: sub.order,
        isActive: true,
      });
    }
  }

  // Second branch of the department. No official scheme has been provided yet,
  // so only the program and its semesters exist; add subjects in Admin → Catalogue
  // (or extend src/data/curriculum) once the scheme and syllabus are available.
  await upsert("programs", MECHATRONICS_ID, {
    universityId: UNIVERSITY_ID,
    departmentId: DEPARTMENT_ID,
    name: "B.Tech Mechatronics",
    shortName: "B.Tech Mechatronics",
    slug: "btech-mechatronics",
    degreeType: "B.Tech",
    durationYears: 4,
    totalSemesters: 8,
    description: "The Department of Mechatronics Engineering's B.Tech Mechatronics branch. Subjects will be listed once the official scheme and syllabus are added.",
    order: 3,
    isActive: true,
  });
  for (let n = 1; n <= 8; n++) {
    await upsert("semesters", `${MECHATRONICS_ID}-sem-${n}`, {
      universityId: UNIVERSITY_ID,
      departmentId: DEPARTMENT_ID,
      programId: MECHATRONICS_ID,
      number: n,
      name: `Semester ${n}`,
      slug: `semester-${n}`,
      isActive: true,
    });
  }

  await upsert("siteSettings", "general", {
    siteName: SITE.name,
    tagline: SITE.tagline,
    contactEmail: SITE.contactEmail,
    maxUploadMb: 25,
    allowedMimeTypes: ["application/pdf"],
    heroImageUrl: null,
    defaultProgramId: PROGRAM_ID,
    announcementBanner: null,
    socialLinks: [],
  });
  // An earlier seed stored contactEmail: null — fill it in without touching other settings.
  const settingsRef = db.collection("siteSettings").doc("general");
  if (!(await settingsRef.get()).get("contactEmail")) {
    await settingsRef.set({ contactEmail: SITE.contactEmail, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    console.log("  ~ siteSettings/general.contactEmail (set default)");
  }

  // Placeholder subjects from the first version of this script.
  const leftovers = await db.collection("subjects").where("code", ">=", "PLACEHOLDER").where("code", "<", "PLACEHOLDES").get();
  if (!leftovers.empty) {
    console.log(`\n  ! ${leftovers.size} placeholder subject(s) from an older seed still exist (${leftovers.docs.map((d) => d.id).join(", ")}). Delete them in Admin → Catalogue once no notes use them.`);
  }

  console.log("✔ Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
