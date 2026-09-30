import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const STATES = [
  { id: "OFF", label: "Nicht dabei" },
  { id: "PRESENT", label: "Anwesend" },
  { id: "INFORMED", label: "Informiert" },
];

// Wer ist mit in der Sitzung — anwesend und mitspielend oder nur informiert.
// Jeder Klick schaltet weiter: nicht dabei → anwesend → informiert → nicht dabei.
export default function CastPicker({ creators = [], value = [], onChange }) {
  const [query, setQuery] = useState("");

  const stateOf = (id) => value.find((c) => c.id === id)?.mode || "OFF";

  const cycle = (creator) => {
    const current = stateOf(creator.id);
    const next = STATES[(STATES.findIndex((s) => s.id === current) + 1) % STATES.length].id;
    const rest = value.filter((c) => c.id !== creator.id);
    onChange(next === "OFF" ? rest : [...rest, { id: creator.id, name: creator.stageName, avatar: creator.avatar || "", mode: next }]);
  };

  const list = creators.filter((c) => (c.stageName || "").toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Figur suchen …"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {value.filter((c) => c.mode === "PRESENT").length} anwesend · {value.filter((c) => c.mode === "INFORMED").length} informiert
        </span>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {list.map((c) => {
          const state = stateOf(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => cycle(c)}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-2xl border text-left transition-colors",
                state === "PRESENT" ? "border-primary bg-primary/10" : state === "INFORMED" ? "border-primary/40 bg-elevated" : "border-border bg-card hover:border-primary/40"
              )}
            >
              {c.avatar ? (
                <Image src={c.avatar} fittingType="fill" className="w-9 h-9 rounded-full flex-shrink-0" />
              ) : (
                <span className="w-9 h-9 rounded-full bg-elevated flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">{(c.stageName || "?")[0]}</span>
              )}
              <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">{c.stageName}</span>
              <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap", state === "PRESENT" ? "bg-primary text-primary-foreground" : state === "INFORMED" ? "bg-primary/15 text-primary" : "bg-elevated text-muted-foreground")}>
                {STATES.find((s) => s.id === state).label}
              </span>
            </button>
          );
        })}
        {list.length === 0 && <p className="text-xs text-muted-foreground py-3 text-center">Keine Figur gefunden.</p>}
      </div>
    </div>
  );
}