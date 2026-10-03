import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOODS, bestModelFor, explicitLabel, styleLabel } from "@/lib/modelTags";
import { modelStrength } from "@/lib/modelStrengths";
import ModelStrengthNote from "@/components/studio/StrengthChips";

const ENTITY = { BILD: "ImageModel", VIDEO: "VideoModel", TEXT: "TextModel" };

// Stimmung wählen — und der Prompt-Profi greift von selbst das Modell, das
// dafür am besten geeignet ist.
export default function MoodModelPicker({ target = "BILD", onPick }) {
  const [models, setModels] = useState([]);
  const [moods, setMoods] = useState([]);

  useEffect(() => {
    setMoods([]);
    onPick?.(null, []);
    const name = ENTITY[target] || "ImageModel";
    base44.entities[name]
      .filter({ enabled: { $ne: false } }, { sort: "name", limit: 300 })
      .then((page) => setModels(page.items || []))
      .catch(() => setModels([]));
  }, [target]);

  const best = bestModelFor(models, { moods });

  const toggle = (id) => {
    const next = moods.includes(id) ? moods.filter((m) => m !== id) : [...moods, id];
    setMoods(next);
    onPick?.(bestModelFor(models, { moods: next })?.model || null, next);
  };

  const traits = best
    ? [styleLabel(target, best.model.style), explicitLabel(best.model.explicit)].filter(Boolean)
    : [];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 mb-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        Stimmung &amp; Sinn
      </p>
      <div className="flex flex-wrap gap-1.5">
        {MOODS.map((m) => (
          <button
            key={m.id}
            onClick={() => toggle(m.id)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors",
              moods.includes(m.id)
                ? cn("border-transparent", m.tone)
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {best ? (
        <div className="mt-3 rounded-xl border border-primary/30 bg-elevated px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-[13px] font-semibold text-foreground flex-1 min-w-0">
              Passt am besten: <span className="text-primary">{best.model.name}</span>
              {traits.length ? ` · ${traits.join(" · ")}` : ""}
            </p>
            <button
              onClick={() => onPick?.(best.model, moods)}
              className="px-4 py-1.5 rounded-full glass-btn glass-btn-accent text-[12px] font-bold text-gloss"
            >
              Nehmen
            </button>
          </div>
          <ModelStrengthNote chips={modelStrength(best.model).chips} hint={modelStrength(best.model).hint} />
        </div>
      ) : (
        <p className="mt-3 text-[12px] font-semibold text-muted-foreground">
          {moods.length === 0
            ? "Wähle eine Stimmung — dann zeigt sich, welches deiner Modelle dafür am besten geeignet ist."
            : "Kein Modell trägt diese Kategorie — vergib sie in der Modell-Liste, dann findet er es hier von selbst."}
        </p>
      )}
    </div>
  );
}