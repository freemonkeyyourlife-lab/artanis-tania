import React, { useState } from "react";
import { GripVertical, Pencil, Check, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MODULE_TYPES } from "@/lib/modules";

// Ein Bereich der Kopfzeile. Der Griff verschiebt den ganzen Bereich, der Stift
// benennt ihn um, unten legst du einen Knopf dazu. Was drinsteht, kommt von oben.
export default function StructureArea({ area, dragHandleProps, onRename, onDelete, onAddItem, children }) {
  const [renaming, setRenaming] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState(MODULE_TYPES[0].path);

  const shown = (area.items || []).filter((i) => !i.hidden).length;

  return (
    <div className="relative rounded-2xl border-2 border-border bg-card p-4 flex flex-col">
      <span className="absolute left-1/2 -top-4 w-0.5 h-4 bg-border" />
      <div className="flex items-center gap-2 mb-3">
        <span {...dragHandleProps} title="Bereich verschieben" className="cursor-grab text-muted-foreground flex-shrink-0">
          <GripVertical className="w-4 h-4" />
        </span>
        {renaming ? (
          <Input
            value={area.label}
            onChange={(e) => onRename(e.target.value)}
            className="h-9 text-[14px] font-bold"
            autoFocus
          />
        ) : (
          <p className="flex-1 text-[12px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {area.label}
          </p>
        )}
        <span className="text-[11px] font-bold text-muted-foreground flex-shrink-0">{shown}</span>
        <button
          onClick={() => setRenaming((v) => !v)}
          title={renaming ? "Fertig" : "Bereich umbenennen"}
          className="w-7 h-7 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          {renaming ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onDelete}
          title="Bereich entfernen"
          className="w-7 h-7 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1">{children}</div>

      {adding ? (
        <div className="mt-2 space-y-2">
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className="w-full h-9 rounded-xl border border-input bg-transparent px-3 text-[13px] font-semibold text-foreground"
          >
            {MODULE_TYPES.map((m) => (
              <option key={m.path} value={m.path}>
                {m.label} — {m.path}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const page = MODULE_TYPES.find((m) => m.path === pick);
                if (page) onAddItem(page);
                setAdding(false);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[12px] font-bold text-gloss"
            >
              <Plus className="w-3.5 h-3.5" /> Dazulegen
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 rounded-full text-[12px] font-bold text-muted-foreground hover:text-foreground"
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full glass-btn text-[12px] font-bold text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-3.5 h-3.5" /> Knopf dazulegen
        </button>
      )}
    </div>
  );
}