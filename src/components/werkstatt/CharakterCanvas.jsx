import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Pencil, GripVertical, X, RotateCcw, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Bearbeitungsmodus-Leinwand: zeigt Charakter-Kacheln und Aktions-Buttons.
// Im Edit-Modus lassen sie sich frei verschieben, in der Größe anpassen,
// löschen und neu hinzufügen — das Layout liegt im localStorage (pro Gerät).

const LS_KEY = "werkstatt-layout-v1";
const CANVAS_H = 640;

const loadLayout = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
};
const saveLayout = (l) => localStorage.setItem(LS_KEY, JSON.stringify(l));

const signUri = async (u) => {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: u });
    return r?.signed_url || null;
  } catch { return null; }
};

// Tile, die im Edit-Modus drag/resize/delete kann.
function Tile({ tile, pos, edit, onChange, onRemove, children }) {
  const ref = useRef(null);
  const drag = useRef(null);

  const onPointerDown = (e) => {
    if (!edit) return;
    if (e.target.dataset?.handle) return;
    e.preventDefault();
    ref.current.setPointerCapture(e.pointerId);
    drag.current = { mode: "move", px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  };
  const onResizeDown = (e) => {
    if (!edit) return;
    e.preventDefault();
    e.stopPropagation();
    ref.current.setPointerCapture(e.pointerId);
    drag.current = { mode: "resize", px: e.clientX, py: e.clientY, w: pos.w, h: pos.h };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.px;
    const dy = e.clientY - drag.current.py;
    if (drag.current.mode === "move") {
      onChange({ ...pos, x: Math.max(0, drag.current.x + dx), y: Math.max(0, drag.current.y + dy) });
    } else {
      onChange({ ...pos, w: Math.max(160, drag.current.w + dx), h: Math.max(120, drag.current.h + dy) });
    }
  };
  const onPointerUp = () => { drag.current = null; };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={edit ? { left: pos.x, top: pos.y, width: pos.w, height: pos.h } : undefined}
      className={cn(
        "rounded-2xl border border-border bg-card overflow-hidden flex flex-col",
        edit ? "absolute cursor-move select-none ring-2 ring-primary/40" : "w-full"
      )}
    >
      {edit && (
        <div className="flex items-center justify-between bg-primary/10 px-2 py-1">
          <span className="flex items-center gap-1 text-[10px] font-bold text-primary"><GripVertical className="w-3 h-3" /> ziehen</span>
          <button onClick={onRemove} className="rounded-full bg-black/40 p-1 text-white hover:bg-destructive"><X className="w-3 h-3" /></button>
        </div>
      )}
      <div className="relative flex-1 overflow-hidden">{children}</div>
      {edit && (
        <div data-handle="1" onPointerDown={onResizeDown} className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-bl bg-primary/70" title="Größe ändern" />
      )}
    </div>
  );
}

export default function CharakterCanvas({ characters, actions, onOpenCharacter, onAddAction }) {
  const [edit, setEdit] = useState(false);
  const [layout, setLayout] = useState(loadLayout);
  const [hidden, setHidden] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("werkstatt-hidden-v1") || "[]")); } catch { return new Set(); }
  });
  const [avatars, setAvatars] = useState({});
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => { saveLayout(layout); }, [layout]);
  useEffect(() => { localStorage.setItem("werkstatt-hidden-v1", JSON.stringify([...hidden])); }, [hidden]);

  // Avatare signieren (private Uploads).
  useEffect(() => {
    (async () => {
      const map = {};
      for (const c of characters) {
        const a = c.avatar || c.images?.[0];
        if (a && !avatars[a]) map[a] = await signUri(a);
      }
      if (Object.keys(map).length) setAvatars((m) => ({ ...m, ...map }));
    })();
  }, [characters]);

  const allTiles = [
    ...characters.map((c) => ({ key: `char-${c.id}`, kind: "char", data: c })),
    ...actions.map((a) => ({ key: `act-${a.key}`, kind: "act", data: a })),
  ];

  const visibleTiles = allTiles.filter((t) => !hidden.has(t.key));

  const posOf = (key, i) => layout[key] || { x: 16 + (i % 4) * 230, y: 16 + Math.floor(i / 4) * 180, w: 210, h: 200 };
  const setPos = (key, p) => setLayout((l) => ({ ...l, [key]: p }));
  const remove = (key) => setHidden((s) => new Set([...s, key]));
  const restoreAll = () => { setHidden(new Set()); setLayout({}); };

  const addAction = (a) => { onAddAction?.(a); setShowAddMenu(false); };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-display text-xl text-foreground">Meine Werkstatt</h3>
        <div className="flex items-center gap-2">
          {edit && (
            <>
              <button onClick={() => setShowAddMenu((v) => !v)} className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"><Plus className="w-3.5 h-3.5" /> Element</button>
              <button onClick={restoreAll} className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"><RotateCcw className="w-3.5 h-3.5" /> Zurücksetzen</button>
            </>
          )}
          <button onClick={() => setEdit((v) => !v)} className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold", edit ? "bg-primary text-primary-foreground" : "glass-btn glass-btn-accent")}>
            <Pencil className="w-3.5 h-3.5" /> {edit ? "Bearbeitung an" : "Bearbeitungsmodus"}
          </button>
        </div>
      </div>

      {showAddMenu && edit && (
        <div className="mb-3 flex flex-wrap gap-2 rounded-xl bg-elevated p-2">
          {actions.filter((a) => hidden.has(`act-${a.key}`)).map((a) => (
            <button key={a.key} onClick={() => { setHidden((s) => { const n = new Set(s); n.delete(`act-${a.key}`); return n; }); }} className="glass-btn rounded-full px-3 py-1.5 text-xs">+ {a.label}</button>
          ))}
          {actions.filter((a) => !hidden.has(`act-${a.key}`)).length === actions.length && hidden.size === 0 && (
            <span className="px-2 text-xs text-muted-foreground">Alle Elemente sichtbar — lösche welche im Edit-Modus.</span>
          )}
        </div>
      )}

      {edit ? (
        <div className="relative rounded-xl border border-dashed border-border bg-background" style={{ minHeight: CANVAS_H }}>
          {visibleTiles.map((t, i) => {
            const p = posOf(t.key, i);
            return (
              <Tile key={t.key} tile={t} pos={p} edit={edit} onChange={(np) => setPos(t.key, np)} onRemove={() => remove(t.key)}>
                {t.kind === "char" ? (
                  <button onClick={() => onOpenCharacter?.(t.data.id)} className="h-full w-full text-left p-2">
                    <div className="h-2/3 w-full overflow-hidden rounded-lg bg-elevated">
                      {avatars[t.data.avatar || t.data.images?.[0]] && <Image src={avatars[t.data.avatar || t.data.images?.[0]]} fittingType="fill" className="h-full w-full" />}
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-foreground">{t.data.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.data.adultAge} · {t.data.voice || "—"}</p>
                  </button>
                ) : (
                  <Link to={t.data.to} className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
                    <t.data.icon className="w-6 h-6 text-primary" />
                    <span className="text-xs font-bold text-foreground">{t.data.label}</span>
                  </Link>
                )}
              </Tile>
            );
          })}
          {visibleTiles.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Leer — lege Charaktere an oder füge Elemente hinzu.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {visibleTiles.map((t) => (
            <div key={t.key} className="rounded-2xl border border-border bg-elevated overflow-hidden">
              {t.kind === "char" ? (
                <button onClick={() => onOpenCharacter?.(t.data.id)} className="block w-full text-left">
                  <div className="h-32 w-full overflow-hidden bg-background">
                    {avatars[t.data.avatar || t.data.images?.[0]] && <Image src={avatars[t.data.avatar || t.data.images?.[0]]} fittingType="fill" className="h-full w-full" />}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-sm font-bold text-foreground">{t.data.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.data.adultAge} · {t.data.voice || "—"}</p>
                  </div>
                </button>
              ) : (
                <Link to={t.data.to} className="flex h-36 flex-col items-center justify-center gap-1 text-center">
                  <t.data.icon className="w-6 h-6 text-primary" />
                  <span className="text-xs font-bold text-foreground">{t.data.label}</span>
                </Link>
              )}
            </div>
          ))}
          {visibleTiles.length === 0 && <p className="col-span-full p-6 text-center text-sm text-muted-foreground">Noch nichts hier — lege über die Fabrik einen Charakter an.</p>}
        </div>
      )}

      {edit && <p className="mt-2 text-[11px] text-muted-foreground">Ziehe Kacheln an ihre Position, ziehe die Ecke unten rechts für die Größe, × zum Löschen. Layout wird auf diesem Gerät gespeichert.</p>}
    </div>
  );
}