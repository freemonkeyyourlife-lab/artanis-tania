import React from "react";
import { cn } from "@/lib/utils";
import { PLAN_STATUSES } from "@/lib/contentPlan";

// Die Pipeline auf einen Blick: wie viel steckt in welcher Stufe.
// Ein Klick filtert den Plan auf genau diese Stufe.
export default function PlanPipeline({ counts = {}, active, onPick }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
      <button
        onClick={() => onPick("")}
        className={cn(
          "rounded-2xl border-2 p-3 text-left transition-colors",
          !active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
        )}
      >
        <p className="text-2xl font-display text-foreground">{total}</p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Alle</p>
      </button>
      {PLAN_STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => onPick(s.value)}
          className={cn(
            "rounded-2xl border-2 p-3 text-left transition-colors",
            active === s.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"
          )}
        >
          <p className={cn("text-2xl font-display", s.value === "PUBLISHED" ? "text-emerald-400" : "text-foreground")}>
            {counts[s.value] || 0}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">{s.label}</p>
        </button>
      ))}
    </div>
  );
}