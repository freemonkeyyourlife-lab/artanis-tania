import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { DOCK_STATUS } from "@/lib/dock";

const STATUS_STYLE = {
  PENDING: "bg-amber-500/20 text-amber-400",
  APPROVED: "bg-emerald-600/20 text-emerald-400",
  REJECTED: "bg-destructive/20 text-destructive",
};

// Eine Andockung, wie sie in der Liste steht.
export default function DockCard({ dock }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex">
      <div className="w-24 flex-shrink-0 bg-elevated">
        {dock.avatar ? (
          <Image src={dock.avatar} fittingType="fill" className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-display text-2xl text-primary">{(dock.name || "?")[0]}</div>
        )}
      </div>
      <div className="p-3 flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{dock.name}</p>
            {dock.tagline && <p className="text-[11px] text-muted-foreground truncate">{dock.tagline}</p>}
          </div>
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap", STATUS_STYLE[dock.status] || STATUS_STYLE.PENDING)}>
            {DOCK_STATUS[dock.status] || DOCK_STATUS.PENDING}
          </span>
        </div>
        {dock.personality && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{dock.personality}</p>}
        {dock.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {dock.tags.slice(0, 6).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-elevated border border-border text-[10px] text-muted-foreground">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}