import React from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_STATUSES, planTypeLabel } from "@/lib/contentPlan";

// Ein Eintrag im Content-Plan — Status direkt hier weiterziehen.
export default function PlanItemCard({ item, creatorName, onStatus, onRemove }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-elevated border border-border">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {planTypeLabel(item.type)}
          {creatorName ? ` · ${creatorName}` : ""}
          {item.requestId ? " · aus Community-Wunsch" : ""}
        </p>
        {item.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
      </div>
      <select
        value={item.status || "IDEA"}
        onChange={(e) => onStatus(e.target.value)}
        className={cn(
          "px-3 py-1.5 rounded-full text-[11px] font-semibold bg-background border border-border flex-shrink-0",
          item.status === "PUBLISHED" ? "text-emerald-400" : "text-foreground"
        )}
      >
        {PLAN_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <button
        onClick={onRemove}
        title="Aus dem Plan nehmen"
        className="w-8 h-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}