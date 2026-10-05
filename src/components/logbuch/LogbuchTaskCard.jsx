import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { STATUS, STATUS_LABEL, kindLabel } from "@/lib/logbuch";

// Eine Karte im Logbuch: was zu tun ist, wie dringend, und der Prompt zum
// Nachlesen. Der Status lässt sich hier direkt weiterschieben.
export default function LogbuchTaskCard({ task, onStatus }) {
  const [open, setOpen] = useState(false);

  const next = task.status === STATUS.WARTESCHLANGE ? STATUS.IN_ARBEIT : STATUS.FERTIG;

  return (
    <div className="rounded-2xl border border-border bg-elevated p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-bold text-foreground">{task.title}</div>
          <div className="text-[11px] text-muted-foreground">
            {kindLabel(task.kind)} · Dringlichkeit {task.urgency}
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {STATUS_LABEL[task.status]}
        </span>
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
          {open ? "Prompt schließen" : "Prompt zeigen"}
        </Button>
        {task.status !== STATUS.FERTIG && (
          <Button size="sm" variant="outline" onClick={() => onStatus(task, next)}>
            → {STATUS_LABEL[next]}
          </Button>
        )}
        {task.status !== STATUS.VERWORFEN && (
          <Button size="sm" variant="ghost" onClick={() => onStatus(task, STATUS.VERWORFEN)}>
            Verwerfen
          </Button>
        )}
      </div>

      {open && (
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">
          {task.prompt}
        </pre>
      )}

      {task.progress?.length > 0 && (
        <div className={cn("mt-3 space-y-1 border-t border-border pt-2 text-[11px] text-muted-foreground")}>
          {task.progress.map((p, i) => (
            <div key={i}>{p}</div>
          ))}
        </div>
      )}
    </div>
  );
}