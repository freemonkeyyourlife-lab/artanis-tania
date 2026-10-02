import React, { useState } from "react";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Lock, Compass, ArrowRight, GripVertical, Pencil, Check, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buildNavGroups } from "@/components/nav/HeaderNav";
import { MENU_AREA_LABEL, MODULE_TYPES, moduleFor } from "@/lib/modules";
import { cn } from "@/lib/utils";

const NOTE = {
  Charaktere: "Steht immer — deine Hauptfiguren.",
  "Selbst erstellen": "Steht immer — deine Werkstatt.",
  [MENU_AREA_LABEL]: "Deine Knöpfe — hier bestimmst du Reihenfolge, Namen und Ziele.",
  Verwaltung: "Steht immer — nur für dich sichtbar.",
};

const isFree = (label) => label === MENU_AREA_LABEL;

// Ein Knopf in der Karte. Im eigenen Bereich klappt er auf: Name ändern,
// Ziel wählen, ausblenden — alles direkt hier, ohne woanders hinzugehen.
const PageChip = ({ item, handleProps, onPatch }) => {
  const [editing, setEditing] = useState(false);
  const page = moduleFor(item.path);

  return (
    <div className="rounded-xl border border-border bg-elevated px-3 py-2.5">
      <div className="flex items-start gap-2">
        {handleProps && (
          <span
            {...handleProps}
            title="Ziehen zum Verschieben"
            className="cursor-grab text-muted-foreground pt-0.5 flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </span>
        )}
        <Link to={item.path} title="Seite ansehen" className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-bold text-foreground">{item.label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-[12px] font-bold text-primary">{page?.label || item.path}</span>
          </span>
          <span className="block text-[12px] font-semibold text-muted-foreground mt-1 leading-snug">
            {page?.description || "Kein bekanntes Ziel — hier umstellen."}
          </span>
        </Link>
        {onPatch && (
          <button
            onClick={() => setEditing((v) => !v)}
            title={editing ? "Fertig" : "Diesen Knopf ändern"}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
              editing ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground hover:text-foreground"
            )}
          >
            {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {editing && onPatch && (
        <div className="mt-3 pt-3 border-t border-border space-y-2.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Name in der Leiste</label>
            <Input
              value={item.label}
              onChange={(e) => onPatch({ label: e.target.value })}
              className="mt-1.5 h-10 text-[15px] font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Wohin der Klick führt</label>
            <select
              value={page ? item.path : ""}
              onChange={(e) => onPatch({ path: e.target.value })}
              className="mt-1.5 w-full h-10 rounded-xl border border-input bg-transparent px-3 text-[14px] font-semibold text-foreground"
            >
              {!page && <option value="">{item.path} (unbekannte Adresse)</option>}
              {MODULE_TYPES.map((m) => (
                <option key={m.path} value={m.path}>
                  {m.label} — {m.path}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onPatch({ hidden: true })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[12px] font-bold text-foreground"
          >
            <EyeOff className="w-3.5 h-3.5" /> Aus der Leiste nehmen
          </button>
        </div>
      )}
    </div>
  );
};

// Die App als Bild: die Leiste oben, darunter ihre vier Bereiche mit jedem
// Knopf und der Seite, auf die er führt. Der eigene Bereich lässt sich direkt
// hier ziehen und umbenennen — die Reihenfolge ist die Reihenfolge oben.
export default function StructureMap({ items = [], onChange }) {
  const groups = buildNavGroups(items.filter((i) => i && i.path && !i.hidden));

  const freeGroup = groups.find((g) => g.label === MENU_AREA_LABEL);
  const indexByPath = new Map();
  items.forEach((it, i) => {
    if (it?.path && !it.hidden && !indexByPath.has(it.path)) indexByPath.set(it.path, i);
  });
  const freePaths = freeGroup?.items.map((i) => i.path) || [];
  const draggablePaths = freePaths.filter((p) => indexByPath.has(p));
  const extraPaths = freePaths.filter((p) => !indexByPath.has(p));

  const patchItem = (item, patch) => {
    if (!onChange) return;
    onChange(
      items.map((it) =>
        it === item || (it.id && item.id && it.id === item.id) ? { ...it, ...patch } : it
      )
    );
  };

  const onDragEnd = (result) => {
    if (!onChange || !result.destination) return;
    const from = indexByPath.get(draggablePaths[result.source.index]);
    const to = indexByPath.get(draggablePaths[result.destination.index]);
    if (from === undefined || to === undefined || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">So ist die App aufgebaut</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-6 max-w-3xl">
        Oben die Leiste, darunter ihre vier Bereiche. Jeder Knopf sitzt in einem Bereich und führt auf genau eine Seite —
        darunter steht, was dort passiert. Im Bereich „{MENU_AREA_LABEL}" ziehst du am Griff und ordnest die Leiste; mit dem
        Stift änderst du den Namen oder das Ziel, ohne die Ansicht zu verlassen. Danach unten speichern.
      </p>

      <div className="rounded-2xl border-2 border-border bg-elevated px-4 py-3 text-center max-w-md mx-auto">
        <p className="font-display text-lg text-foreground">Kopfzeile</p>
        <p className="text-[12px] font-semibold text-muted-foreground">Die Leiste oben — auf jeder Seite sichtbar</p>
      </div>
      <div className="flex justify-center">
        <span className="w-0.5 h-7 bg-border" />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {groups.map((group) => (
            <div
              key={group.label}
              className={cn(
                "relative rounded-2xl border-2 bg-card p-4",
                isFree(group.label) ? "border-primary/40" : "border-border"
              )}
            >
              <span className="absolute left-1/2 -top-4 w-0.5 h-4 bg-border" />
              <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
                {isFree(group.label) ? <Compass className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {group.label}
              </p>
              <p className="text-[12px] font-semibold text-muted-foreground mb-3 mt-0.5">{NOTE[group.label]}</p>

              {isFree(group.label) ? (
                <Droppable droppableId="structure-free">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {draggablePaths.map((path, index) => {
                        const item = items[indexByPath.get(path)];
                        return (
                          <Draggable key={item.id || path} draggableId={item.id || path} index={index}>
                            {(p) => (
                              <div ref={p.innerRef} {...p.draggableProps}>
                                <PageChip
                                  item={item}
                                  handleProps={p.dragHandleProps}
                                  onPatch={(patch) => patchItem(item, patch)}
                                />
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {extraPaths.map((path) => (
                        <PageChip key={path} item={freeGroup.items.find((i) => i.path === path)} />
                      ))}
                      {draggablePaths.length === 0 && extraPaths.length === 0 && (
                        <p className="text-[12px] font-semibold text-muted-foreground">Nichts drin.</p>
                      )}
                    </div>
                  )}
                </Droppable>
              ) : (
                <div className="space-y-2">
                  {group.items.map((it) => (
                    <PageChip key={it.path} item={it} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}