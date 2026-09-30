import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export default function PersonChip({ creator, active, locked, onClick }) {
  if (!creator) return null;
  return (
    <button
      type="button"
      onClick={locked ? undefined : onClick}
      className={cn(
        "inline-flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border text-xs font-semibold transition-colors",
        active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
        locked && "cursor-default"
      )}
    >
      {creator.avatar ? (
        <Image src={creator.avatar} fittingType="fill" className="w-7 h-7 rounded-full flex-shrink-0" />
      ) : (
        <span className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center font-display text-[10px] text-primary flex-shrink-0">{creator.stageName?.[0]}</span>
      )}
      {creator.stageName}{active && " ✓"}
    </button>
  );
}