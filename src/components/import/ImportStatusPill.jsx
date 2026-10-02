import React, { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getImportState, subscribeImport, stopImport } from "@/lib/importRunner";

// Zeigt den laufenden Import in der Ecke — er läuft weiter, egal wo du bist.
export default function ImportStatusPill() {
  const [state, setState] = useState(getImportState());

  useEffect(() => subscribeImport(setState), []);

  if (!state.running) return null;

  const pct = state.total ? Math.round((state.done / state.total) * 100) : 0;

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-[60] w-[300px] glass-strong rounded-2xl border-2 border-border p-4">
      <div className="flex items-start gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-primary mt-0.5 flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-foreground">{state.title}</p>
          <p className="text-[12px] font-semibold text-muted-foreground">
            {state.done} / {state.total} — läuft im Hintergrund weiter
          </p>
          {state.current && (
            <p className="text-[11px] font-semibold text-muted-foreground truncate mt-0.5">{state.current}</p>
          )}
          <div className="h-1.5 rounded-full bg-elevated mt-2 overflow-hidden">
            <span className="block h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          onClick={stopImport}
          title="Anhalten"
          className="w-7 h-7 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-destructive flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}