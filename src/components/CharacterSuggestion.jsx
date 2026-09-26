import React from "react";
import { Sparkles } from "lucide-react";
import { Image } from "@/components/ui/image";

// The AI proposes another existing character when the user's fantasy matches her.
export default function CharacterSuggestion({ name, reason, creator, onOpen }) {
  if (!creator) return null;
  return (
    <button
      onClick={() => onOpen(creator)}
      className="flex items-center gap-3 w-full max-w-xs p-2.5 rounded-xl bg-background border border-primary/40 text-left hover:border-primary transition-colors"
    >
      {creator.avatar ? (
        <Image src={creator.avatar} fittingType="fill" className="w-10 h-10 rounded-full flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary flex-shrink-0">{name?.[0]}</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate">{creator.stageName}</span>
        </p>
        {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
      </div>
      <span className="text-[11px] font-semibold text-primary flex-shrink-0">Öffnen</span>
    </button>
  );
}