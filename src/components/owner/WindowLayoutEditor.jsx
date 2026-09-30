import React, { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw, PanelLeft, PanelRight, Minus, Plus } from "lucide-react";
import {
  WINDOW_DEFS, MIN_TEXT, MAX_TEXT, loadWindows, subscribeWindows,
  moveWindow, openWindow, closeWindow, setDock, setTextSize, resetWindows,
} from "@/lib/callWindows";
import { cn } from "@/lib/utils";

// Persönliche Fenster-Anordnung im Videocall. Gilt nur für dich, wirkt sofort
// und ist jederzeit zurücksetzbar — getrennt von der globalen Modul-Konfiguration.
export default function WindowLayoutEditor() {
  const [cfg, setCfg] = useState(() => loadWindows());
  useEffect(() => subscribeWindows(() => setCfg(loadWindows())), []);

  const rows = cfg.order.map((id) => ({ id, ...WINDOW_DEFS.find((w) => w.id === id) }));
  const btn = "w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0 disabled:opacity-40";

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">Deine Fenster im Videocall</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4">
        Das betrifft nur deine eigene Ansicht und wirkt sofort — nichts davon sehen andere, und Ausblenden löscht keine Unterhaltung.
      </p>

      <div className="space-y-2 mb-4">
        {rows.map((row, index) => {
          const open = cfg.open.includes(row.id);
          return (
            <div key={row.id} className={cn("rounded-xl border border-border bg-card p-2 flex flex-wrap items-center gap-2", !open && "opacity-60")}>
              <span className="w-6 text-center text-sm font-bold text-muted-foreground">{index + 1}</span>
              <div className="flex-1 min-w-[120px]">
                <p className="text-sm font-bold text-foreground">{row.title}</p>
                <p className="text-[11px] text-muted-foreground">{row.hint}</p>
              </div>
              <button onClick={() => moveWindow(row.id, "up")} disabled={index === 0} className={btn} title="Nach oben">
                <ChevronUp className="w-4 h-4" />
              </button>
              <button onClick={() => moveWindow(row.id, "down")} disabled={index === rows.length - 1} className={btn} title="Nach unten">
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => (open ? closeWindow(row.id) : openWindow(row.id))}
                className={cn("h-9 px-3 rounded-full glass-btn text-xs font-bold flex items-center gap-1.5", open ? "text-emerald-400" : "text-destructive")}
              >
                {open ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {open ? "Offen" : "Ausgeblendet"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Andocken</span>
        <button onClick={() => setDock("left")} className={cn("inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold", cfg.dock === "left" ? "glass-btn glass-btn-accent" : "glass-btn text-muted-foreground")}>
          <PanelLeft className="w-4 h-4" /> Links
        </button>
        <button onClick={() => setDock("right")} className={cn("inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold", cfg.dock === "right" ? "glass-btn glass-btn-accent" : "glass-btn text-muted-foreground")}>
          <PanelRight className="w-4 h-4" /> Rechts
        </button>
        <span className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground ml-2">Schrift</span>
        <button onClick={() => setTextSize(cfg.textSize - 1)} disabled={cfg.textSize <= MIN_TEXT} className={btn} title="Kleiner">
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold text-foreground w-6 text-center">{cfg.textSize}</span>
        <button onClick={() => setTextSize(cfg.textSize + 1)} disabled={cfg.textSize >= MAX_TEXT} className={btn} title="Größer">
          <Plus className="w-4 h-4" />
        </button>
        <button onClick={resetWindows} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-sm font-bold ml-auto">
          <RotateCcw className="w-4 h-4" /> Anordnung zurücksetzen
        </button>
      </div>
    </div>
  );
}