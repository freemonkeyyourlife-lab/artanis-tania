import React, { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { getImportState, subscribeImport, stopImport } from "@/lib/importRunner";

// Der Fortschrittsbalken im Studio: derselbe Lauf, der auch in der Ecke weiterläuft.
export default function ImportProgressBar() {
  const [state, setState] = useState(getImportState());

  useEffect(() => subscribeImport(setState), []);

  if (!state.running) return null;

  const pct = state.total ? Math.round((state.done / state.total) * 100) : 0;

  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-card p-4 mb-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="inline-flex items-center gap-2 text-[15px] font-bold text-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" /> {state.title}
        </p>
        <span className="text-[13px] font-bold text-muted-foreground">
          {state.done} / {state.total} · {pct} %
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-elevated border border-border overflow-hidden">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
        <p className="text-[12px] font-semibold text-muted-foreground truncate">
          {state.note ? `${state.note} · ` : ""}
          {state.current || "…"}
        </p>
        <button
          onClick={stopImport}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-elevated border border-border text-[12px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Anhalten
        </button>
      </div>
    </div>
  );
}