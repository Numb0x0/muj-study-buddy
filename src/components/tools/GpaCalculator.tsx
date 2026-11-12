"use client";

import * as React from "react";
import { Calculator, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { FormulaNote, StatTile, ToolCard } from "./ToolCard";
import { uid, usePersistedState } from "./usePersistedState";

type GradeScale = { grade: string; points: number }[];

/** Common 10-point letter scale. Editable because schemes differ between batches — nothing here is asserted as official. */
const DEFAULT_SCALE: GradeScale = [
  { grade: "A+", points: 10 },
  { grade: "A", points: 9 },
  { grade: "B", points: 8 },
  { grade: "C", points: 7 },
  { grade: "D", points: 6 },
  { grade: "E", points: 5 },
  { grade: "F", points: 0 },
];

interface CourseRow {
  id: string;
  name: string;
  credits: string;
  grade: string;
}
interface SemRow {
  id: string;
  sgpa: string;
  credits: string;
}

const newCourse = (): CourseRow => ({ id: uid(), name: "", credits: "", grade: "" });
const newSem = (): SemRow => ({ id: uid(), sgpa: "", credits: "" });

const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

export function GpaCalculator() {
  const [tab, setTab] = React.useState<"sgpa" | "cgpa">("sgpa");
  const [scale, setScale, resetScale] = usePersistedState<GradeScale>("tools:gpa-scale", DEFAULT_SCALE);
  const [courses, setCourses, resetCourses] = usePersistedState<CourseRow[]>("tools:gpa-courses", [newCourse(), newCourse(), newCourse()]);
  const [sems, setSems, resetSems] = usePersistedState<SemRow[]>("tools:gpa-sems", [newSem(), newSem()]);

  const pointsOf = (g: string) => scale.find((s) => s.grade === g)?.points;

  // SGPA
  let creditSum = 0;
  let weighted = 0;
  let invalid = 0;
  for (const c of courses) {
    const cr = num(c.credits);
    const pts = pointsOf(c.grade);
    if (c.credits === "" && c.grade === "") continue;
    if (!Number.isFinite(cr) || cr <= 0 || cr > 30 || pts === undefined) {
      invalid++;
      continue;
    }
    creditSum += cr;
    weighted += cr * pts;
  }
  const sgpa = creditSum > 0 ? weighted / creditSum : null;

  // CGPA
  let cSum = 0;
  let cWeighted = 0;
  let cInvalid = 0;
  for (const s of sems) {
    if (s.sgpa === "" && s.credits === "") continue;
    const g = num(s.sgpa);
    const cr = num(s.credits);
    if (!Number.isFinite(g) || g < 0 || g > 10 || !Number.isFinite(cr) || cr <= 0) {
      cInvalid++;
      continue;
    }
    cSum += cr;
    cWeighted += g * cr;
  }
  const cgpa = cSum > 0 ? cWeighted / cSum : null;

  const resetAll = () => {
    resetCourses();
    resetSems();
  };

  return (
    <ToolCard
      id="gpa"
      icon={<Calculator className="h-6 w-6" aria-hidden />}
      title="SGPA / CGPA Calculator"
      description="Credit-weighted grade point average. Your entries are saved in this browser only."
      headerAction={
        <Button variant="ghost" size="sm" onClick={resetAll} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
          Reset
        </Button>
      }
    >
      <div role="tablist" aria-label="Calculator mode" className="inline-flex rounded-xl border border-border bg-bg-2 p-1">
        {(["sgpa", "cgpa"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            aria-controls={`gpa-${t}`}
            onClick={() => setTab(t)}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors", tab === t ? "bg-primary/20 text-lavender" : "text-text-3 hover:text-text")}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "sgpa" ? (
        <div id="gpa-sgpa" role="tabpanel" className="mt-5 space-y-4">
          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_6rem_7rem_2.5rem] gap-2 px-1 text-xs font-medium uppercase tracking-wider text-text-3 sm:grid">
              <span>Subject (optional)</span>
              <span>Credits</span>
              <span>Grade</span>
              <span className="sr-only">Remove</span>
            </div>
            {courses.map((c, i) => (
              <div key={c.id} className="grid grid-cols-[1fr_5rem_6rem_2.5rem] gap-2 sm:grid-cols-[1fr_6rem_7rem_2.5rem]">
                <input
                  aria-label={`Subject ${i + 1} name`}
                  className="field"
                  placeholder={`Subject ${i + 1}`}
                  value={c.name}
                  onChange={(e) => setCourses((list) => list.map((x) => (x.id === c.id ? { ...x, name: e.target.value } : x)))}
                />
                <input
                  aria-label={`Subject ${i + 1} credits`}
                  className="field"
                  inputMode="decimal"
                  placeholder="4"
                  value={c.credits}
                  onChange={(e) => setCourses((list) => list.map((x) => (x.id === c.id ? { ...x, credits: e.target.value.replace(/[^\d.]/g, "") } : x)))}
                />
                <select
                  aria-label={`Subject ${i + 1} grade`}
                  className="field"
                  value={c.grade}
                  onChange={(e) => setCourses((list) => list.map((x) => (x.id === c.id ? { ...x, grade: e.target.value } : x)))}
                >
                  <option value="">—</option>
                  {scale.map((s) => (
                    <option key={s.grade} value={s.grade}>
                      {s.grade}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={`Remove subject ${i + 1}`}
                  onClick={() => setCourses((list) => (list.length > 1 ? list.filter((x) => x.id !== c.id) : [newCourse()]))}
                  className="inline-flex items-center justify-center rounded-xl text-text-3 hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setCourses((l) => [...l, newCourse()])} leftIcon={<Plus className="h-4 w-4" aria-hidden />} disabled={courses.length >= 15}>
              Add subject
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="SGPA" value={sgpa === null ? "—" : sgpa.toFixed(2)} hint={`${creditSum} credits counted`} />
            {invalid > 0 ? (
              <StatTile tone="warning" label="Check rows" value={invalid} hint="Rows need positive credits and a grade." />
            ) : (
              <StatTile tone="muted" label="Grade points" value={weighted.toFixed(1)} hint="Σ credits × points" />
            )}
          </div>
        </div>
      ) : (
        <div id="gpa-cgpa" role="tabpanel" className="mt-5 space-y-4">
          {sems.map((s, i) => (
            <div key={s.id} className="grid grid-cols-[5.5rem_1fr_1fr_2.5rem] items-center gap-2">
              <span className="text-sm text-text-3">Sem {i + 1}</span>
              <input
                aria-label={`Semester ${i + 1} SGPA`}
                className="field"
                inputMode="decimal"
                placeholder="SGPA e.g. 8.4"
                value={s.sgpa}
                onChange={(e) => setSems((l) => l.map((x) => (x.id === s.id ? { ...x, sgpa: e.target.value.replace(/[^\d.]/g, "") } : x)))}
              />
              <input
                aria-label={`Semester ${i + 1} credits`}
                className="field"
                inputMode="decimal"
                placeholder="Credits e.g. 22"
                value={s.credits}
                onChange={(e) => setSems((l) => l.map((x) => (x.id === s.id ? { ...x, credits: e.target.value.replace(/[^\d.]/g, "") } : x)))}
              />
              <button
                type="button"
                aria-label={`Remove semester ${i + 1}`}
                onClick={() => setSems((l) => (l.length > 1 ? l.filter((x) => x.id !== s.id) : [newSem()]))}
                className="inline-flex h-10 items-center justify-center rounded-xl text-text-3 hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setSems((l) => [...l, newSem()])} leftIcon={<Plus className="h-4 w-4" aria-hidden />} disabled={sems.length >= 12}>
            Add semester
          </Button>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label="CGPA" value={cgpa === null ? "—" : cgpa.toFixed(2)} hint={`${cSum} credits counted`} />
            {cInvalid > 0 && <StatTile tone="warning" label="Check rows" value={cInvalid} hint="SGPA must be 0–10 with positive credits." />}
          </div>
        </div>
      )}

      <details className="mt-6 rounded-xl border border-border bg-bg-2/60 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-text-2">Grade points used (edit if your scheme differs)</summary>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {scale.map((s, i) => (
            <label key={s.grade} className="flex items-center gap-2 text-sm text-text-2">
              <span className="w-8 font-semibold">{s.grade}</span>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={s.points}
                onChange={(e) => {
                  const v = Math.min(10, Math.max(0, Number(e.target.value) || 0));
                  setScale((sc) => sc.map((x, j) => (j === i ? { ...x, points: v } : x)));
                }}
                className="field h-9 w-20 py-1"
                aria-label={`Points for grade ${s.grade}`}
              />
            </label>
          ))}
        </div>
        <button type="button" onClick={resetScale} className="mt-3 text-xs font-semibold text-lavender hover:underline">
          Restore default scale
        </button>
        <p className="mt-2 text-xs text-muted">Check your official grading scheme in the MUJ academic regulations; this tool is a helper, not an official result.</p>
      </details>

      <div className="mt-4">
        <FormulaNote lines={["SGPA = Σ(credits × grade points) ÷ Σ credits", "CGPA = Σ(SGPA × semester credits) ÷ Σ semester credits"]} />
      </div>
    </ToolCard>
  );
}
