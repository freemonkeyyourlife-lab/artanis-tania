import React, { useEffect, useState } from "react";
import { Pencil, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import EditTile from "./EditTile";

// Wiederverwendbare Canvas-Leinwand für jede Seite: zeigt Kacheln als
// normales Raster und schaltet im Bearbeitungsmodus auf eine frei
// anordbare Leinwand um — drag, resize, löschen. Das Layout gilt pro
// Seite (storageKey) und liegt auf diesem Gerät im localStorage.

export default function CanvasGrid({
  storageKey,
  items,
  renderTile,
  emptyText = "Nichts hier.",
  title,
  cols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  tileClassName = "aspect-[3/4]",
  height = 640,
}) {
  const LS_L = `${storageKey}-layout-v1`;
  const LS_H = `${storageKey}-hidden-v1`;
  const [edit, setEdit] = useState(false);
  const [layout, setLayout] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_L) || "{}"); } catch { return {}; }
  });
  const [hidden, setHidden] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(LS_H) || "[]")); } catch { return new Set(); }
  });

  useEffect(() => { localStorage.setItem(LS_L, JSON.stringify(layout)); }, [layout, LS_L]);
  useEffect(() => { localStorage.setItem(LS_H, JSON.stringify([...hidden])); }, [hidden, LS_H]);

  const visible = items.filter((it) => !hidden.has(it.key));
  const posOf = (key, i) => layout[key] || { x: 16 + (i % 4) * 230, y: 16 + Math.floor(i / 4) * 180, w: 210, h: 200 };
  const setPos = (key, p) => setLayout((l) => ({ ...l, [key]: p }));
  const remove = (key) => setHidden((s) => new Set([...s, key]));
  const restoreAll = () => { setHidden(new Set()); setLayout({}); };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        {title ? <h3 className="font-display text-xl text-foreground">{title}</h3> : <span />}
        <div className="flex items-center gap-2">
          {edit && (
            <button onClick={restoreAll} className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Zurücksetzen
            </button>
          )}
          <button
            onClick={() => setEdit((v) => !v)}
            className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold", edit ? "bg-primary text-primary-foreground" : "glass-btn glass-btn-accent")}
          >
            <Pencil className="w-3.5 h-3.5" /> {edit ? "Bearbeitung an" : "Bearbeitungsmodus"}
          </button>
        </div>
      </div>

      {edit ? (
        <div className="relative rounded-xl border border-dashed border-border bg-background" style={{ minHeight: height }}>
          {visible.map((it, i) => (
            <EditTile key={it.key} pos={posOf(it.key, i)} edit onChange={(np) => setPos(it.key, np)} onRemove={() => remove(it.key)}>
              {renderTile(it)}
            </EditTile>
          ))}
          {visible.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{emptyText}</p>}
        </div>
      ) : (
        <div className={cn("grid gap-3", cols)}>
          {visible.map((it) => (
            <div key={it.key} className={cn("rounded-2xl border border-border bg-elevated overflow-hidden", tileClassName)}>
              {renderTile(it)}
            </div>
          ))}
          {visible.length === 0 && <p className="col-span-full p-6 text-center text-sm text-muted-foreground">{emptyText}</p>}
        </div>
      )}

      {edit && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Ziehe Kacheln an ihre Position, Ecke unten rechts für die Größe, × zum Löschen. Das Layout gilt nur für diese Seite und ist auf diesem Gerät gespeichert.
        </p>
      )}
    </div>
  );
}