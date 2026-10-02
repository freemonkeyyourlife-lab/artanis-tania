import React from "react";
import HarvestEditRow from "@/components/studio/HarvestEditRow";

// Eine Schublade voller bearbeitbarer Fundstücke.
export default function HarvestEditGroup({ label, rows, selected, onToggle, onChange, onAll }) {
  if (!rows.length) return null;
  const chosen = rows.filter((r) => selected.has(r.rid)).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[15px] font-bold text-foreground">{label}</span>
        <span className="text-[12px] font-bold text-muted-foreground">
          {rows.length} gefunden · {chosen} gewählt
        </span>
        <span className="flex-1" />
        <button
          onClick={() => onAll(rows, true)}
          className="px-3.5 py-1.5 rounded-full glass-btn text-[12px] font-bold text-muted-foreground"
        >
          Alle
        </button>
        <button
          onClick={() => onAll(rows, false)}
          className="px-3.5 py-1.5 rounded-full glass-btn text-[12px] font-bold text-muted-foreground"
        >
          Keine
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <HarvestEditRow
            key={r.rid}
            row={r}
            checked={selected.has(r.rid)}
            onToggle={onToggle}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}