import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Eye, EyeOff, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Sortieren, umbenennen, ausblenden, ergänzen — genau die Knöpfe, die man
// selbst nicht braucht, aber ordentlich haben will.
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
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border border-border bg-card p-2",
                        item.hidden && "opacity-50"
                      )}
                    >
                      <span {...p.dragHandleProps} className="cursor-grab text-muted-foreground px-1">
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <Input
                        value={item.label}
                        onChange={(e) => update(index, { label: e.target.value })}
                        className="h-9 flex-1"
                      />
                      <Input
                        value={item.path}
                        onChange={(e) => update(index, { path: e.target.value })}
                        className="h-9 flex-1"
                      />
                      <button
                        onClick={() => update(index, { hidden: !item.hidden })}
                        title={item.hidden ? "Einblenden" : "Ausblenden"}
                        className="w-9 h-9 rounded-full glass-btn flex items-center justify-center flex-shrink-0"
                      >
                        {item.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => remove(index)}
                        title="Entfernen"
                        className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0"
                      >
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

      <button
        onClick={add}
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-sm font-semibold text-foreground"
      >
        <Plus className="w-4 h-4" /> Eintrag hinzufügen
      </button>
    </div>
  );
}