import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import MenuRow from "@/components/owner/MenuRow";

// Die Übersicht der Kopfzeile: jeder Eintrag mit Ziel und Funktion, verschiebbar,
// bearbeitbar und mit dem Knopf zum Erstellen.
export default function MenuEditor({ items, onChange }) {
  const update = (index, patch) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  const add = () =>
    onChange([
      ...items,
      { id: `eigen-${Date.now()}`, label: "Neuer Eintrag", path: "/explore", hidden: false },
    ]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const next = [...items];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange(next);
  };

  return (
    <div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="menu">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {items.map((item, index) => (
                <Draggable key={item.id || item.path} draggableId={item.id || item.path} index={index}>
                  {(p) => (
                    <div ref={p.innerRef} {...p.draggableProps}>
                      <MenuRow
                        item={item}
                        dragHandleProps={p.dragHandleProps}
                        onChange={(patch) => update(index, patch)}
                        onRemove={() => remove(index)}
                      />
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
        onClick={add}
        className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
      >
        <Plus className="w-4 h-4" /> Erstellen
      </button>
    </div>
  );
}