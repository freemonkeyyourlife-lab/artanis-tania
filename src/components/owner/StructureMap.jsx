import React from "react";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, RotateCcw, KeyRound } from "lucide-react";
import { isGodMode } from "@/lib/godMode";
import StructureArea from "@/components/owner/StructureArea";
import StructureItem from "@/components/owner/StructureItem";
import { defaultStructure } from "@/lib/siteStructure";

// Die App als Bild — und als Werkbank: Bereiche und Knöpfe lassen sich hier
// frei ziehen, umbenennen und umlenken. Die Kopfzeile folgt genau dieser Karte.
export default function StructureMap({ structure, onChange }) {
  const areas = structure?.areas || [];

  const commit = (next) => onChange({ ...structure, areas: next });

  const patchArea = (id, patch) => commit(areas.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const patchItem = (areaId, itemId, patch) =>
    commit(
      areas.map((a) =>
        a.id === areaId ? { ...a, items: a.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) } : a
      )
    );

  const removeItem = (areaId, itemId) =>
    commit(areas.map((a) => (a.id === areaId ? { ...a, items: a.items.filter((it) => it.id !== itemId) } : a)));

  const addItem = (areaId, page) =>
    commit(
      areas.map((a) =>
        a.id === areaId
          ? {
              ...a,
              items: [
                ...a.items,
                { id: `neu-${Date.now()}`, label: page.label, path: page.path, hidden: false },
              ],
            }
          : a
      )
    );

  const addArea = () =>
    commit([...areas, { id: `area-${Date.now()}`, label: "Neuer Bereich", items: [] }]);

  const removeArea = (id) => {
    const area = areas.find((a) => a.id === id);
    if (!area) return;
    if (!window.confirm(`Bereich „${area.label}" mit allen ${area.items.length} Knöpfen entfernen?`)) return;
    commit(areas.filter((a) => a.id !== id));
  };

  const onDragEnd = ({ source, destination, type }) => {
    if (!destination) return;

    // Ein ganzer Bereich wandert.
    if (type === "AREA") {
      if (source.index === destination.index) return;
      const next = [...areas];
      const [moved] = next.splice(source.index, 1);
      next.splice(destination.index, 0, moved);
      commit(next);
      return;
    }

    // Ein Knopf wandert — innerhalb seines Bereichs oder in einen anderen.
    const fromId = source.droppableId.replace("area-items-", "");
    const toId = destination.droppableId.replace("area-items-", "");
    const next = areas.map((a) => ({ ...a, items: [...a.items] }));
    const from = next.find((a) => a.id === fromId);
    const to = next.find((a) => a.id === toId);
    if (!from || !to) return;
    const [moved] = from.items.splice(source.index, 1);
    to.items.splice(destination.index, 0, moved);
    commit(next);
  };

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="font-display text-xl text-foreground mb-1">So ist die App aufgebaut</p>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-3xl">
            Oben die Leiste, darunter ihre Bereiche mit jedem Knopf und der Seite, auf die er führt. Zieh einen Knopf am
            Griff — in seinem Bereich oder in einen anderen. Zieh einen Bereich am Griff, um ihn zu verschieben. Der Stift
            ändert Namen und Ziel, unten legst du Neues dazu. Danach speichern.
          </p>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Alles auf den Standard zurücksetzen?")) onChange(defaultStructure());
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4" /> Zurücksetzen
        </button>
      </div>

      {/* Der Godmode-Weg: nur sichtbar, wenn der Meister-Schalter an ist. */}
      {isGodMode() && (
        <Link
          to="/logbuch"
          title="Godmode"
          className="mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-yellow-300/60 transition-colors hover:text-yellow-300"
        >
          <KeyRound className="w-3.5 h-3.5" /> Logbuch öffnen
        </Link>
      )}

      <div className="rounded-2xl border-2 border-border bg-elevated px-4 py-3 text-center max-w-md mx-auto">
        <p className="font-display text-lg text-foreground">Kopfzeile</p>
        <p className="text-[12px] font-semibold text-muted-foreground">
          Die Bereiche stehen hier in dieser Reihenfolge — links zuerst.
        </p>
      </div>
      <div className="flex justify-center">
        <span className="w-0.5 h-7 bg-border" />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="areas" type="AREA" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start"
            >
              {areas.map((area, index) => (
                <Draggable key={area.id} draggableId={`area-${area.id}`} index={index} type="AREA">
                  {(ap) => (
                    <div ref={ap.innerRef} {...ap.draggableProps}>
                      <StructureArea
                        area={area}
                        dragHandleProps={ap.dragHandleProps}
                        onRename={(label) => patchArea(area.id, { label })}
                        onDelete={() => removeArea(area.id)}
                        onAddItem={(page) => addItem(area.id, page)}
                      >
                        <Droppable droppableId={`area-items-${area.id}`} type="ITEM">
                          {(ip) => (
                            <div ref={ip.innerRef} {...ip.droppableProps} className="space-y-2 min-h-[10px]">
                              {area.items.map((item, i) => (
                                <Draggable key={item.id} draggableId={item.id} index={i} type="ITEM">
                                  {(p) => (
                                    <div ref={p.innerRef} {...p.draggableProps}>
                                      <StructureItem
                                        item={item}
                                        handleProps={p.dragHandleProps}
                                        onChange={(patch) => patchItem(area.id, item.id, patch)}
                                        onRemove={() => removeItem(area.id, item.id)}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {ip.placeholder}
                              {area.items.length === 0 && (
                                <p className="text-[12px] font-semibold text-muted-foreground text-center py-3">
                                  Leer — zieh hier einen Knopf hinein.
                                </p>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </StructureArea>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button
        onClick={addArea}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
      >
        <Plus className="w-4 h-4" /> Neuen Bereich anlegen
      </button>
    </div>
  );
}