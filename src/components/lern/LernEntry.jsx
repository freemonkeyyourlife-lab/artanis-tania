import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Eine Frage mit ihrer Antwort. Zugeklappt sieht man nur die Fragen — so findet
// man die richtige schnell und öffnet erst dann.
export default function LernEntry({ frage, antwort, punkte }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl bg-background border border-border overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-elevated/50 transition-colors"
      >
        <ChevronDown
          className={cn("w-4 h-4 text-primary flex-shrink-0 mt-1 transition-transform", open && "rotate-180")}
        />
        <span className="text-[15px] font-bold text-foreground leading-snug">{frage}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pl-11">
          <p className="text-[14px] font-semibold text-foreground/90 leading-relaxed">{antwort}</p>
          {punkte?.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {punkte.map((p, i) => (
                <li key={i} className="flex gap-2 text-[13px] font-semibold text-muted-foreground leading-relaxed">
                  <span className="text-primary font-bold flex-shrink-0">·</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}