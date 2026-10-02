import React from "react";
import { cn } from "@/lib/utils";

// Eine Zeile im Archiv: wer, worüber, wann.
export default function ArchiveRow({ active, title, subtitle, meta, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-border transition-colors",
        active ? "bg-elevated" : "hover:bg-elevated/60"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-semibold text-foreground truncate">{title}</span>
        {badge && (
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-background border border-border text-[10px] text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>}
      {meta && <p className="text-[10px] text-muted-foreground/80 mt-1">{meta}</p>}
    </button>
  );
}