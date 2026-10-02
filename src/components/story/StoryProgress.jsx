import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Der Weg durch die Story — jede Station ein Punkt, die aktuelle leuchtet.
export default function StoryProgress({ stages = [], currentIndex = 0 }) {
  if (!stages.length) return null;

  return (
    <div className="flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-hide">
      {stages.map((stage, i) => {
        const done = i < currentIndex;
        const now = i === currentIndex;
        return (
          <div key={stage.id || i} className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className={cn(
                "flex items-center justify-center rounded-full text-[11px] font-bold transition-all",
                now
                  ? "w-8 h-8 glass-strong text-primary ring-2 ring-primary"
                  : done
                    ? "w-7 h-7 bg-primary/25 text-primary"
                    : "w-7 h-7 glass-strong text-muted-foreground"
              )}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </span>
            {i < stages.length - 1 && (
              <span className={cn("w-4 h-[2px] rounded-full", i < currentIndex ? "bg-primary/60" : "bg-border")} />
            )}
          </div>
        );
      })}
      <span className="ml-2 text-[11px] font-bold text-muted-foreground whitespace-nowrap">
        Station {currentIndex + 1} von {stages.length}
      </span>
    </div>
  );
}