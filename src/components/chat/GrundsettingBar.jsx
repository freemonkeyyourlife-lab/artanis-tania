import React from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { GRUNDSETTINGS } from "@/lib/grundsetting";

// Die Grundsetting-Leiste — immer dieselbe Auswahl, in jedem Chat und jeder
// Situation, von Anfang an. Devot, dominant, alleine, zu zweit, Gruppe, sanft,
// hemmungslos. Mehrfach wählbar, jederzeit wechselbar. Optional ein
// „Als Vorlage"-Knopf, der das aktuelle Grundsetting sichert.
export default function GrundsettingBar({ value = [], onChange, onStabilize, className }) {
  const vals = value || [];
  const toggle = (k) => {
    const next = vals.includes(k) ? vals.filter((x) => x !== k) : [...vals, k];
    onChange?.(next);
  };

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Grundsetting</span>
      {GRUNDSETTINGS.map((g) => {
        const on = vals.includes(g.key);
        return (
          <button
            key={g.key}
            type="button"
            onClick={() => toggle(g.key)}
            title={g.text}
            className={cn(
              "px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
              on ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
            )}
          >
            {g.label}
          </button>
        );
      })}
      {onStabilize && (
        <button
          type="button"
          onClick={onStabilize}
          title="Dieses Grundsetting als Vorlage sichern"
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-elevated text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5" /> Als Vorlage
        </button>
      )}
    </div>
  );
}