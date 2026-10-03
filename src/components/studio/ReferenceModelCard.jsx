import React from "react";
import { Image } from "@/components/ui/image";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Ein Vorbild als Karte: Bild, Name, wofür es taugt und die Schlagworte.
export default function ReferenceModelCard({ model, onEdit, onRemove }) {
  return (
    <div className={cn("rounded-2xl border-2 border-border bg-card overflow-hidden", model.active === false && "opacity-60")}>
      <div className="aspect-[3/4] bg-elevated">
        {model.avatar ? (
          <Image src={model.avatar} fittingType="fill" className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-3xl text-primary">
            {model.name?.[0] || "?"}
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-bold text-foreground truncate">{model.name}</p>
        {model.useFor && <p className="text-[12px] font-semibold text-muted-foreground line-clamp-2 mt-0.5">{model.useFor}</p>}
        {model.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {model.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          <button onClick={() => onEdit(model)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground hover:text-foreground">
            <Pencil className="w-3.5 h-3.5" /> Bearbeiten
          </button>
          <button onClick={() => onRemove(model)} className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}