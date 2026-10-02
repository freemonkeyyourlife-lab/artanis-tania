import React from "react";
import { Link } from "react-router-dom";
import { GripVertical, ChevronUp, ChevronDown, Eye, EyeOff, Trash2, ExternalLink } from "lucide-react";
import { MODULE_TYPES, moduleFor } from "@/lib/modules";
import { cn } from "@/lib/utils";

const BTN = "w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0 disabled:opacity-40";

// Eine Zeile der Seitenübersicht: Name, Ziel, Position und alle Schalter an
// einer Stelle — verschieben, umbenennen, umleiten, aus- und einblenden.
export default function SitePageRow({ item, index, total, dragHandleProps, onChange, onMove, onRemove }) {
  const target = moduleFor(item.path);

  return (
    <div className={cn("rounded-xl border border-border bg-card p-2 flex flex-wrap items-center gap-2", item.hidden && "opacity-60")}>
      <span {...dragHandleProps} title="Ziehen zum Verschieben" className="cursor-grab text-muted-foreground px-1">
        <GripVertical className="w-4 h-4" />
      </span>

      <input
        type="number"
        min={1}
        max={total}
        value={index + 1}
        onChange={(e) => onMove(index, Number(e.target.value) - 1)}
        title="Position eintippen"
        className="w-14 h-9 rounded-lg bg-elevated border border-border text-center text-sm font-bold text-foreground"
      />

      <input
        value={item.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Name im Menü"
        className="h-9 flex-1 min-w-[120px] px-3 rounded-lg bg-elevated border border-border text-sm font-semibold text-foreground"
      />

      <select
        value={target ? item.path : ""}
        onChange={(e) => onChange({ path: e.target.value })}
        title="Wohin der Knopf führt"
        className="h-9 rounded-lg bg-elevated border border-border px-2 text-[13px] font-semibold text-muted-foreground"
      >
        {!target && <option value="">{item.path} (unbekannt)</option>}
        {MODULE_TYPES.map((m) => (
          <option key={m.path} value={m.path}>{m.label}</option>
        ))}
      </select>

      <button onClick={() => onMove(index, index - 1)} disabled={index === 0} className={BTN} title="Nach oben">
        <ChevronUp className="w-4 h-4" />
      </button>
      <button onClick={() => onMove(index, index + 1)} disabled={index === total - 1} className={BTN} title="Nach unten">
        <ChevronDown className="w-4 h-4" />
      </button>

      <button
        onClick={() => onChange({ hidden: !item.hidden })}
        title={item.hidden ? "Wieder einblenden — nichts wurde gelöscht" : "Nur ausblenden, nichts löschen"}
        className={cn("h-9 px-3 rounded-full glass-btn text-xs font-bold flex items-center gap-1.5 flex-shrink-0", item.hidden ? "text-destructive" : "text-emerald-400")}
      >
        {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        {item.hidden ? "Ausgeblendet" : "Sichtbar"}
      </button>

      <Link to={item.path || "/"} title="Seite ansehen" className={BTN}>
        <ExternalLink className="w-4 h-4" />
      </Link>

      <button onClick={onRemove} title="Aus dem Menü nehmen — unten wieder einbindbar" className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}