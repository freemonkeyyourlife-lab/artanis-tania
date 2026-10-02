import React, { useState } from "react";
import { Trash2, FileCheck2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_STATUSES, planTypeLabel } from "@/lib/contentPlan";

// Ein Eintrag im Content-Plan — Status weiterziehen und direkt einen Post anlegen.
export default function PlanItemCard({ item, creatorName, requestTitle, onStatus, onRemove, onMakePost, onSchedule }) {
  const [busy, setBusy] = useState(false);
  const makePost = async () => {
    setBusy(true);
    try { await onMakePost?.(item); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-elevated border border-border">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {planTypeLabel(item.type)}
          {creatorName ? ` · ${creatorName}` : ""}
          {item.requestId ? ` · Wunsch: ${requestTitle || "aus der Community"}` : ""}
        </p>
        {item.description && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {onSchedule && (
            <input
              type="date"
              value={item.scheduledAt ? item.scheduledAt.slice(0, 10) : ""}
              onChange={(e) => onSchedule(e.target.value ? new Date(`${e.target.value}T12:00:00`).toISOString() : null)}
              title="Veröffentlichungs-Termin"
              className="px-2.5 py-1 rounded-full bg-background border border-border text-[11px] font-semibold text-foreground"
            />
          )}
          {item.contentId ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
              <FileCheck2 className="w-3 h-3" /> Post angelegt
            </span>
          ) : (
            <button
              onClick={makePost}
              disabled={busy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold hover:bg-primary/25 transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileCheck2 className="w-3 h-3" />}
              Post anlegen
            </button>
          )}
        </div>
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