import React from "react";
import { cn } from "@/lib/utils";
import { paletteKeyOf, paletteSorted } from "@/lib/palette";

// Die acht Neigungen als Schalter. Mehrere gleichzeitig sind der Normalfall.
export default function NeigungChips({ items, value = [], onToggle }) {
  const list = paletteSorted(items);

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((n) => {
        const key = paletteKeyOf(n);
        const on = value.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            title={n.kurz || ""}
            className={cn(
              "glass-btn rounded-full px-4 py-2 text-sm",
              on && "glass-btn-accent"
            )}
          >
            {n.label}
            <span className="ml-2 text-xs opacity-60">Stufe {n.level}</span>
          </button>
        );
      })}
      {!list.length && (
        <span className="text-sm text-muted-foreground">Keine Neigungen angelegt.</span>
      )}
    </div>
  );
}