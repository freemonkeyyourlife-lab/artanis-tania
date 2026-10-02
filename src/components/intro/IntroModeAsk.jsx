import React from "react";
import { Volume2, MessageSquare, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTRO_MODES, MODE_QUESTION } from "@/lib/introStory";

const ICON = { AUDIO: Volume2, TEXT: MessageSquare, BOTH: Layers };

// Die Modus-Frage. Sie bleibt als Fenster stehen, bis geantwortet ist —
// sonst bekommt niemand mit, dass hier jemand redet.
export default function IntroModeAsk({ value, onPick, narratorName }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Wichtig für dein Erleben</p>
      <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-3">Wie willst du das erleben?</h2>

      <div className="rounded-2xl border-2 border-primary/50 bg-card p-4 mb-5 accent-glow">
        <p className="text-[15px] font-semibold text-foreground leading-relaxed">
          {narratorName ? `${narratorName}: ` : ""}„{MODE_QUESTION}"
        </p>
        <p className="text-[12px] font-bold text-muted-foreground mt-2">
          Das Fenster bleibt stehen, bis du dich entschieden hast.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {INTRO_MODES.map((m) => {
          const Icon = ICON[m.id];
          const on = value === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onPick(m.id)}
              className={cn(
                "text-left rounded-2xl border-2 p-4 transition-colors",
                on ? "glass-btn glass-btn-accent border-transparent text-gloss" : "border-border hover:border-primary/50"
              )}
            >
              <Icon className={cn("w-5 h-5 mb-2", on ? "text-primary-foreground" : "text-primary")} />
              <p className={cn("font-display text-[16px]", on ? "text-primary-foreground" : "text-foreground")}>{m.label}</p>
              <p className={cn("text-[13px] font-semibold mt-1", on ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {m.hint}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}