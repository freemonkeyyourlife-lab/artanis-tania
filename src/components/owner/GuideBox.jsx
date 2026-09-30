import React from "react";
import { Lightbulb } from "lucide-react";

// Damit hier nichts unklar bleibt: jeder Bereich erklärt sich selbst.
export default function GuideBox({ title = "Was du hier machst", steps = [], children }) {
  return (
    <div className="glass rounded-2xl border border-border p-5 mb-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-lg text-foreground">{title}</p>
          {children && <p className="text-[15px] font-semibold text-muted-foreground mt-1 leading-relaxed">{children}</p>}
          {steps.length > 0 && (
            <ol className="mt-3 space-y-1.5">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[15px] font-semibold text-foreground/90 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-elevated border border-border text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}