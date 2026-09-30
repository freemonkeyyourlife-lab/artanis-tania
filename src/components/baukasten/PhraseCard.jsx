import React, { useState } from "react";
import { Play, Pencil, Trash2, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { stageLabel } from "@/lib/phrases";

// Eine einzelne Sprechzeile — mit Vorhören in der gewählten Stimme.
export default function PhraseCard({ phrase, onEdit, onDelete, onPlay, onToggleFavorite }) {
  const [busy, setBusy] = useState(false);

  const listen = async () => {
    setBusy(true);
    try {
      await onPlay(phrase);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-border p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase">
          {stageLabel(phrase.stage)}
        </span>
        <button
          onClick={() => onToggleFavorite(phrase)}
          title="Merken"
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
            phrase.favorite ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Star className={cn("w-4 h-4", phrase.favorite && "fill-current")} />
        </button>
      </div>

      <p className="text-[15px] font-bold text-foreground leading-relaxed flex-1">„{phrase.text}"</p>

      {phrase.situation && (
        <p className="text-[12px] font-semibold text-muted-foreground mt-2">{phrase.situation}</p>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={listen}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {busy ? "Spricht …" : "Anhören"}
        </button>
        <button
          onClick={() => onEdit(phrase)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Ändern
        </button>
        <button
          onClick={() => onDelete(phrase)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Löschen
        </button>
      </div>
    </div>
  );
}