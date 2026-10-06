import React from "react";
import { Play, Square, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_SETUPS } from "@/lib/therapyPrompts";

// Jederzeit umschaltbar: wer bin ich hier — und läuft es von selbst weiter?
export default function SessionControls({ roleSetup, onRole, running, onRunning, regie, onRegie, disabled }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Wer bist du?</span>
      {ROLE_SETUPS.map((r) => (
        <button
          key={r.value}
          onClick={() => onRole(r.value)}
          disabled={disabled}
          title={r.hint}
          className={cn(
            "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50",
            roleSetup === r.value ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
          )}
        >
          {r.label}
        </button>
      ))}

      <span className="w-px h-5 bg-border mx-1" />

      <button
        onClick={() => onRunning(!running)}
        disabled={disabled}
        title="Tania macht von selbst weiter — bis du Stopp sagst."
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50",
          running ? "bg-destructive text-destructive-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
        )}
      >
        {running ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        {running ? "Stopp" : "Laufen lassen"}
      </button>

      <button
        onClick={() => onRegie(!regie)}
        disabled={disabled}
        title="Sag, wohin die Sitzung gehen soll — als Anweisung, nicht als eigene Zeile."
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50",
          regie ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
        )}
      >
        <Compass className="w-3 h-3" /> Richtung vorgeben
      </button>
    </div>
  );
}