import React from "react";
import { cn } from "@/lib/utils";
import { CheckSquare, Square } from "lucide-react";
import { DIRECTION_LEVELS } from "@/lib/imageDirection";
import { modelStrength } from "@/lib/modelStrengths";
import ModelStrengthNote from "@/components/studio/StrengthChips";

// Womit erzeugt wird — und wie freizügig jedes Modell arbeiten soll.
// Die Stufe hängt direkt am Modell und gilt ab jetzt überall.
export default function MassModelPicker({ models, modelIds, onToggle, onLevel }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <p className="text-[15px] font-bold text-foreground">Womit?</p>
      <p className="text-[12px] font-semibold text-muted-foreground mb-3">
        Ohne Auswahl läuft der Standard-Generator. Die Freizügigkeit stellst du hier direkt am Modell ein.
      </p>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {models.map((m) => {
          const on = modelIds.includes(m.id);
          return (
            <div
              key={m.id}
              className={cn("rounded-xl border p-2.5", on ? "border-primary/40 bg-primary/10" : "border-border bg-background")}
            >
              <button type="button" onClick={() => onToggle(m.id)} className="w-full flex items-center gap-2 text-left">
                {on ? (
                  <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-[14px] font-bold text-foreground truncate">{m.name}</span>
                {m.favorite && <span className="ml-auto text-[11px] font-bold text-primary">Favorit</span>}
              </button>
              <div className="pl-6">
                <ModelStrengthNote chips={modelStrength(m).chips} hint={modelStrength(m).hint} />
              </div>
              <div className="flex flex-wrap gap-1 mt-2 pl-6">
                {DIRECTION_LEVELS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onLevel(m, l.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors",
                      m.explicit === l.id
                        ? "bg-primary/25 text-primary border-primary/40"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {!models.length && (
          <p className="text-[13px] font-semibold text-muted-foreground text-center py-8">
            Noch keine Bild-Modelle im Studio freigeschaltet.
          </p>
        )}
      </div>
    </div>
  );
}