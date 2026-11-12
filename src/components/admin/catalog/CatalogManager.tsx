"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { api, errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { DEGREE_TYPES, type CatalogKind } from "@/lib/validations/catalog";
import type { CatalogTree } from "@/lib/queries/catalog";
import type { Department, Program, Semester, Subject, University } from "@/types";
import { EntityManager } from "../EntityManager";
import type { FormValues } from "../EntityForm";
import { useToast } from "../Toast";

const TABS: { kind: CatalogKind; label: string }[] = [
  { kind: "universities", label: "Universities" },
  { kind: "departments", label: "Departments" },
  { kind: "programs", label: "Programs" },
  { kind: "semesters", label: "Semesters" },
  { kind: "subjects", label: "Subjects" },
];

const num = (v: unknown, fallback = 0) => (v === "" || v === null || v === undefined ? fallback : Number(v));
const optNum = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));
const req = (v: FormValues, keys: string[]) => Object.fromEntries(keys.filter((k) => v[k] === "" || v[k] === undefined || v[k] === null).map((k) => [k, "Required."]));

export function CatalogManager({ tree, tab }: { tree: CatalogTree; tab: CatalogKind }) {
  const router = useRouter();
  const pathname = usePathname();
  const setTab = (k: CatalogKind) => router.replace(`${pathname}?tab=${k}`, { scroll: false });

  const uniName = (id: string) => tree.universities.find((u) => u.id === id)?.shortName ?? id;
  const deptName = (id: string) => tree.departments.find((d) => d.id === id)?.shortName ?? id;
  const progName = (id: string) => tree.programs.find((p) => p.id === id)?.shortName ?? id;
  const semName = (id: string) => tree.semesters.find((s) => s.id === id)?.name ?? id;

  const uniOptions = () => tree.universities.map((u) => ({ value: u.id, label: u.name }));
  const deptOptions = (v: FormValues) => tree.departments.filter((d) => !v.universityId || d.universityId === v.universityId).map((d) => ({ value: d.id, label: d.name }));
  const progOptions = () => tree.programs.map((p) => ({ value: p.id, label: p.name }));
  const semOptions = (v: FormValues) => tree.semesters.filter((s) => s.programId === v.programId).sort((a, b) => a.number - b.number).map((s) => ({ value: s.id, label: s.name }));

  const lineageFromDept = (deptId: unknown) => {
    const d = tree.departments.find((x) => x.id === deptId);
    return { universityId: d?.universityId ?? "" };
  };
  const lineageFromProgram = (programId: unknown) => {
    const p = tree.programs.find((x) => x.id === programId);
    return { universityId: p?.universityId ?? "", departmentId: p?.departmentId ?? "" };
  };
  const lineageFromSemester = (semesterId: unknown) => {
    const s = tree.semesters.find((x) => x.id === semesterId);
    return { universityId: s?.universityId ?? "", departmentId: s?.departmentId ?? "", programId: s?.programId ?? "" };
  };

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Catalogue" className="flex flex-wrap gap-1 rounded-xl border border-border bg-bg-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.kind}
            role="tab"
            type="button"
            aria-selected={tab === t.kind}
            onClick={() => setTab(t.kind)}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors", tab === t.kind ? "bg-primary/20 text-lavender" : "text-text-3 hover:text-text")}
          >
            {t.label}
            <span className="ml-1.5 text-xs font-normal">{tree[t.kind].length}</span>
          </button>
        ))}
      </div>

      {tab === "universities" && (
        <EntityManager<University>
          noun="University"
          rows={tree.universities}
          description="Top level of the catalogue."
          columns={[
            { header: "Name", cell: (r) => <span className="font-medium text-text">{r.name}</span> },
            { header: "Short", cell: (r) => r.shortName },
            { header: "City", cell: (r) => r.city },
          ]}
          fields={[
            { name: "name", label: "Name", type: "text", required: true, span: 2 },
            { name: "shortName", label: "Short name", type: "text", required: true },
            { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
            { name: "city", label: "City", type: "text", required: true },
            { name: "state", label: "State", type: "text" },
            { name: "website", label: "Website", type: "url", span: 2 },
            { name: "isActive", label: "Active (visible on the site)", type: "checkbox" },
          ]}
          emptyValues={() => ({ name: "", shortName: "", slug: "", city: "", state: "", website: "", isActive: true })}
          toValues={(r) => ({ name: r.name, shortName: r.shortName, slug: r.slug, city: r.city, state: r.state ?? "", website: r.website ?? "", isActive: r.isActive })}
          toBody={(v) => ({ ...v })}
          validate={(v) => req(v, ["name", "shortName", "slug", "city"])}
          create={(b) => api.catalog.create("universities", b as never)}
          update={(id, b) => api.catalog.update("universities", id, b as never)}
          remove={(id) => api.catalog.remove("universities", id)}
        />
      )}

      {tab === "departments" && (
        <EntityManager<Department>
          noun="Department"
          rows={tree.departments}
          columns={[
            { header: "Name", cell: (r) => <span className="font-medium text-text">{r.name}</span> },
            { header: "Short", cell: (r) => r.shortName },
            { header: "University", cell: (r) => uniName(r.universityId) },
            { header: "Order", cell: (r) => r.order },
          ]}
          fields={[
            { name: "universityId", label: "University", type: "select", required: true, options: uniOptions },
            { name: "name", label: "Name", type: "text", required: true },
            { name: "shortName", label: "Short name", type: "text", required: true, hint: "Shown on faculty cards, e.g. Robotics & AI" },
            { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "order", label: "Display order", type: "number", min: 0 },
            { name: "isActive", label: "Active", type: "checkbox" },
          ]}
          emptyValues={() => ({ universityId: tree.universities[0]?.id ?? "", name: "", shortName: "", slug: "", description: "", order: 0, isActive: true })}
          toValues={(r) => ({ universityId: r.universityId, name: r.name, shortName: r.shortName, slug: r.slug, description: r.description ?? "", order: r.order, isActive: r.isActive })}
          toBody={(v) => ({ ...v, order: num(v.order) })}
          validate={(v) => req(v, ["universityId", "name", "shortName", "slug"])}
          create={(b) => api.catalog.create("departments", b as never)}
          update={(id, b) => api.catalog.update("departments", id, b as never)}
          remove={(id) => api.catalog.remove("departments", id)}
        />
      )}

      {tab === "programs" && (
        <EntityManager<Program>
          noun="Program"
          rows={tree.programs}
          columns={[
            { header: "Name", cell: (r) => <span className="font-medium text-text">{r.name}</span> },
            { header: "Degree", cell: (r) => <Badge variant="primary">{r.degreeType}</Badge> },
            { header: "Department", cell: (r) => deptName(r.departmentId) },
            { header: "Semesters", cell: (r) => `${tree.semesters.filter((s) => s.programId === r.id).length} / ${r.totalSemesters}` },
          ]}
          headerExtra={<QuickSemesters tree={tree} />}
          fields={[
            { name: "departmentId", label: "Department", type: "select", required: true, options: deptOptions },
            { name: "degreeType", label: "Degree", type: "select", required: true, options: () => DEGREE_TYPES.map((d) => ({ value: d, label: d })) },
            { name: "name", label: "Full name", type: "text", required: true, span: 2 },
            { name: "shortName", label: "Short name", type: "text", required: true, hint: "e.g. B.Tech Robotics & AI" },
            { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
            { name: "durationYears", label: "Duration (years)", type: "number", min: 1, max: 8, required: true },
            { name: "totalSemesters", label: "Total semesters", type: "number", min: 1, max: 16, required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "order", label: "Display order", type: "number", min: 0 },
            { name: "isActive", label: "Active", type: "checkbox" },
          ]}
          emptyValues={() => ({ departmentId: tree.departments[0]?.id ?? "", degreeType: "B.Tech", name: "", shortName: "", slug: "", durationYears: 4, totalSemesters: 8, description: "", order: 0, isActive: true })}
          toValues={(r) => ({ departmentId: r.departmentId, degreeType: r.degreeType, name: r.name, shortName: r.shortName, slug: r.slug, durationYears: r.durationYears, totalSemesters: r.totalSemesters, description: r.description ?? "", order: r.order, isActive: r.isActive })}
          toBody={(v) => ({ ...v, ...lineageFromDept(v.departmentId), durationYears: num(v.durationYears, 4), totalSemesters: num(v.totalSemesters, 8), order: num(v.order) })}
          validate={(v) => req(v, ["departmentId", "name", "shortName", "slug", "durationYears", "totalSemesters"])}
          create={(b) => api.catalog.create("programs", b as never)}
          update={(id, b) => api.catalog.update("programs", id, b as never)}
          remove={(id) => api.catalog.remove("programs", id)}
        />
      )}

      {tab === "semesters" && (
        <EntityManager<Semester>
          noun="Semester"
          rows={[...tree.semesters].sort((a, b) => a.programId.localeCompare(b.programId) || a.number - b.number)}
          columns={[
            { header: "Name", cell: (r) => <span className="font-medium text-text">{r.name}</span> },
            { header: "Program", cell: (r) => progName(r.programId) },
            { header: "Subjects", cell: (r) => tree.subjects.filter((s) => s.semesterId === r.id).length },
          ]}
          headerExtra={<QuickSemesters tree={tree} />}
          fields={[
            { name: "programId", label: "Program", type: "select", required: true, options: progOptions, span: 2 },
            { name: "number", label: "Semester number", type: "number", min: 1, max: 16, required: true },
            { name: "name", label: "Display name", type: "text", required: true, placeholder: "Semester 5" },
            { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
            { name: "isActive", label: "Active", type: "checkbox" },
          ]}
          emptyValues={() => ({ programId: tree.programs[0]?.id ?? "", number: "", name: "", slug: "", isActive: true })}
          toValues={(r) => ({ programId: r.programId, number: r.number, name: r.name, slug: r.slug, isActive: r.isActive })}
          toBody={(v) => ({ ...v, ...lineageFromProgram(v.programId), number: num(v.number, 1) })}
          validate={(v) => req(v, ["programId", "number", "name", "slug"])}
          create={(b) => api.catalog.create("semesters", b as never)}
          update={(id, b) => api.catalog.update("semesters", id, b as never)}
          remove={(id) => api.catalog.remove("semesters", id)}
        />
      )}

      {tab === "subjects" && (
        <EntityManager<Subject>
          noun="Subject"
          rows={[...tree.subjects].sort((a, b) => a.semesterId.localeCompare(b.semesterId) || a.order - b.order)}
          description="Units defined here populate the Unit dropdown when uploading notes."
          columns={[
            { header: "Code", cell: (r) => <Badge variant={r.code.startsWith("PLACEHOLDER") ? "warning" : "primary"}>{r.code}</Badge> },
            { header: "Name", cell: (r) => <span className="font-medium text-text">{r.name}</span> },
            { header: "Semester", cell: (r) => `${progName(r.programId)} · ${semName(r.semesterId)}` },
            { header: "Units", cell: (r) => r.units.length },
          ]}
          fields={[
            { name: "programId", label: "Program", type: "select", required: true, options: progOptions, onChangeReset: ["semesterId"] },
            { name: "semesterId", label: "Semester", type: "select", required: true, options: semOptions, placeholder: "Select program first" },
            { name: "code", label: "Course code", type: "text", required: true, placeholder: "MCE3152" },
            { name: "credits", label: "Credits", type: "number", min: 0, max: 30, step: 0.5 },
            { name: "name", label: "Subject name", type: "text", required: true, span: 2 },
            { name: "slug", label: "Slug", type: "slug", from: "name", required: true },
            { name: "order", label: "Display order", type: "number", min: 0 },
            { name: "description", label: "Description", type: "textarea" },
            { name: "units", label: "Syllabus units", type: "units", hint: "Only enter units from the official syllabus." },
            { name: "isActive", label: "Active", type: "checkbox" },
          ]}
          emptyValues={() => ({ programId: tree.programs[0]?.id ?? "", semesterId: "", code: "", credits: "", name: "", slug: "", order: 0, description: "", units: [], isActive: true })}
          toValues={(r) => ({ programId: r.programId, semesterId: r.semesterId, code: r.code, credits: r.credits ?? "", name: r.name, slug: r.slug, order: r.order, description: r.description ?? "", units: r.units, isActive: r.isActive })}
          toBody={(v) => {
            const { programId: _p, ...rest } = v;
            void _p;
            const units = ((v.units as { number: number; title: string }[]) ?? []).filter((u) => u.title.trim());
            return { ...rest, ...lineageFromSemester(v.semesterId), credits: optNum(v.credits) ?? null, order: num(v.order), units };
          }}
          validate={(v) => {
            const e = req(v, ["semesterId", "code", "name", "slug"]);
            const units = (v.units as { number: number }[]) ?? [];
            if (new Set(units.map((u) => u.number)).size !== units.length) e.units = "Unit numbers must be unique.";
            return e;
          }}
          create={(b) => api.catalog.create("subjects", b as never)}
          update={(id, b) => api.catalog.update("subjects", id, b as never)}
          remove={(id) => api.catalog.remove("subjects", id)}
        />
      )}
    </div>
  );
}

/** Create any missing "Semester N" entries for a program (1..totalSemesters). */
function QuickSemesters({ tree }: { tree: CatalogTree }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [programId, setProgramId] = React.useState(tree.programs[0]?.id ?? "");
  const [busy, setBusy] = React.useState(false);
  const program = tree.programs.find((p) => p.id === programId);
  const existing = new Set(tree.semesters.filter((s) => s.programId === programId).map((s) => s.number));
  const missing = program ? Array.from({ length: program.totalSemesters }, (_, i) => i + 1).filter((n) => !existing.has(n)) : [];

  const run = async () => {
    if (!program) return;
    setBusy(true);
    try {
      for (const n of missing) {
        await api.catalog.create("semesters", {
          universityId: program.universityId,
          departmentId: program.departmentId,
          programId: program.id,
          number: n,
          name: `Semester ${n}`,
          slug: `semester-${n}`,
          isActive: true,
        });
      }
      toast.success(`Added ${missing.length} semester${missing.length === 1 ? "" : "s"}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Couldn't add semesters", errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!tree.programs.length) return null;
  if (!open)
    return (
      <Button variant="secondary" onClick={() => setOpen(true)} leftIcon={<Layers className="h-4 w-4" aria-hidden />}>
        Quick add semesters
      </Button>
    );
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-bg-2 p-2">
      <Select aria-label="Program" value={programId} onChange={(e) => setProgramId(e.target.value)} options={tree.programs.map((p) => ({ value: p.id, label: p.shortName }))} className="min-w-48" />
      <Button size="sm" onClick={run} loading={busy} disabled={!missing.length}>
        {missing.length ? `Add ${missing.length} missing` : "All present"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Close
      </Button>
    </div>
  );
}
