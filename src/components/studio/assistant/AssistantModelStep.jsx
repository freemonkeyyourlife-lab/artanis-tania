import React, { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { suggestModel, usableModels } from "@/lib/assistant";
import { modelStrength } from "@/lib/modelStrengths";
import ModelStrengthNote from "@/components/studio/ModelStrengthNote";

const TARGETS = [
  { id: "BILD", label: "Bild" },
  { id: "VIDEO", label: "Video" },
  { id: "TEXT", label: "Text" },
];

// Schritt 3: Welches Modell? Der Assistent schlägt eines vor — du kannst
// umschalten oder ein anderes nehmen.
export default function AssistantModelStep({ creator, imageModels, videoModels, textModels, value, onChange }) {
  const [target, setTarget] = useState(value?.target || "BILD");

  const imageEntries = usableModels(imageModels);
  const suggested = target === "BILD" ? suggestModel(imageEntries, creator) : null;

  const options =
    target === "BILD"
      ? imageEntries.map((e) => ({
          key: e.model.id,
          name: e.model.name,
          note: e.preset.label,
          preset: e.preset,
          strength: modelStrength(e.model),
        }))
      : (target === "VIDEO" ? videoModels : textModels)
          .filter((m) => m.enabled !== false)
          .map((m) => ({ key: m.id, name: m.name, note: m.modelId, preset: null }));

  const switchTarget = (id) => {
    setTarget(id);
    onChange(null);
  };

  return (
    <div>
      <p className="font-display text-xl text-foreground mb-1">Welches Modell?</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Für „{creator?.stageName}“ empfehle ich das markierte Modell. Nimm es, oder wähle ein anderes — der Prompt
        schreibt sich danach in dessen eigener Sprache.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TARGETS.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTarget(t.id)}
            className={cn(
              "px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
              target === t.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {options.length === 0 ? (
        <p className="text-[15px] font-semibold text-muted-foreground py-8">
          Für {TARGETS.find((t) => t.id === target)?.label} ist noch kein Modell eingetragen.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {options.map((o) => {
            const isSuggested = suggested?.model?.id === o.key;
            const active = value?.name === o.name && value?.target === target;
            return (
              <button
                key={o.key}
                onClick={() => onChange({ target, name: o.name, preset: o.preset })}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition-colors",
                  active ? "border-primary" : "border-border hover:border-primary/50"
                )}
              >
                <p className="inline-flex items-center gap-2 text-[15px] font-bold text-foreground mb-1">
                  {active && <Check className="w-4 h-4 text-primary" />}
                  {o.name}
                </p>
                <p className="text-[13px] font-semibold text-muted-foreground">{o.note}</p>
                {o.strength && <ModelStrengthNote chips={o.strength.chips} hint={o.strength.hint} />}
                {isSuggested && (
                  <p className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> Empfohlen
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}