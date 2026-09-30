import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Eye, EyeOff, Plus, Trash2, Undo2, RotateCcw, ChevronUp, ChevronDown, Check, X } from "lucide-react";
import { DEFAULT_MENU } from "@/lib/siteLayout";
import { MODULE_TYPES, MODULE_LIMITS, diffModules } from "@/lib/modules";
import { cn } from "@/lib/utils";

// Einheitlicher Editor für die Module in der Kopfzeile: anlegen, umbenennen,
// anordnen, ausblenden und wiederherstellen. Ziehen mit der Maus, Pfeile und
// Positionsfeld für Tastatur und Finger. Ausblenden löscht nichts.
export default function ModuleEditor({ items, saved, onChange, onApply }) {
  const [history, setHistory] = useState([]);
  const [addPath, setAddPath] = useState("");
  const changes = diffModules(saved, items);

  const commit = (next) => {
    setHistory((h) => [...h, items]);
    onChange(next);
  };

  const move = (index, to) => {
    if (to < 0 || to >= items.length || to === index) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    commit(next);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    move(result.source.index, result.destination.index);
  };

  const patch = (index, changesForItem) => commit(items.map((it, i) => (i === index ? { ...it, ...changesForItem } : it)));

  const add = () => {
    if (!addPath) return;
    const type = MODULE_TYPES.find((m) => m.path === addPath);
    if (!type) return;
    commit([...items, { id: `mod-${Date.now()}`, label: type.label, path: type.path, hidden: false }]);
    setAddPath("");
  };

  const btn = "w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0 disabled:opacity-40";

  return (
    <div className="space-y-5">
      <div className="glass rounded-2xl border border-border p-4">
        <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Was hier geht — und was nicht</p>
        <ul className="space-y-1">
          {MODULE_LIMITS.map((l) => (
            <li key={l} className="text-[14px] font-semibold text-muted-foreground">• {l}</li>
          ))}
        </ul>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="module-editor">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {items.map((item, index) => (
                <Draggable key={item.id || item.path} draggableId={item.id || item.path} index={index}>
                  {(p) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      className={cn("rounded-xl border border-border bg-card p-2 flex flex-wrap items-center gap-2", item.hidden && "opacity-60")}
                    >
                      <span {...p.dragHandleProps} className="cursor-grab text-muted-foreground px-1" title="Ziehen zum Verschieben">
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={items.length}
                        value={index + 1}
                        onChange={(e) => move(index, Number(e.target.value) - 1)}
                        title="Position eintippen"
                        className="w-14 h-9 rounded-lg bg-elevated border border-border text-center text-sm font-bold text-foreground"
                      />
                      <input
                        value={item.label}
                        onChange={(e) => patch(index, { label: e.target.value })}
                        className="h-9 flex-1 min-w-[120px] px-3 rounded-lg bg-elevated border border-border text-sm font-semibold text-foreground"
                      />
                      <select
                        value={item.path}
                        onChange={(e) => patch(index, { path: e.target.value, label: MODULE_TYPES.find((m) => m.path === e.target.value)?.label || item.label })}
                        className="h-9 rounded-lg bg-elevated border border-border px-2 text-[13px] font-semibold text-muted-foreground"
                      >
                        {MODULE_TYPES.map((m) => (
                          <option key={m.path} value={m.path}>{m.label}</option>
                        ))}
                      </select>
                      <button onClick={() => move(index, index - 1)} disabled={index === 0} className={btn} title="Nach oben">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => move(index, index + 1)} disabled={index === items.length - 1} className={btn} title="Nach unten">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => patch(index, { hidden: !item.hidden })}
                        className={cn("h-9 px-3 rounded-full glass-btn text-xs font-bold flex items-center gap-1.5 flex-shrink-0", item.hidden ? "text-destructive" : "text-emerald-400")}
                        title={item.hidden ? "Wieder einblenden — nichts wurde gelöscht" : "Nur ausblenden, nichts löschen"}
                      >
                        {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {item.hidden ? "Ausgeblendet" : "Sichtbar"}
                      </button>
                      <button onClick={() => commit(items.filter((_, i) => i !== index))} className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0" title="Aus der Leiste nehmen — später wieder hinzufügbar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex flex-wrap items-center gap-2">
        <select value={addPath} onChange={(e) => setAddPath(e.target.value)} className="h-10 rounded-xl bg-elevated border border-border px-3 text-sm font-semibold text-foreground">
          <option value="">Seite wählen …</option>
          {MODULE_TYPES.filter((m) => !items.some((i) => i.path === m.path)).map((m) => (
            <option key={m.path} value={m.path}>{m.label}</option>
          ))}
        </select>
        <button onClick={add} disabled={!addPath} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-sm font-bold disabled:opacity-50">
          <Plus className="w-4 h-4" /> Modul hinzufügen
        </button>
        <button onClick={() => history.length && onChange(history[history.length - 1])} disabled={!history.length} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-sm font-bold disabled:opacity-40">
          <Undo2 className="w-4 h-4" /> Rückgängig
        </button>
        <button onClick={() => commit(DEFAULT_MENU)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-sm font-bold">
          <RotateCcw className="w-4 h-4" /> Auf Standard zurücksetzen
        </button>
      </div>

      <div className="rounded-2xl border-2 border-border bg-elevated p-4">
        <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Vorschau der globalen Änderung</p>
        {changes.length === 0 ? (
          <p className="text-[14px] font-semibold text-muted-foreground">Noch nichts geändert gegenüber dem gespeicherten Stand.</p>
        ) : (
          <>
            <ul className="space-y-1 mb-3">
              {changes.map((c, i) => (
                <li key={i} className="text-[14px] font-semibold text-foreground">• {c.text}</li>
              ))}
            </ul>
            <p className="text-[13px] font-semibold text-muted-foreground mb-3">
              Diese Änderung sieht jeder Besucher. Inhalte, Chats und Berechtigungen bleiben unverändert.
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onApply(items)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-sm font-bold">
                <Check className="w-4 h-4" /> Jetzt für alle anwenden
              </button>
              <button onClick={() => onChange(saved)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-sm font-bold text-muted-foreground">
                <X className="w-4 h-4" /> Verwerfen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}