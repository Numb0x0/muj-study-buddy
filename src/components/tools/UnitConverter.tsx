"use client";

import * as React from "react";
import { ArrowLeftRight, Ruler } from "lucide-react";
import { ToolCard } from "./ToolCard";

interface Conversion {
  id: string;
  label: string;
  a: string;
  b: string;
  /** a → b */
  factor: number;
}

const CONVERSIONS: Conversion[] = [
  { id: "angle", label: "Angle", a: "rad", b: "deg", factor: 180 / Math.PI },
  { id: "speed", label: "Angular speed", a: "rpm", b: "rad/s", factor: (2 * Math.PI) / 60 },
  { id: "torque", label: "Torque", a: "N·m", b: "kgf·cm", factor: 100 / 9.80665 },
  { id: "length", label: "Length", a: "mm", b: "in", factor: 1 / 25.4 },
];

function fmt(n: number) {
  if (!Number.isFinite(n)) return "";
  return Number(n.toPrecision(8)).toString();
}

export function UnitConverter() {
  return (
    <ToolCard id="units" icon={<Ruler className="h-6 w-6" aria-hidden />} title="Robotics Unit Converter" description="Quick conversions you keep needing in labs and assignments.">
      <div className="grid gap-4 md:grid-cols-2">
        {CONVERSIONS.map((c) => (
          <ConversionRow key={c.id} conv={c} />
        ))}
      </div>
    </ToolCard>
  );
}

function ConversionRow({ conv }: { conv: Conversion }) {
  const [a, setA] = React.useState("1");
  const [b, setB] = React.useState(fmt(conv.factor));
  const idA = `${conv.id}-a`;
  const idB = `${conv.id}-b`;
  return (
    <fieldset className="rounded-xl border border-border bg-bg-2/60 p-4">
      <legend className="px-1 text-sm font-semibold text-text-2">{conv.label}</legend>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label htmlFor={idA} className="text-xs text-text-3">
          {conv.a}
          <input
            id={idA}
            inputMode="decimal"
            className="field mt-1"
            value={a}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.eE+-]/g, "");
              setA(v);
              setB(v === "" ? "" : fmt(Number(v) * conv.factor));
            }}
          />
        </label>
        <ArrowLeftRight className="mb-3 h-4 w-4 text-text-3" aria-hidden />
        <label htmlFor={idB} className="text-xs text-text-3">
          {conv.b}
          <input
            id={idB}
            inputMode="decimal"
            className="field mt-1"
            value={b}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d.eE+-]/g, "");
              setB(v);
              setA(v === "" ? "" : fmt(Number(v) / conv.factor));
            }}
          />
        </label>
      </div>
    </fieldset>
  );
}
