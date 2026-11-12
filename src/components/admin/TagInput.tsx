"use client";

import * as React from "react";
import { X } from "lucide-react";
import { FieldWrapper } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  hint?: string;
  error?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  maxLength?: number;
  lowercase?: boolean;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

/** Chip input: Enter / comma / Tab adds, Backspace on empty removes the last chip. */
export function TagInput({ label, hint, error, value, onChange, max = 15, maxLength = 32, lowercase = true, placeholder = "Type and press Enter", id, disabled }: Props) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((p) => (lowercase ? p.toLowerCase() : p).trim().slice(0, maxLength))
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.includes(p)) next.push(p);
    }
    onChange(next);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));
  const full = value.length >= max;

  return (
    <FieldWrapper label={label} hint={hint ?? `${value.length}/${max}`} error={error} id={inputId}>
      <div
        className={cn("field flex min-h-11 cursor-text flex-wrap items-center gap-1.5 py-1.5", error && "border-danger", disabled && "opacity-60")}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 text-xs font-medium text-lavender">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(tag);
              }}
              aria-label={`Remove ${tag}`}
              className="rounded-full p-0.5 hover:bg-white/10"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          value={draft}
          disabled={disabled || full}
          placeholder={full ? `Maximum ${max} reached` : value.length ? "" : placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) commit(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || (e.key === "Tab" && draft.trim())) {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && commit(draft)}
          className="min-w-[8rem] flex-1 bg-transparent text-sm text-text outline-none placeholder:text-muted"
          aria-describedby={undefined}
        />
      </div>
    </FieldWrapper>
  );
}
