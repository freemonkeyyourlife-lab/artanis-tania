import React, { useState } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HELP } from "@/lib/helpTexts";

// Kleiner „i“-Knopf: zeigt die feste Erklärung zu genau dieser Stelle.
export default function HelpButton({ topic, label = "Erklärung", className }) {
  const [open, setOpen] = useState(false);
  const help = HELP[topic];
  if (!help) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors whitespace-nowrap", className)}
      >
        <Info className="w-3.5 h-3.5" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative glass-strong rounded-3xl border-2 border-border p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <span className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-primary" />
              </span>
              <p className="flex-1 font-display text-lg text-foreground pt-1">{help.title}</p>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full glass-btn flex items-center justify-center text-muted-foreground flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="space-y-2">
              {help.steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] font-semibold text-foreground/90 leading-relaxed">
                  <span className="w-6 h-6 rounded-full bg-elevated border border-border text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </>
  );
}