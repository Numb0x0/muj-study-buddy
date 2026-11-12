/**
 * Consistency checks for the static curriculum data (no emulators needed):
 *   npm run test:curriculum
 */
import assert from "node:assert/strict";
import { catalogSubjects, CURRICULA, syllabusFor } from "../src/data/curriculum";

let failures = 0;
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failures++;
    console.error(`  ✖ ${name}\n    ${(err as Error).message}`);
  }
}

for (const cur of Object.values(CURRICULA)) {
  console.log(`\n${cur.title}`);
  check("semester credits add up to the printed totals", () => {
    for (const s of cur.semesters) assert.equal(s.courses.reduce((a, c) => a + c.c, 0), s.totalCredits, `Semester ${s.number}`);
  });
  check(`scheme covers ${cur.id === "2025" ? "all 160" : "120 (Sem 3–8)"} credits`, () => {
    assert.equal(cur.semesters.reduce((a, s) => a + s.totalCredits, 0), cur.id === "2025" ? 160 : 120);
  });
  check("every referenced syllabus key exists", () => {
    const refs = [
      ...cur.semesters.flatMap((s) => s.courses.flatMap((c) => c.syllabus ?? [])),
      ...cur.groups.flatMap((g) => g.options.flatMap((o) => o.syllabus ?? [])),
      ...cur.openElectives.flatMap((o) => o.syllabus ?? []),
      ...cur.tracks.flatMap((t) => [...t.additions.flatMap((a) => a.courses.flatMap((c) => c.syllabus ?? [])), ...(t.electives ?? []).flatMap((e) => e.options.flatMap((o) => o.syllabus ?? []))]),
    ];
    const missing = refs.filter((k) => !cur.syllabus[k]);
    assert.deepEqual(missing, []);
  });
  check("every elective/flexi slot points at an option group", () => {
    for (const s of cur.semesters) for (const c of s.courses) if (c.kind === "program-elective" || c.kind === "flexi-core") assert.ok(cur.groups.some((g) => g.id === c.group), `${c.name}`);
  });
  check("catalogue subject keys are unique within each semester", () => {
    const seen = new Set<string>();
    for (const s of catalogSubjects(cur)) {
      const k = `${s.semester}:${s.key}`;
      assert.ok(!seen.has(k), `duplicate ${k}`);
      seen.add(k);
    }
  });
  check("catalogue subject codes fit the admin form (2–20 chars)", () => {
    for (const s of catalogSubjects(cur)) assert.ok(s.code.length >= 2 && s.code.length <= 20, s.code);
  });
  check("syllabus entries have topics (except project/thesis stubs)", () => {
    const empty = Object.entries(cur.syllabus).filter(([, e]) => !e.topics && !/project/i.test(e.title)).map(([k]) => k);
    assert.deepEqual(empty, []);
  });
  const unused = Object.keys(cur.syllabus).filter((k) => ![...cur.semesters.flatMap((s) => s.courses), ...cur.groups.flatMap((g) => g.options), ...cur.openElectives, ...cur.tracks.flatMap((t) => [...t.additions.flatMap((a) => a.courses), ...(t.electives ?? []).flatMap((e) => e.options)])].some((c) => c.syllabus?.includes(k)));
  console.log(`  · ${catalogSubjects(cur).length} catalogue subjects; ${Object.keys(cur.syllabus).length} syllabus entries${unused.length ? `; not linked: ${unused.join(", ")}` : ""}`);
  void syllabusFor;
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll curriculum checks passed.");
