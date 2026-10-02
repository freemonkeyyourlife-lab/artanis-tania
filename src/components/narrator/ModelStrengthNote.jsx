import React from "react";
import { cn } from "@/lib/utils";
import { STRENGTH_TONES } from "@/lib/modelStrengths";

const chip = "inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider";

// Die Vermerkung zu einem Modell: wofür es bekannt ist, in Etiketten — und
// darunter in einem Satz, damit klar ist, was man für was nimmt.
export default function ModelStrengthNote({ chips, hint, className }) {
  return (
    <div className={cn("mt-1", className)}>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {chips.map((c) => (
            <span key={c} className={cn(chip, STRENGTH_TONES[c] || STRENGTH_TONES.Allround)}>
              {c}
            </span>
          ))}
        </div>
      )}
      <span className="block text-[11px] font-semibold opacity-80 leading-snug">{hint}</span>
    </div>
  );
}