import React, { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortModels, kindLabel } from "@/lib/modelSort";
import { styleOption, explicitOption, charakterOption } from "@/lib/modelTags";

// Ein Modell-Picker für überall: Suche, nach Name dann Art sortiert, mit
// Beschreibung und Badges (Stil, Freizügigkeit, Charakter). Damit man sofort
// sieht, wofür ein Modell taugt — und im Chat nur Chat-Modelle zur Wahl stehen.

const badge = (tone) =>
  cn("px-1.5 py-0.5 rounded-full border text-[9px] font-bold", tone || "bg-elevated text-muted-foreground border-border");

export default function ModelPicker({
  models,
  value,
  onChange,
  placeholder = "Modell",
  kind = "TEXT",
  allowEmpty = true,
  emptyLabel = "Standard",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  const sorted = useMemo(() => sortModels(models), [models]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sorted;
    return sorted.filter((m) =>
      `${m.name || ""} ${m.description || ""} ${m.note || ""} ${m.modelId || ""}`.toLowerCase().includes(s)
    );
  }, [sorted, q]);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected = sorted.find((m) => (m.modelId || m.id) === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-elevated border border-border text-[11px] font-bold text-foreground max-w-[9rem]"
        title={selected ? selected.name : placeholder}
      >
        <span className="truncate">{selected ? selected.name : placeholder}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-80 max-w-[78vw] rounded-2xl border border-border bg-popover shadow-xl p-2">
          <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1.5 rounded-full bg-elevated border border-border">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suchen — Name, Beschreibung …"
              autoFocus
              className="flex-1 bg-transparent text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {allowEmpty && (
            <button
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-2.5 py-2 rounded-xl text-[12px] font-bold transition-colors mb-0.5",
                !value ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-elevated"
              )}
            >
              {emptyLabel}
            </button>
          )}

          <div className="max-h-64 overflow-y-auto scrollbar-hide space-y-0.5">
            {filtered.map((m) => {
              const id = m.modelId || m.id;
              const isSel = id === value;
              const st = styleOption(kind, m.style);
              const ex = explicitOption(m.explicit);
              const ch = charakterOption(m.charakter);
              const desc = m.description || m.note;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    onChange(id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-2 rounded-xl transition-colors",
                    isSel ? "bg-primary/15" : "hover:bg-elevated"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-[12px] font-bold truncate", isSel ? "text-primary" : "text-foreground")}>
                      {m.favorite ? "★ " : ""}
                      {m.name}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-muted-foreground flex-shrink-0">
                      {kindLabel(kind || m.kind)}
                    </span>
                    {isSel && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  </div>
                  {desc && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug font-normal">
                      {desc}
                    </p>
                  )}
                  {(st || ex || ch) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {st && <span className={badge(st.tone)}>{st.label}</span>}
                      {ex && <span className={badge(ex.tone)}>{ex.label}</span>}
                      {ch && <span className={badge(ch.tone)}>{ch.label}</span>}
                    </div>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-[11px] text-muted-foreground py-4">Kein Modell gefunden.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}