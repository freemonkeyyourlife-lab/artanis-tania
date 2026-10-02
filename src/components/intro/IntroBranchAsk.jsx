import React from "react";
import { Armchair, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTRO_BRANCH, BRANCH_OPTIONS, BRANCH_QUESTION } from "@/lib/introStory";

const ICON = { [INTRO_BRANCH.CORNER]: Armchair, [INTRO_BRANCH.TOUR]: Footprints };

// Die Weiche: sie geht ins Eck und schaut zu — oder sie führt ihn durch.
export default function IntroBranchAsk({ onPick }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Wie soll es weitergehen?</p>
      <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-5">{BRANCH_QUESTION}</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {BRANCH_OPTIONS.map(({ id, label, hint }) => {
          const Icon = ICON[id] || Armchair;
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              className={cn(
                "text-left rounded-2xl border-2 border-border p-4 transition-colors hover:border-primary/50"
              )}
            >
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="font-display text-[16px] text-foreground">{label}</p>
              <p className="text-[13px] font-semibold text-muted-foreground mt-1">{hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}