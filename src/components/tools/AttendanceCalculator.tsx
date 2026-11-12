"use client";

import { CalendarCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { FormulaNote, StatTile, ToolCard } from "./ToolCard";
import { usePersistedState } from "./usePersistedState";

interface State {
  attended: string;
  total: string;
  target: string;
}

export function AttendanceCalculator() {
  const [s, setS] = usePersistedState<State>("tools:attendance", { attended: "", total: "", target: "75" });
  const attended = Number(s.attended);
  const total = Number(s.total);
  const target = Number(s.target);

  let error: string | null = null;
  if (s.attended !== "" && s.total !== "") {
    if (!Number.isInteger(attended) || !Number.isInteger(total) || attended < 0 || total < 0) error = "Use whole numbers of classes.";
    else if (attended > total) error = "Attended classes can't exceed total classes.";
  }
  if (!error && (target <= 0 || target >= 100 || !Number.isFinite(target))) error = s.target ? "Target must be between 1 and 99%." : null;

  const ready = !error && s.attended !== "" && s.total !== "" && total > 0;
  const pct = ready ? (attended / total) * 100 : null;
  const t = target / 100;
  // Classes you may still skip and stay ≥ target: floor(attended / t − total)
  const canSkip = ready && pct! >= target ? Math.floor(attended / t - total + 1e-9) : 0;
  // Consecutive classes needed to reach target: ceil((t·total − attended) / (1 − t))
  const mustAttend = ready && pct! < target ? Math.ceil((t * total - attended) / (1 - t) - 1e-9) : 0;

  return (
    <ToolCard id="attendance" icon={<CalendarCheck className="h-6 w-6" aria-hidden />} title="Attendance Calculator" description="See where you stand and how many classes you can miss or must attend.">
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="Classes attended" inputMode="numeric" value={s.attended} onChange={(e) => setS((p) => ({ ...p, attended: e.target.value.replace(/\D/g, "") }))} placeholder="42" />
        <Input label="Total classes held" inputMode="numeric" value={s.total} onChange={(e) => setS((p) => ({ ...p, total: e.target.value.replace(/\D/g, "") }))} placeholder="50" />
        <Input label="Target %" inputMode="decimal" value={s.target} onChange={(e) => setS((p) => ({ ...p, target: e.target.value.replace(/[^\d.]/g, "") }))} placeholder="75" />
      </div>
      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatTile label="Current attendance" value={pct === null ? "—" : `${pct.toFixed(1)}%`} tone={pct === null ? "muted" : pct >= target ? "success" : "danger"} />
        {pct === null ? (
          <StatTile tone="muted" label="Status" value="—" hint="Enter attended and total classes." />
        ) : pct >= target ? (
          <StatTile tone="success" label="You can skip" value={`${canSkip} class${canSkip === 1 ? "" : "es"}`} hint={`and still stay at or above ${target}%`} />
        ) : (
          <StatTile tone="warning" label="Attend next" value={`${mustAttend} class${mustAttend === 1 ? "" : "es"}`} hint={`in a row to reach ${target}%`} />
        )}
      </div>
      <div className="mt-4">
        <FormulaNote lines={["attendance = attended ÷ total × 100", "can skip = ⌊attended ÷ target − total⌋", "must attend = ⌈(target × total − attended) ÷ (1 − target)⌉"]} />
      </div>
    </ToolCard>
  );
}
