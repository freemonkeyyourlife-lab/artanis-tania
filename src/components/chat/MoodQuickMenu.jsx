import React from "react";
import { Flame, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MOODS } from "@/lib/moodStyle";

// Schnellregler für die Stimmung: Schlagworte antippen, die Figuren reden sofort anders.
export default function MoodQuickMenu({ value = [], onChange }) {
  const toggle = (id) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          title="Stimmung der Szene — wie die Figuren jetzt reden"
          className={cn(
            "h-8 px-2.5 rounded-full flex items-center gap-1.5 flex-shrink-0 transition-colors",
            value.length
              ? "bg-primary/15 border border-primary/40 text-primary hover:bg-primary/25"
              : "bg-elevated text-muted-foreground hover:text-foreground"
          )}
        >
          <Flame className="w-4 h-4" />
          <span className="text-[11px] font-bold">Stimmung</span>
          {value.length > 0 && <span className="text-[10px] font-bold">{value.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[20rem] p-0">
        <div className="p-3 border-b border-border">
          <p className="text-sm font-bold text-foreground">Stimmung</p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Tippe an, wie es sich gerade anfühlen soll — die Figuren reden sofort in dieser Tonlage. Mehrere möglich.
          </p>
        </div>
        <div className="p-2 flex flex-wrap gap-1.5">
          {MOODS.map((m) => {
            const on = value.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                title={m.prompt}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  on ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {on && <Check className="w-3 h-3 inline mr-1" />}{m.label}
              </button>
            );
          })}
        </div>
        {value.length > 0 && (
          <div className="p-2 border-t border-border">
            <button
              onClick={() => onChange([])}
              className="w-full py-1.5 rounded-full bg-elevated text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Stimmung zurücksetzen
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}