import React from "react";
import { Pencil, Trash2, Mic, User } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { kindLabel, blockMedia } from "@/lib/baukasten";

// Ein fertiger Baustein in der Übersicht — mit allem, was dranhängt.
export default function BlockCard({ block, onEdit, onDelete, onUse }) {
  const media = blockMedia(block);
  const cover = media[0];

  return (
    <div className="glass rounded-2xl border-2 border-border overflow-hidden flex flex-col">
      {cover?.type === "IMAGE" ? (
        <Image src={cover.url} fittingType="fill" className="w-full h-44" />
      ) : cover?.type === "VIDEO" ? (
        <video src={cover.url} className="w-full h-44 object-cover" muted />
      ) : (
        <div className="w-full h-44 bg-elevated flex items-center justify-center text-[13px] font-bold text-muted-foreground">
          Kein Bild
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase">
            {kindLabel(block.blockKind)}
          </span>
          {media.length > 1 && (
            <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px] font-bold">
              {media.length} Dateien
            </span>
          )}
        </div>

        <p className="font-display text-lg text-foreground mb-1">{block.title}</p>

        {block.personaName && (
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground mb-1">
            <User className="w-3.5 h-3.5" /> {block.personaName}
          </p>
        )}
        {block.situation && (
          <p className="text-[13px] font-semibold text-muted-foreground mb-2">{block.situation}</p>
        )}

        {block.activeVariants?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {block.activeVariants.map((v) => (
              <span key={v} className="px-2 py-1 rounded-full bg-elevated text-[11px] font-bold text-foreground">
                {v}
              </span>
            ))}
          </div>
        )}

        {block.voiceLine && (
          <p className="flex items-start gap-1.5 text-[13px] font-semibold text-foreground/80 italic mb-2">
            <Mic className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
            <span>{block.voiceLine}</span>
          </p>
        )}

        {block.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {block.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full border border-border text-[11px] font-bold text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          {onUse && (
            <button
              onClick={() => onUse(block)}
              className={cn("px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground")}
            >
              {block.shared ? "Übernehmen" : "In Baukasten"}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(block)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Ändern
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(block)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}