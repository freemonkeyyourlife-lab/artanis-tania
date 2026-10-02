import React from "react";
import { cn } from "@/lib/utils";
import { ListChecks } from "lucide-react";
import { DIRECTION_LEVELS } from "@/lib/imageDirection";

// Bevor der Lauf startet: jede geplante Kombination aus Charakter und Modell
// einzeln einstellen. Ohne eigene Wahl gilt die Stufe des Modells, sonst der Regler.
export default function MassJobPlan({ jobs, onLevel, busy }) {
  if (!jobs.length) return null;

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <p className="text-[15px] font-bold text-foreground mb-1 flex items-center gap-2">
        <ListChecks className="w-4 h-4 text-primary" /> Feinschliff vor dem Start
      </p>
      <p className="text-[13px] font-semibold text-muted-foreground mb-3">
        Lege pro Charakter-Modell fest, wie freizügig das Ergebnis ausfällt. Voreingestellt ist die Stufe des Modells,
        sonst der Regler oben.
      </p>

      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
        {jobs.map((j) => (
          <div key={j.key} className="rounded-xl bg-elevated border border-border p-2.5">
            <p className="text-[13px] font-bold text-foreground truncate">
              {j.creatorName}
              <span className="font-semibold text-muted-foreground"> · {j.modelName}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {DIRECTION_LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onLevel(j.key, l.id)}
                  disabled={busy}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold transition-colors disabled:opacity-60",
                    j.level === l.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-background border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}