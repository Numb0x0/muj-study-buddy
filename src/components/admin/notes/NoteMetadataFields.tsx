"use client";

import * as React from "react";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { unitLabel } from "@/lib/utils";
import { RESOURCE_TYPE_OPTIONS } from "@/constants/resources";
import type { CatalogTree } from "@/lib/queries/catalog";
import type { ResourceType } from "@/types";
import { programLabel, semesterLabel, semestersOf, subjectLabel, subjectsOf, unitsOf } from "../cascade";
import { TagInput } from "../TagInput";

export interface NoteFormValues {
  programId: string;
  semesterId: string;
  subjectId: string;
  unitNumber: number | null;
  resourceType: ResourceType | "";
  title: string;
  description: string;
  tags: string[];
}

export const EMPTY_NOTE_FORM: NoteFormValues = { programId: "", semesterId: "", subjectId: "", unitNumber: null, resourceType: "", title: "", description: "", tags: [] };

export function validateNoteForm(v: NoteFormValues): Record<string, string> {
  const e: Record<string, string> = {};
  if (!v.programId) e.programId = "Choose a program.";
  if (!v.semesterId) e.semesterId = "Choose a semester.";
  if (!v.subjectId) e.subjectId = "Choose a subject.";
  if (!v.resourceType) e.resourceType = "Choose a resource type.";
  if (!v.title.trim()) e.title = "Title is required.";
  else if (v.title.trim().length > 160) e.title = "Keep the title under 160 characters.";
  if (v.description.length > 4000) e.description = "Description is too long.";
  return e;
}

interface Props {
  catalog: CatalogTree;
  value: NoteFormValues;
  onChange: (next: NoteFormValues) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

/** Program → Semester → Subject → Unit cascade plus the descriptive fields. */
export function NoteMetadataFields({ catalog, value, onChange, errors = {}, disabled }: Props) {
  const programs = React.useMemo(() => [...catalog.programs].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)), [catalog.programs]);
  const semesters = semestersOf(catalog, value.programId);
  const subjects = subjectsOf(catalog, value.semesterId);
  const units = unitsOf(catalog, value.subjectId);
  const set = (patch: Partial<NoteFormValues>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Degree program"
          required
          value={value.programId}
          onChange={(e) => set({ programId: e.target.value, semesterId: "", subjectId: "", unitNumber: null })}
          options={programs.map((p) => ({ value: p.id, label: programLabel(p) }))}
          placeholder={programs.length ? "Select program" : "No programs — add one in Catalogue"}
          error={errors.programId}
          disabled={disabled}
        />
        <Select
          label="Semester"
          required
          value={value.semesterId}
          onChange={(e) => set({ semesterId: e.target.value, subjectId: "", unitNumber: null })}
          options={semesters.map((s) => ({ value: s.id, label: semesterLabel(s) }))}
          placeholder={value.programId ? (semesters.length ? "Select semester" : "No semesters for this program") : "Select a program first"}
          error={errors.semesterId}
          disabled={disabled || !value.programId}
        />
        <Select
          label="Subject"
          required
          value={value.subjectId}
          onChange={(e) => set({ subjectId: e.target.value, unitNumber: null })}
          options={subjects.map((s) => ({ value: s.id, label: subjectLabel(s) }))}
          placeholder={value.semesterId ? (subjects.length ? "Select subject" : "No subjects in this semester") : "Select a semester first"}
          error={errors.subjectId}
          disabled={disabled || !value.semesterId}
        />
        <Select
          label="Unit"
          value={value.unitNumber === null ? "" : String(value.unitNumber)}
          onChange={(e) => set({ unitNumber: e.target.value ? Number(e.target.value) : null })}
          options={units.map((u) => ({ value: String(u.number), label: unitLabel(u.number, u.title) ?? `Unit ${u.number}` }))}
          placeholder={value.subjectId ? "Whole subject / not unit-specific" : "Select a subject first"}
          disabled={disabled || !value.subjectId}
          hint={value.subjectId && units.length === 0 ? "This subject has no units defined yet." : undefined}
        />
      </div>
      <Select
        label="Resource type"
        required
        value={value.resourceType}
        onChange={(e) => set({ resourceType: e.target.value as ResourceType })}
        options={RESOURCE_TYPE_OPTIONS}
        placeholder="Select type"
        error={errors.resourceType}
        disabled={disabled}
      />
      <Input label="Title" required value={value.title} onChange={(e) => set({ title: e.target.value })} maxLength={160} error={errors.title} disabled={disabled} />
      <Textarea label="Description" value={value.description} onChange={(e) => set({ description: e.target.value })} rows={3} maxLength={4000} error={errors.description} hint="Optional. What's covered, source, year of the paper…" disabled={disabled} />
      <TagInput label="Tags" value={value.tags} onChange={(tags) => set({ tags })} disabled={disabled} hint="Press Enter or comma to add. Helps search (e.g. dh-parameters, endsem-2024)." />
    </div>
  );
}

export function toApiMetadata(v: NoteFormValues) {
  return {
    programId: v.programId,
    semesterId: v.semesterId,
    subjectId: v.subjectId,
    unitNumber: v.unitNumber,
    resourceType: v.resourceType as ResourceType,
    title: v.title.trim(),
    description: v.description.trim(),
    tags: v.tags,
  };
}
