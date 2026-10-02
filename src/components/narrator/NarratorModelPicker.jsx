import React, { useMemo, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputCls, labelCls } from "@/lib/narratorUi";

// Alles, was im Studio an Bildmodellen freigeschaltet ist — Favoriten oben.
// Mehrere dürfen gleichzeitig ran, dann laufen sie parallel.
export default function NarratorModelPicker({ models, loading, selected, onToggle, onClear }) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return models;
    return models.filter((m) => `${m.name || ""} ${m.modelId || ""}`.toLowerCase().includes(term));
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
          <span className="block text-[11px] font-semibold opacity-80">baut aus dem Vorlagebild um</span>
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
              <span className="min-w-0">
                <span className="block truncate">
                  {m.favorite ? "★ " : ""}
                  {m.name}
                </span>
                {m.modelId && <span className="block text-[11px] font-semibold opacity-70 truncate">{m.modelId}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}