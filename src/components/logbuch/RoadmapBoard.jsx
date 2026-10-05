import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, ListOrdered, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { URGENCY_LABEL, EFFORT_LABEL, clusterOf } from "@/lib/roadmap";

// Die Roadmap: die Warteschlange in der Reihenfolge, in der gebaut wird.
// Ziehen schiebt an, der Knopf sortiert nach den drei Kriterien.
export default function RoadmapBoard({ items = [], onSave, onAutoSort, onStatus }) {
  const onDragEnd = ({ source, destination }) => {
    if (!destination || source.index === destination.index) return;
    const next = [...items];
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    onSave(next);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-heading">Roadmap</div>
          <div className="text-xs text-muted-foreground">
            Von oben nach unten. Ziehen schiebt an — der Agent arbeitet die Reihenfolge ab.
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onAutoSort} disabled={!items.length}>
          <ListOrdered className="mr-2 h-4 w-4" /> Nach Kriterien sortieren
        </Button>
      </div>

      {!items.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nichts in der Warteschlange. Auftrag oben eingeben und freigeben.
        </p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="roadmap">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="mt-4 space-y-2">
                {items.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border border-border bg-elevated p-3",
                          index === 0 && "border-primary"
                        )}
                      >
                        <span
                          {...p.dragHandleProps}
                          className="cursor-grab text-muted-foreground"
                          title="Ziehen zum Anschubsen"
                        >
                          <GripVertical className="h-4 w-4" />
                        </span>

                        <span className="w-6 shrink-0 text-center font-display text-lg text-muted-foreground">
                          {index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-foreground">
                            {task.title}
                            {index === 0 && (
                              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-primary">
                                Nächster Auftrag
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {clusterOf(task)} · {URGENCY_LABEL[task.urgency] || "normal"} · Aufwand{" "}
                            {EFFORT_LABEL[task.effort] || "mittel"}
                          </div>
                        </div>

                        <Button size="sm" variant="ghost" onClick={() => onStatus(task)}>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}