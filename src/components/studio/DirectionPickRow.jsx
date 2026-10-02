import React from "react";
import { cn } from "@/lib/utils";

// Eine Reihe Regler: draufklicken wählt, nochmal klicken nimmt zurück.
export default function DirectionPickRow({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(on ? "" : o.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors",
                on
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}