import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

// Die Ablage im Plan: einen Wunsch von links hierher ziehen übernimmt ihn sofort.
export default function PlanDropZone({ children }) {
  return (
    <Droppable droppableId="plan">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            "rounded-2xl border-2 border-dashed p-2 transition-colors min-h-[120px]",
            snapshot.isDraggingOver ? "border-primary bg-primary/10" : "border-transparent"
          )}
        >
          {snapshot.isDraggingOver && (
            <p className="text-center text-sm font-bold text-primary py-3">Loslassen — kommt in den Plan</p>
          )}
          {children}
          <div className="hidden">{provided.placeholder}</div>
        </div>
      )}
    </Droppable>
  );
}