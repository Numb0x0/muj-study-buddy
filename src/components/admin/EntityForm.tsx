"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox, Input, Select, Textarea, type SelectOption } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { slugify } from "@/lib/utils";
import { TagInput } from "./TagInput";

export type FormValues = Record<string, unknown>;

export type FieldDef =
  | { name: string; label: string; type: "text" | "email" | "url" | "tel" | "date"; required?: boolean; hint?: string; placeholder?: string; span?: 2 }
  | { name: string; label: string; type: "number"; required?: boolean; hint?: string; min?: number; max?: number; step?: number; span?: 2 }
  | { name: string; label: string; type: "textarea"; required?: boolean; hint?: string; rows?: number; span?: 2 }
  | { name: string; label: string; type: "select"; required?: boolean; hint?: string; placeholder?: string; options: (v: FormValues) => SelectOption[]; onChangeReset?: string[]; span?: 2 }
  | { name: string; label: string; type: "checkbox"; hint?: string; span?: 2 }
  | { name: string; label: string; type: "slug"; from: string; required?: boolean; hint?: string; span?: 2 }
  | { name: string; label: string; type: "tags"; hint?: string; lowercase?: boolean; max?: number; span?: 2 }
  | { name: string; label: string; type: "units"; hint?: string; span?: 2 };

interface Props {
  fields: FieldDef[];
  values: FormValues;
  onChange: (v: FormValues) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  /** Tracks whether the slug was edited manually (stop auto-generating). */
  slugTouched?: boolean;
  onSlugTouched?: () => void;
}

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function EntityForm({ fields, values, onChange, errors = {}, disabled, slugTouched, onSlugTouched }: Props) {
  const set = (name: string, value: unknown, extra?: FormValues) => {
    const next: FormValues = { ...values, [name]: value, ...extra };
    // Auto-slug from its source field until the admin edits the slug.
    if (!slugTouched) {
      for (const f of fields) if (f.type === "slug" && f.from === name) next[f.name] = slugify(String(value ?? ""));
    }
    onChange(next);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const span = f.span === 2 || f.type === "textarea" || f.type === "units" || f.type === "tags" ? "sm:col-span-2" : "";
        const err = errors[f.name];
        switch (f.type) {
          case "checkbox":
            return (
              <div key={f.name} className={`${span} flex flex-col justify-end`}>
                <Checkbox label={f.label} checked={Boolean(values[f.name])} onChange={(e) => set(f.name, e.target.checked)} disabled={disabled} />
                {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
              </div>
            );
          case "textarea":
            return <Textarea key={f.name} className={span} label={f.label} required={f.required} rows={f.rows ?? 3} value={str(values[f.name])} onChange={(e) => set(f.name, e.target.value)} error={err} hint={f.hint} disabled={disabled} />;
          case "select": {
            const extra: FormValues = {};
            return (
              <Select
                key={f.name}
                className={span}
                label={f.label}
                required={f.required}
                value={str(values[f.name])}
                onChange={(e) => {
                  for (const r of f.onChangeReset ?? []) extra[r] = "";
                  set(f.name, e.target.value, extra);
                }}
                options={f.options(values)}
                placeholder={f.placeholder ?? "Select…"}
                error={err}
                hint={f.hint}
                disabled={disabled}
              />
            );
          }
          case "number":
            return (
              <Input
                key={f.name}
                className={span}
                type="number"
                label={f.label}
                required={f.required}
                min={f.min}
                max={f.max}
                step={f.step ?? 1}
                value={str(values[f.name])}
                onChange={(e) => set(f.name, e.target.value === "" ? "" : Number(e.target.value))}
                error={err}
                hint={f.hint}
                disabled={disabled}
              />
            );
          case "slug":
            return (
              <Input
                key={f.name}
                className={span}
                label={f.label}
                required={f.required}
                value={str(values[f.name])}
                onChange={(e) => {
                  onSlugTouched?.();
                  onChange({ ...values, [f.name]: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") });
                }}
                error={err}
                hint={f.hint ?? "Used in URLs. Lowercase letters, numbers and dashes."}
                disabled={disabled}
              />
            );
          case "tags":
            return (
              <div key={f.name} className={span}>
                <TagInput label={f.label} value={(values[f.name] as string[]) ?? []} onChange={(t) => set(f.name, t)} lowercase={f.lowercase ?? true} max={f.max ?? 12} maxLength={60} hint={f.hint} error={err} disabled={disabled} />
              </div>
            );
          case "units":
            return <UnitsEditor key={f.name} label={f.label} value={(values[f.name] as { number: number; title: string }[]) ?? []} onChange={(u) => set(f.name, u)} error={err} hint={f.hint} disabled={disabled} />;
          default:
            return <Input key={f.name} className={span} type={f.type} label={f.label} required={f.required} placeholder={f.placeholder} value={str(values[f.name])} onChange={(e) => set(f.name, e.target.value)} error={err} hint={f.hint} disabled={disabled} />;
        }
      })}
    </div>
  );
}

function UnitsEditor({ label, value, onChange, error, hint, disabled }: { label: string; value: { number: number; title: string }[]; onChange: (u: { number: number; title: string }[]) => void; error?: string; hint?: string; disabled?: boolean }) {
  const add = () => onChange([...value, { number: (value.reduce((m, u) => Math.max(m, u.number), 0) || 0) + 1, title: "" }]);
  return (
    <fieldset className="space-y-2 sm:col-span-2">
      <legend className="mb-1.5 text-sm font-medium text-text-2">{label}</legend>
      {value.length === 0 && <p className="text-xs text-muted">No units yet.</p>}
      {value.map((u, i) => (
        <div key={i} className="grid grid-cols-[4.5rem_1fr_2.5rem] gap-2">
          <input aria-label={`Unit ${i + 1} number`} type="number" min={1} max={20} className="field" value={u.number} disabled={disabled} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, number: Number(e.target.value) } : x)))} />
          <input aria-label={`Unit ${i + 1} title`} className="field" value={u.title} placeholder="Unit title" disabled={disabled} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
          <button type="button" aria-label={`Remove unit ${i + 1}`} disabled={disabled} onClick={() => onChange(value.filter((_, j) => j !== i))} className="inline-flex items-center justify-center rounded-xl text-text-3 hover:bg-danger/10 hover:text-danger">
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={add} disabled={disabled || value.length >= 20} leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
        Add unit
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </fieldset>
  );
}
