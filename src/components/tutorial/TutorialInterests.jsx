import React from "react";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { TUTORIAL_INTERESTS } from "@/lib/tutorial";

// Womit soll die Führung sich beschäftigen? Was du nicht ankreuzt, wird
// übersprungen — und du kannst es jederzeit nachholen.
export default function TutorialInterests({ interests, showAll, onToggle, onShowAll, onStart }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Erst kurz zu dir</p>
      <h2 className="font-display text-2xl lg:text-3xl text-foreground text-gloss mb-2">
        Was interessiert dich?
      </h2>
      <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-xl">
        Such dir aus, was dich wirklich reizt — gern mehrere. Alles andere überspringen wir.
        Du kannst es jederzeit ändern.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {TUTORIAL_INTERESTS.map((item) => {
          const on = interests.includes(item);
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-bold transition-colors border-2",
                on ? "glass-btn glass-btn-accent border-transparent text-gloss" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {on && <Check className="w-3.5 h-3.5" />}
              {item}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
        >
          <Sparkles className="w-4 h-4" /> Los geht's
        </button>
        <button
          onClick={onShowAll}
          className={cn(
            "px-5 py-3 rounded-full text-[14px] font-bold transition-colors border-2",
            showAll ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {showAll ? "Alles wird gezeigt" : "Lieber alles zeigen"}
        </button>
      </div>
    </div>
  );
}