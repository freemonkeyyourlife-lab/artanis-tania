import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Eine Auswahl in der Begrüßung: antippen, weiter. Mehrere Antworten gehen auch.
export default function IntroChoiceStep({ eyebrow, title, hint, options = [], value, onToggle, multi = false }) {
  const isOn = (o) => (multi ? value.includes(o) : value === o);

  return (
    <div>
      {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">{eyebrow}</p>}
      <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-3">{title}</h2>
      {hint && <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-xl">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = isOn(o);
          return (
            <button
              key={o}
              onClick={() => onToggle(o)}
              className={cn(
                "inline-flex items-center gap-1.5 px-5 py-3 rounded-full text-[15px] font-bold transition-colors border-2",
                on ? "glass-btn glass-btn-accent border-transparent text-gloss" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {on && <Check className="w-4 h-4" />}
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}