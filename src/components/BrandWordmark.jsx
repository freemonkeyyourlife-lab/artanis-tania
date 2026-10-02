import React from "react";
import { cn } from "@/lib/utils";

// Unser Schriftzug — bis auf zwei Buchstaben unverändert: das erste A steht
// groß und maskulin (Serife, schwere Schrift), das erste T läuft kursiv.
export default function BrandWordmark({ className }) {
  return (
    <span className={cn("font-display font-extrabold tracking-wide text-gloss leading-none inline-block", className)}>
      <span className="font-serif font-black text-[1.45em] leading-none align-baseline">A</span>
      RTANIS <span className="text-primary">×</span>{" "}
      <span className="font-serif italic font-black text-[1.3em] leading-none align-baseline">T</span>
      RIANIA
    </span>
  );
}