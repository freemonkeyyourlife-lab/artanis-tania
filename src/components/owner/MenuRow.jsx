import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GripVertical, Eye, EyeOff, Trash2, Pencil, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MODULE_TYPES, moduleFor } from "@/lib/modules";

// Ein Menüpunkt in der Übersicht: was er heißt, wohin er führt und was dort
// passiert. Aufklappen zum Bearbeiten — mit Ziel-Auswahl statt freier Adresse.
export default function MenuRow({ item, dragHandleProps, onChange, onRemove }) {
  const [editing, setEditing] = useState(false);
  const target = moduleFor(item.path);

  return (
    <div className={cn("rounded-xl border border-border bg-card", item.hidden && "opacity-60")}>
      <div className="flex items-center gap-2 p-2">
        <span {...dragHandleProps} title="Ziehen zum Verschieben" className="cursor-grab text-muted-foreground px-1">
          <GripVertical className="w-4 h-4" />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-foreground truncate">{item.label}</p>
          <p className="text-[12px] font-semibold text-muted-foreground truncate">
            {target ? `führt zu: ${target.label}` : `führt zu: ${item.path}`}
            {item.hidden && " · ausgeblendet"}
          </p>
        </div>

        <button
          onClick={() => setEditing((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-bold flex-shrink-0 transition-colors",
            editing ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground"
          )}
        >
          {editing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          {editing ? "Fertig" : "Bearbeiten"}
        </button>

        <button
          onClick={() => onChange({ hidden: !item.hidden })}
          title={item.hidden ? "Wieder einblenden" : "Ausblenden"}
          className={cn("w-9 h-9 rounded-full glass-btn flex items-center justify-center flex-shrink-0", item.hidden ? "text-destructive" : "text-emerald-400")}
        >
          {item.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        <Link
          to={item.path || "/"}
          title="Anschauen — wohin der Klick führt"
          className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary flex-shrink-0"
        >
          <Eye className="w-4 h-4" />
        </Link>

        <button
          onClick={onRemove}
          title="Entfernen"
          className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {editing && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Name im Menü</label>
            <Input
              value={item.label}
              onChange={(e) => onChange({ label: e.target.value })}
              className="mt-1.5 h-10 text-[15px] font-semibold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Wohin der Klick führt</label>
            <select
              value={target ? item.path : ""}
              onChange={(e) => onChange({ path: e.target.value })}
              className="mt-1.5 w-full h-10 rounded-xl border border-input bg-transparent px-3 text-[15px] font-semibold text-foreground"
            >
              {!target && <option value="">{item.path} (unbekannte Adresse)</option>}
              {MODULE_TYPES.map((m) => (
                <option key={m.path} value={m.path}>
                  {m.label} — {m.path}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[12px] font-semibold text-muted-foreground">
              {target ? target.description : "Diese Adresse gibt es nicht — bitte eine Seite aus der Liste wählen."}
            </p>
          </div>

          <button
            onClick={() => onChange({ hidden: !item.hidden })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground"
          >
            {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {item.hidden ? "Ausgeblendet — wieder einblenden" : "Sichtbar — ausblenden"}
          </button>
        </div>
      )}
    </div>
  );
}