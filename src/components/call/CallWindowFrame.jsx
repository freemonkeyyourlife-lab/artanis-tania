import React, { useState } from "react";
import { X, Minus, Square, ChevronUp, ChevronDown, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { moveWindow, toggleMinimize, closeWindow, setDock, loadWindows } from "@/lib/callWindows";

// Ein einzelnes Fenster im Call: Titelzeile mit Bedienung, darunter der Inhalt.
// Alles ist mit Maus, Finger und Tastatur erreichbar — die Titelzeile ist eine
// Knopfleiste, keine Zieh-Fläche, die man treffen muss.
export default function CallWindowFrame({ id, title, hint, children, wide }) {
  const cfg = loadWindows();
  const minimized = cfg.minimized.includes(id);

  const btn = "w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground bg-elevated flex-shrink-0";

  return (
    <section className={cn("flex flex-col min-h-0 rounded-2xl border border-border bg-card overflow-hidden", minimized ? "flex-none" : "flex-1 min-h-[340px]")}>
      <header className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-elevated/60 flex-shrink-0">
        <span className="text-[12px] font-bold text-foreground truncate">{title}</span>
        {hint && <span className="text-[10px] text-muted-foreground truncate hidden xl:inline">{hint}</span>}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => moveWindow(id, "up")} className={btn} title="Weiter nach oben">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => moveWindow(id, "down")} className={btn} title="Weiter nach unten">
            <ChevronDown className="w-4 h-4" />
          </button>
          {wide && (
            <button type="button" onClick={() => setDock(cfg.dock === "left" ? "right" : "left")} className={btn} title={cfg.dock === "left" ? "Fenster nach rechts holen" : "Fenster nach links holen"}>
              <PanelRight className={cn("w-4 h-4", cfg.dock === "left" && "rotate-180")} />
            </button>
          )}
          <button type="button" onClick={() => toggleMinimize(id)} className={btn} title={minimized ? "Fenster aufklappen" : "Fenster zuklappen"}>
            {minimized ? <Square className="w-3.5 h-3.5" /> : <Minus className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => closeWindow(id)} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive bg-elevated flex-shrink-0" title="Fenster schließen — die Unterhaltung bleibt erhalten">
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>
      {!minimized && <div className="flex-1 min-h-0 flex flex-col overflow-hidden">{children}</div>}
    </section>
  );
}