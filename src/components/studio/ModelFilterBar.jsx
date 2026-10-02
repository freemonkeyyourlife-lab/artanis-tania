import React from "react";
import { cn } from "@/lib/utils";
import { filterEmpty, usedOptions } from "@/lib/modelTags";

const chip = (on, tone) =>
  cn(
    "px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors",
    on ? cn("border-transparent", tone) : "bg-background border-border text-muted-foreground hover:text-foreground"
  );

// Nach Kategorie filtern — es stehen nur die Etiketten da, die in der eigenen
// Liste auch wirklich vorkommen.
export default function ModelFilterBar({ kind = "BILD", models, value, onChange }) {
  const used = usedOptions(models, kind);
  if (!used.any) return null;

  const f = value || { style: "", explicit: "", moods: [] };
  const toggleMood = (id) => {
    const moods = f.moods || [];
    onChange({ ...f, moods: moods.includes(id) ? moods.filter((m) => m !== id) : [...moods, id] });
  };

  return (
    <div className="rounded-2xl border border-border bg-elevated p-4 mb-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Nach Kategorie filtern
        </p>
        {!filterEmpty(f) && (
          <button
            onClick={() => onChange({ style: "", explicit: "", moods: [] })}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {used.moods.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {used.moods.map((m) => (
            <button
              key={m.id}
              onClick={() => toggleMood(m.id)}
              className={chip((f.moods || []).includes(m.id), m.tone)}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {(used.styles.length > 0 || used.explicits.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {used.styles.map((s) => (
            <button
              key={s.id}
              onClick={() => onChange({ ...f, style: f.style === s.id ? "" : s.id })}
              className={chip(f.style === s.id, s.tone)}
            >
              {s.label}
            </button>
          ))}
          {used.explicits.map((e) => (
            <button
              key={e.id}
              onClick={() => onChange({ ...f, explicit: f.explicit === e.id ? "" : e.id })}
              className={chip(f.explicit === e.id, e.tone)}
            >
              {e.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}