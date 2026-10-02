import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { kindLabel } from "@/lib/baukasten";
import { suggestBlocks } from "@/lib/assistant";

// Schritt 4: Die Bausteine, die zur Figur passen — anklicken, was dazugehört.
export default function AssistantBlockStep({ blocks, creator, value, onChange }) {
  const list = suggestBlocks(blocks, creator);

  const toggle = (b) =>
    onChange(value.some((v) => v.id === b.id) ? value.filter((v) => v.id !== b.id) : [...value, b]);

  return (
    <div>
      <p className="font-display text-xl text-foreground mb-1">Welche Bausteine gehören dazu?</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Was zur Figur passt, steht oben. Was du anklickst, fließt in den Prompt ein. Nichts ist Pflicht — du kannst
        auch ohne weitergehen.
      </p>

      {list.length === 0 ? (
        <p className="text-[15px] font-semibold text-muted-foreground py-8">
          Noch keine Bausteine angelegt — die entstehen im Baukasten.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {list.map((b) => {
            const active = value.some((v) => v.id === b.id);
            return (
              <button
                key={b.id}
                onClick={() => toggle(b)}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition-colors",
                  active ? "border-primary" : "border-border hover:border-primary/50"
                )}
              >
                <p className="inline-flex items-center gap-2 text-[15px] font-bold text-foreground mb-1">
                  {active && <Check className="w-4 h-4 text-primary" />}
                  {b.title}
                </p>
                <p className="text-[13px] font-semibold text-muted-foreground">{kindLabel(b.blockKind)}</p>
                {b.situation && <p className="text-[13px] font-semibold text-muted-foreground mt-1">{b.situation}</p>}
              </button>
            );
          })}
        </div>
      )}

      {value.length > 0 && (
        <p className="mt-3 text-[13px] font-bold text-primary">{value.length} ausgewählt</p>
      )}
    </div>
  );
}