import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { ChevronDown, ChevronUp } from "lucide-react";

// Auf der Übersicht: erst die Kurzgeschichte, auf Wunsch die ganze.
export default function CharacterStoryCard({ creator, to = "/messages" }) {
  const [open, setOpen] = useState(false);
  const short = creator.shortStory || creator.tagline || creator.bio || "";
  const long = creator.bio || "";
  const hasMore = Boolean(long && long.trim() && long.trim() !== short.trim());

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      <Link to={to} className="relative block aspect-[3/4] bg-elevated">
        {creator.avatar ? (
          <Image src={creator.avatar} fittingType="fill" className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute top-2 right-2">
          <span className="px-2 py-0.5 rounded-full bg-violet-600/90 text-white text-[10px] font-semibold tracking-wider uppercase">KI</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="font-display text-base text-foreground">{creator.stageName}</p>
        </div>
      </Link>

      <div className="p-3 flex-1 flex flex-col">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{short}</p>
        {open && hasMore && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-2">{long}</p>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2 self-start inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            {open ? <>Weniger anzeigen <ChevronUp className="w-3 h-3" /></> : <>Ganze Geschichte <ChevronDown className="w-3 h-3" /></>}
          </button>
        )}
      </div>
    </div>
  );
}