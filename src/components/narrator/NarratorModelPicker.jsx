import React, { useMemo, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputCls, labelCls } from "@/lib/narratorUi";
import { modelStrength, STANDARD_STRENGTH } from "@/lib/modelStrengths";
import ModelStrengthNote from "@/components/studio/StrengthChips";
import { sortModels } from "@/lib/modelSort";
import { styleOption, explicitOption, charakterOption } from "@/lib/modelTags";

const badge = (tone) =>
  cn("px-1.5 py-0.5 rounded-full border text-[9px] font-bold", tone || "bg-elevated text-muted-foreground border-border");

// Alles, was im Studio an Bildmodellen freigeschaltet ist — Favoriten oben.
// Mehrere dürfen gleichzeitig ran, dann laufen sie parallel.
export default function NarratorModelPicker({ models, loading, selected, onToggle, onClear }) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const sorted = sortModels(models);
    if (!term) return sorted;
    return sorted.filter((m) => `${m.name || ""} ${m.description || ""} ${m.note || ""} ${m.modelId || ""}`.toLowerCase().includes(term));
  }, [models, q]);

  return (
    <div>
      <label className={labelCls}>
        Modelle · {selected.length ? `${selected.length} gewählt` : "Standard-Generator"}
      </label>

      <div className="relative mb-2">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Modell suchen …"
          className={cn(inputCls, "pl-9")}
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border-2 border-border bg-background p-1.5 space-y-1">
        <button
          onClick={onClear}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg text-[13px] font-bold transition-colors",
            !selected.length ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Standard-Generator
          <ModelStrengthNote chips={STANDARD_STRENGTH.chips} hint={STANDARD_STRENGTH.hint} />
        </button>

        {loading && (
          <p className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Modelle werden geladen …
          </p>
        )}

        {!loading && !list.length && (
          <p className="px-3 py-2 text-[12px] font-semibold text-muted-foreground">
            {models.length ? "Nichts gefunden." : "Noch keine Modelle im Studio freigeschaltet."}
          </p>
        )}

        {list.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => onToggle(m.id)}
              className={cn(
                "w-full flex items-start gap-2 px-3 py-2 rounded-lg text-[13px] font-bold text-left transition-colors",
                on ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0",
                  on ? "bg-primary border-primary text-primary-foreground" : "border-border"
                )}
              >
                {on && <Check className="w-3 h-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  {m.favorite ? "★ " : ""}
                  {m.name}
                </span>
                <ModelStrengthNote chips={modelStrength(m).chips} hint={modelStrength(m).hint} />
                {(m.description || m.note) && (
                  <span className="block text-[11px] text-muted-foreground line-clamp-2 mt-0.5 font-normal leading-snug">
                    {m.description || m.note}
                  </span>
                )}
                {(m.style || m.explicit || m.charakter) && (
                  <span className="flex flex-wrap gap-1 mt-1">
                    {styleOption("BILD", m.style) && (
                      <span className={badge(styleOption("BILD", m.style).tone)}>{styleOption("BILD", m.style).label}</span>
                    )}
                    {explicitOption(m.explicit) && (
                      <span className={badge(explicitOption(m.explicit).tone)}>{explicitOption(m.explicit).label}</span>
                    )}
                    {charakterOption(m.charakter) && (
                      <span className={badge(charakterOption(m.charakter).tone)}>{charakterOption(m.charakter).label}</span>
                    )}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}