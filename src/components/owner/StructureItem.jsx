import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GripVertical, Pencil, Check, EyeOff, Eye, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MODULE_TYPES, moduleFor } from "@/lib/modules";
import { cn } from "@/lib/utils";

// Ein Knopf in der Struktur: er zeigt, wohin er führt, und lässt sich hier
// direkt umbenennen, umlenken, ausblenden oder herausnehmen.
export default function StructureItem({ item, handleProps, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const page = moduleFor(item.path);

  return (
    <div className={cn("rounded-xl border border-border bg-elevated px-3 py-2.5", item.hidden && "opacity-55")}>
      <div className="flex items-start gap-2">
        {handleProps && (
          <span
            {...handleProps}
            title="Ziehen — auch in einen anderen Bereich"
            className="cursor-grab text-muted-foreground pt-0.5 flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </span>
        )}
        <Link to={item.path} title="Seite ansehen" className="min-w-0 flex-1">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-bold text-foreground">{item.label || "Ohne Namen"}</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-[12px] font-bold text-primary">{page?.label || item.path}</span>
          </span>
          <span className="block text-[12px] font-semibold text-muted-foreground mt-1 leading-snug">
            {item.hidden ? "Ausgeblendet — steht nicht in der Kopfzeile." : page?.description || "Kein bekanntes Ziel — hier umstellen."}
          </span>
        </Link>
        <button
          onClick={() => setEditing((v) => !v)}
          title={editing ? "Fertig" : "Diesen Knopf ändern"}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
            editing ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground hover:text-foreground"
          )}
        >
          {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-border space-y-2.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Name in der Leiste</label>
            <Input
              value={item.label}
              onChange={(e) => onChange({ label: e.target.value })}
              className="mt-1.5 h-10 text-[15px] font-semibold"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Wohin der Klick führt</label>
            <select
              value={page ? item.path : ""}
              onChange={(e) => onChange({ path: e.target.value })}
              className="mt-1.5 w-full h-10 rounded-xl border border-input bg-transparent px-3 text-[14px] font-semibold text-foreground"
            >
              {!page && <option value="">{item.path} (unbekannte Adresse)</option>}
              {MODULE_TYPES.map((m) => (
                <option key={m.path} value={m.path}>
                  {m.label} — {m.path}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onChange({ hidden: !item.hidden })}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[12px] font-bold text-foreground"
            >
              {item.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {item.hidden ? "Wieder einblenden" : "Ausblenden"}
            </button>
            <button
              onClick={onRemove}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/15 text-destructive text-[12px] font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" /> Herausnehmen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}