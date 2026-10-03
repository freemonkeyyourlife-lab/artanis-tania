import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { PRESETS, presetById, presetFor } from "@/lib/modelPrompts";
import { modelStrength } from "@/lib/modelStrengths";
import ModelStrengthNote from "@/components/studio/StrengthChips";

// Modell wählen — der Generator benutzt dann dessen eigene Syntax. Was hier
// erkannt wird, merkt sich das Modell als Grundsetting.
export default function ModelPresetPicker({ value, onChange }) {
  const [models, setModels] = useState([]);

  useEffect(() => {
    base44.entities.ImageModel.filter(
        { enabled: { $ne: false } },
        { sort: "name", limit: 200, fields: ["name", "modelId", "preset", "style", "explicit", "note", "description"] }
      )
      .then((page) => setModels(page.items || []))
      .catch(() => setModels([]));
  }, []);

  const model = models.find((m) => m.id === value.modelId) || null;
  const preset = presetById(value.presetId);

  const pickModel = (id) => {
    const picked = models.find((m) => m.id === id) || null;
    onChange({ modelId: id, presetId: presetFor(picked).id });
  };

  // Als Grundsetting am Modell festhalten — beim nächsten Mal steht es sofort da.
  const setPreset = async (id) => {
    onChange({ ...value, presetId: id });
    if (!model) return;
    try {
      await base44.entities.ImageModel.update(model.id, { preset: id });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 mb-4">
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Modell</label>
          <select
            value={value.modelId}
            onChange={(e) => pickModel(e.target.value)}
            className="mt-1.5 w-full h-11 rounded-xl bg-background border border-border px-3 text-[15px] font-semibold text-foreground focus:outline-none focus:border-primary/50"
          >
            <option value="">Ohne Modell (neutral)</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sprache des Modells</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={cn(
                  "px-3.5 py-2 rounded-full text-[13px] font-bold transition-colors",
                  value.presetId === p.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[13px] font-semibold text-muted-foreground leading-relaxed">
        <span className="text-foreground font-bold">{preset.label}</span> · {preset.mode}. {preset.howto}
        {model && (
          <span className="block mt-1 text-primary">
            Steht als Grundsetting bei „{model.name}“.
          </span>
        )}
      </p>
      {model && <ModelStrengthNote chips={modelStrength(model).chips} hint={modelStrength(model).hint} />}
    </div>
  );
}