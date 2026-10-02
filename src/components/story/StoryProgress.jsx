import React from "react";
import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Der Weg durch die Story — auf einen Blick: wie weit, wo, was noch kommt.
export default function StoryProgress({ stages = [], currentIndex = 0 }) {
  if (!stages.length) return null;
  const pct = Math.round(((currentIndex + 1) / stages.length) * 100);

  return (
    <div className="w-full rounded-3xl glass-strong border-2 border-border p-4">
      <div className="flex items-end justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Dein Weg</p>
        <p className="font-display text-2xl text-foreground leading-none">
          {pct}
          <span className="text-[14px] text-muted-foreground"> %</span>
        </p>
      </div>

      <div className="h-2.5 rounded-full bg-background/70 overflow-hidden mb-2">
        <div className="h-full rounded-full bg-primary accent-glow transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <p className="text-[12px] font-bold text-muted-foreground mb-3">
        Station {currentIndex + 1} von {stages.length}
        {stages[currentIndex]?.title ? ` · ${stages[currentIndex].title}` : ""}
      </p>

      <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-hide">
        {stages.map((stage, i) => {
          const done = i < currentIndex;
          const now = i === currentIndex;
          return (
            <div key={stage.id || i} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
                  now
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
                    : done
                      ? "bg-primary/25 text-primary"
                      : "bg-background/70 text-muted-foreground"
                )}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[13px] truncate",
                  now ? "font-bold text-foreground" : "font-semibold text-muted-foreground"
                )}
              >
                {stage.title || `Station ${i + 1}`}
              </span>
              {now && <MapPin className="w-3.5 h-3.5 text-primary ml-auto flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}