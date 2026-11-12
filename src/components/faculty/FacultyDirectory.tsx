"use client";

import * as React from "react";
import { Filter, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Department, Faculty } from "@/types";
import { cn } from "@/lib/utils";
import { FacultyCard } from "./FacultyCard";

interface Props {
  faculty: Faculty[];
  departments: Department[];
  initialDepartmentId?: string;
}

interface Pill {
  id: string;
  label: string;
  count: number;
}

const ALL = "all";

export function FacultyDirectory({ faculty, departments, initialDepartmentId }: Props) {
  // Pills come from departments that actually have at least one profile,
  // labelled from the catalogue when possible (falls back to the denormalised label).
  const pills = React.useMemo<Pill[]>(() => {
    const byId = new Map(departments.map((d) => [d.id, d]));
    const counts = new Map<string, Pill>();
    for (const f of faculty) {
      const existing = counts.get(f.departmentId);
      if (existing) existing.count++;
      else {
        const dept = byId.get(f.departmentId);
        counts.set(f.departmentId, { id: f.departmentId, label: dept?.shortName || dept?.name || f.departmentLabel, count: 1 });
      }
    }
    const order = new Map(departments.map((d, i) => [d.id, i]));
    return [...counts.values()].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999) || a.label.localeCompare(b.label));
  }, [faculty, departments]);

  const [active, setActive] = React.useState<string>(() =>
    initialDepartmentId && pills.some((p) => p.id === initialDepartmentId) ? initialDepartmentId : ALL,
  );

  const visible = active === ALL ? faculty : faculty.filter((f) => f.departmentId === active);

  function select(id: string) {
    setActive(id);
    // Keep the URL shareable without triggering a server round-trip.
    try {
      const url = new URL(window.location.href);
      if (id === ALL) url.searchParams.delete("department");
      else url.searchParams.set("department", id);
      window.history.replaceState(window.history.state, "", url);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      {pills.length > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="group" aria-label="Filter by department" className="flex flex-wrap gap-2">
            <FilterPill active={active === ALL} onClick={() => select(ALL)} label="All" count={faculty.length} />
            {pills.map((p) => (
              <FilterPill key={p.id} active={active === p.id} onClick={() => select(p.id)} label={p.label} count={p.count} />
            ))}
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs text-text-3" aria-live="polite">
            <Filter className="h-3.5 w-3.5" aria-hidden />
            Showing {visible.length} of {faculty.length}
          </p>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          compact
          icon={<UsersRound className="h-6 w-6" aria-hidden />}
          title="No faculty in this department yet"
          description="Try another department or view the full directory."
          action={
            <Button variant="outline" size="sm" onClick={() => select(ALL)}>
              Show all faculty
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Faculty profiles">
          {visible.map((f) => (
            <li key={f.id} className="min-w-0">
              <FacultyCard faculty={f} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        active ? "border-primary/60 bg-primary/15 text-lavender shadow-glow-sm" : "border-border bg-surface/60 text-text-2 hover:border-primary/40 hover:text-text",
      )}
    >
      {label}
      <span className={cn("rounded-full px-1.5 text-[11px] leading-4", active ? "bg-primary/25 text-lavender-2" : "bg-white/5 text-text-3")}>{count}</span>
    </button>
  );
}
