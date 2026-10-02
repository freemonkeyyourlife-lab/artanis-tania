import React from "react";
import { Image } from "@/components/ui/image";
import { Mic, Ear, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { genderNoun, kindOf } from "@/lib/narratorStyle";

const STATUS = {
  spricht: { label: "spricht", dot: "bg-primary animate-pulse", pill: "bg-primary/20 text-primary", Icon: Mic },
  "hört zu": { label: "hört zu", dot: "bg-muted-foreground", pill: "bg-background/70 text-muted-foreground", Icon: Ear },
  bereit: { label: "bereit", dot: "bg-emerald-400", pill: "bg-emerald-400/15 text-emerald-300", Icon: Sparkles },
};

// Eine Erzählerin sichtbar: Bild, Rolle und was sie gerade tut.
export default function NarratorStatusCard({ narrator, status = "bereit" }) {
  const s = STATUS[status] || STATUS.bereit;
  const { Icon } = s;

  return (
    <div
      className={cn(
        "flex-1 min-w-0 rounded-2xl bg-background/50 border-2 p-2.5 transition-colors",
        status === "spricht" ? "border-primary/60" : "border-border"
      )}
    >
      <div className="relative">
        {narrator?.avatar ? (
          <Image src={narrator.avatar} fittingType="fill" className="w-full aspect-square rounded-xl" />
        ) : (
          <span className="w-full aspect-square rounded-xl bg-elevated border border-border flex items-center justify-center font-display text-2xl text-primary">
            {(narrator?.name || "?").slice(0, 1)}
          </span>
        )}
        <span className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-card", s.dot)} />
      </div>

      <p className="mt-2 text-[13px] font-bold text-foreground truncate">{narrator?.name || "Ohne Namen"}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
        {genderNoun(narrator?.gender)} · {kindOf(narrator?.kind).label}
      </p>
      <span className={cn("mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", s.pill)}>
        <Icon className="w-2.5 h-2.5" /> {s.label}
      </span>
    </div>
  );
}