import React from "react";
import { Image } from "@/components/ui/image";
import { Pencil, Users } from "lucide-react";
import { kindLabel, statusLabel } from "@/lib/ideen";

// Eine Karte im Ordner: Idee, Geschichte, Menschen, Prompt und Bilder zusammen.
export default function IdeaCard({ idea, onEdit }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg text-foreground truncate">{idea.title}</p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {kindLabel(idea.kind)} · {statusLabel(idea.status)}
          </p>
        </div>
        <button
          onClick={() => onEdit(idea)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-btn text-[12px] font-bold text-foreground whitespace-nowrap"
        >
          <Pencil className="w-3 h-3" /> Öffnen
        </button>
      </div>

      {idea.people?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-primary" />
          {idea.people.map((p) => (
            <span key={p.name} className="px-2.5 py-1 rounded-full bg-elevated border border-border text-[11px] font-bold text-foreground">
              {p.name}
            </span>
          ))}
        </div>
      )}

      {idea.idea && <p className="text-[13px] font-semibold text-muted-foreground line-clamp-3">{idea.idea}</p>}
      {idea.story && <p className="text-[13px] font-semibold text-foreground/80 line-clamp-4">{idea.story}</p>}

      {idea.prompt && (
        <div className="rounded-xl bg-background border border-border px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Prompt</p>
          <p className="text-[12px] font-semibold text-foreground/90 line-clamp-3">{idea.prompt}</p>
        </div>
      )}

      {idea.images?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {idea.images.slice(0, 6).map((url) => (
            <Image key={url} src={url} fittingType="fill" className="w-16 h-16 rounded-xl border border-border" />
          ))}
        </div>
      )}
    </div>
  );
}