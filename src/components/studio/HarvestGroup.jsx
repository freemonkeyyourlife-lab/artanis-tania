import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Eine Schublade voller Fundstücke: auf- und zuklappen, einzeln oder alle wählen.
export default function HarvestGroup({ label, note, items, selected, onToggle, onAll }) {
  const [open, setOpen] = useState(true);
  const [showAll, setShowAll] = useState(false);

  if (!items.length) return null;

  const chosen = items.filter((i) => selected.has(i.url)).length;
  const shown = showAll ? items : items.slice(0, 40);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-[15px] font-bold text-foreground"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", !open && "-rotate-90")} />
          {label}
        </button>
        <span className="text-[12px] font-bold text-muted-foreground">
          {items.length} gefunden · {chosen} gewählt{note ? ` · ${note}` : ""}
        </span>
        <span className="flex-1" />
        <button
          onClick={() => onAll(items, true)}
          className="px-3.5 py-1.5 rounded-full glass-btn text-[12px] font-bold text-muted-foreground"
        >
          Alle
        </button>
        <button
          onClick={() => onAll(items, false)}
          className="px-3.5 py-1.5 rounded-full glass-btn text-[12px] font-bold text-muted-foreground"
        >
          Keine
        </button>
      </div>

      {open && (
        <div className="space-y-1.5">
          {shown.map((i) => (
            <label
              key={i.url}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-elevated border border-border cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(i.url)}
                onChange={() => onToggle(i.url)}
                className="w-4 h-4 accent-primary flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-foreground truncate">{i.label}</p>
                <p className="text-[11px] font-semibold text-muted-foreground truncate">{i.url}</p>
              </div>
            </label>
          ))}
          {!showAll && items.length > shown.length && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2.5 rounded-xl bg-elevated border border-border text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Weitere {items.length - shown.length} anzeigen
            </button>
          )}
        </div>
      )}
    </div>
  );
}