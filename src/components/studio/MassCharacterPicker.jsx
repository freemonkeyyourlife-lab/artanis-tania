import React from "react";
import { cn } from "@/lib/utils";
import { CheckSquare, Square } from "lucide-react";

// Wer kommt in die Erzeugung? Name suchen, anhaken — die Auswahl zählt oben mit.
export default function MassCharacterPicker({ creators, picked, query, onQuery, onToggle, onAll }) {
  const visible = creators.filter((c) => {
    const q = query.trim().toLowerCase();
    return !q || (c.stageName || "").toLowerCase().includes(q);
  });
  const allOn = visible.length > 0 && visible.every((c) => picked.includes(c.id));

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-[15px] font-bold text-foreground">Wer?</p>
          <p className="text-[12px] font-semibold text-muted-foreground">{picked.length} Charaktere gewählt</p>
        </div>
        <button
          type="button"
          onClick={() => onAll(allOn ? [] : visible.map((c) => c.id))}
          disabled={!visible.length}
          className="px-3 py-1.5 rounded-full glass-btn text-[12px] font-bold text-foreground disabled:opacity-50 whitespace-nowrap"
        >
          {allOn ? "Auswahl leeren" : "Alle sichtbaren"}
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Charakter suchen…"
        className="w-full h-10 px-4 rounded-full bg-background border border-border text-[14px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-3"
      />

      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {visible.map((c) => {
          const on = picked.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-colors",
                on ? "border-primary/40 bg-primary/10" : "border-border bg-background hover:border-primary/30"
              )}
            >
              {on ? (
                <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-[14px] font-bold text-foreground truncate">{c.stageName}</span>
              {!c.avatar && <span className="ml-auto text-[11px] font-bold text-muted-foreground">ohne Bild</span>}
            </button>
          );
        })}
        {!visible.length && (
          <p className="text-[13px] font-semibold text-muted-foreground text-center py-8">Kein Charakter gefunden.</p>
        )}
      </div>
    </div>
  );
}