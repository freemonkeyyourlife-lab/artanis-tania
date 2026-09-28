import React, { useState } from "react";
import { ArrowRight, ThumbsUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAN_TYPES, planTypeForRequest, requestTypeLabel } from "@/lib/contentPlan";

const inputCls =
  "w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Ein Community-Wunsch — vorbelegt, damit ein Klick zum Plan-Eintrag reicht.
export default function PlanRequestCard({ request, creators = [], onAdopt }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState({
    title: request.title || "",
    type: planTypeForRequest(request.type),
    creatorId: request.creatorId || "",
    note: request.description || "",
  });
  const set = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const adopt = async () => {
    setBusy(true);
    try { await onAdopt(values); }
    finally { setBusy(false); }
  };

  return (
    <div className={cn("rounded-xl border bg-elevated p-4", open ? "border-primary/40" : "border-border")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{request.title}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {requestTypeLabel(request.type)}
            {request.userName ? ` · von ${request.userName}` : ""}
            {request.creatorName ? ` · für ${request.creatorName}` : ""}
          </p>
          {request.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{request.description}</p>
          )}
          {request.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {request.topics.slice(0, 4).map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-background border border-border text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-background border border-border text-[11px] text-muted-foreground flex-shrink-0">
          <ThumbsUp className="w-3 h-3" /> {request.votes || 0}
        </span>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <input value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="Titel" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={values.type} onChange={(e) => set("type", e.target.value)} className={inputCls}>
              {PLAN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={values.creatorId} onChange={(e) => set("creatorId", e.target.value)} className={inputCls}>
              <option value="">Ohne Person</option>
              {creators.map((c) => <option key={c.id} value={c.id}>{c.stageName}</option>)}
            </select>
          </div>
          <textarea
            value={values.note}
            onChange={(e) => set("note", e.target.value)}
            rows={3}
            placeholder="Notiz zum Plan"
            className={cn(inputCls, "resize-none")}
          />
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-4 py-2 rounded-full bg-background border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {open ? "Abbrechen" : "Anpassen"}
        </button>
        <button
          onClick={adopt}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
          In Plan übernehmen
        </button>
      </div>
    </div>
  );
}