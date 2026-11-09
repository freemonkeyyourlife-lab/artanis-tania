import React, { useState } from "react";
import { Type } from "lucide-react";
import { FONTS, getStoredFont, setStoredFont } from "@/lib/appFont";
import { cn } from "@/lib/utils";

// Schriftart-Auswahl für die ganze App. Wirkt sofort auf Überschriften,
// Fließtext und Display — bleibt auf diesem Gerät gespeichert.

export default function FontPicker() {
  const [current, setCurrent] = useState(getStoredFont());

  return (
    <div className="rounded-2xl border border-border bg-card p-6 mb-6">
      <h2 className="font-display text-xl text-foreground mb-1 flex items-center gap-2">
        <Type className="w-5 h-5 text-primary" /> Schriftart
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Wähle die Schrift für die ganze App. Wirkt sofort und bleibt auf diesem Gerät gespeichert.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {FONTS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setStoredFont(f.value); setCurrent(f.value); }}
            style={{ fontFamily: `"${f.value}", "Montserrat", sans-serif` }}
            className={cn(
              "rounded-xl border p-3 text-left transition",
              current === f.value ? "border-primary bg-primary/10" : "border-border bg-elevated hover:border-primary/40"
            )}
          >
            <span className="block text-base font-bold text-foreground">Aa {f.label}</span>
            <span className="block text-xs text-muted-foreground">{f.sample}</span>
          </button>
        ))}
      </div>
    </div>
  );
}