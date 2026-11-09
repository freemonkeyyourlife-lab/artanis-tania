import React, { useRef } from "react";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Eine Kachel, die im Bearbeitungsmodus frei verschiebbar, in der Größe
// veränderbar und löschbar ist. Außerhalb des Modus füllt sie einfach ihren
// Platz. Wiederverwendbar für jede Seite, die das Canvas-System nutzen will.

export default function EditTile({ pos, edit, onChange, onRemove, children }) {
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
        edit ? "absolute cursor-move select-none ring-2 ring-primary/40" : "w-full h-full"
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