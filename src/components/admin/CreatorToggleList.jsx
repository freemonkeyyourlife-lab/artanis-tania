import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export default function CreatorToggleList({ creators, onChanged }) {
  const [busy, setBusy] = useState(null);

  const setField = async (creator, data) => {
    setBusy(creator.id);
    try {
      await base44.entities.Creator.update(creator.id, data);
      await onChanged?.();
    } finally {
      setBusy(null);
    }
  };

  if (!creators.length) {
    return <p className="text-muted-foreground text-sm">Noch keine Charaktere.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {creators.map((c) => (
        <div
          key={c.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-2xl border border-border bg-elevated",
            c.active === false && "opacity-60"
          )}
        >
          {c.avatar ? (
            <Image
              src={c.avatar}
              fittingType="fill"
              className={cn("w-12 h-12 rounded-full flex-shrink-0", c.active === false && "grayscale")}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-display text-primary flex-shrink-0">
              {c.stageName?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{c.stageName}</p>
            <p className="text-[11px] text-muted-foreground">
              {c.active === false ? "Inaktiv" : "Aktiv"} · {c.artStyle === "CARTOON" ? "Animiert" : "Foto"}
            </p>
            <div className="flex gap-2 mt-2">
              <button
                disabled={busy === c.id}
                onClick={() => setField(c, { active: c.active === false })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50",
                  c.active === false
                    ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {c.active === false ? "Aktivieren" : "Deaktivieren"}
              </button>
              <button
                disabled={busy === c.id}
                onClick={() => setField(c, { artStyle: c.artStyle === "CARTOON" ? "PHOTOREAL" : "CARTOON" })}
                title="Diesen Charakter animiert (gezeichnet) anzeigen"
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50",
                  c.artStyle === "CARTOON"
                    ? "bg-violet-600/25 text-violet-300 hover:bg-violet-600/35"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {c.artStyle === "CARTOON" ? "Animiert ✓" : "Animiert"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}