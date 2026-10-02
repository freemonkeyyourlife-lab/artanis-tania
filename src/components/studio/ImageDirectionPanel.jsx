import React from "react";
import { RotateCcw } from "lucide-react";
import DirectionPickRow from "@/components/studio/DirectionPickRow";
import {
  DIRECTION_CONTENTS,
  DIRECTION_LEVELS,
  DIRECTION_MOODS,
  DIRECTION_OUTFITS,
  DIRECTION_STYLES,
  directionSummary,
  emptyDirection,
} from "@/lib/imageDirection";

const ROWS = [
  { key: "stil", label: "Stil", options: DIRECTION_STYLES },
  { key: "inhalt", label: "Inhalt", options: DIRECTION_CONTENTS },
  { key: "klamotte", label: "Klamotte", options: DIRECTION_OUTFITS },
  { key: "stimmung", label: "Stimmung", options: DIRECTION_MOODS },
  { key: "freizuegigkeit", label: "Freizügigkeit", options: DIRECTION_LEVELS },
];

// Derselbe Regler-Block überall: im Generator, in der Massen-Erzeugung und im
// Externen Studio. Was hier steht, landet eins zu eins im Bild-Prompt.
export default function ImageDirectionPanel({ value, onChange, fields, title = "Regie" }) {
  const dir = value || emptyDirection();
  const rows = fields ? ROWS.filter((r) => fields.includes(r.key)) : ROWS;
  const summary = directionSummary(dir);

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-foreground">{title}</p>
          <p className="text-[12px] font-semibold text-muted-foreground truncate">
            {summary || "Nichts gewählt — es zählt nur dein Prompt."}
          </p>
        </div>
        {summary && (
          <button
            type="button"
            onClick={() => onChange(emptyDirection())}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn text-[12px] font-bold text-muted-foreground whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Zurücksetzen
          </button>
        )}
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <DirectionPickRow
            key={r.key}
            label={r.label}
            options={r.options}
            value={dir[r.key]}
            onChange={(v) => onChange({ ...dir, [r.key]: v })}
          />
        ))}
      </div>
    </div>
  );
}