import React from "react";
import LogbuchTaskCard from "@/components/logbuch/LogbuchTaskCard";
import { STATUS, STATUS_LABEL, STATUS_ORDER } from "@/lib/logbuch";

// Die Listen des Logbuchs: was wartet, was läuft, was fertig ist.
export default function LogbuchBoard({ tasks, onStatus }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STATUS_ORDER.map((status) => {
        const items = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-heading text-sm">{STATUS_LABEL[status]}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((t) => (
                <LogbuchTaskCard key={t.id} task={t} onStatus={onStatus} />
              ))}
              {!items.length && (
                <p className="py-6 text-center text-xs text-muted-foreground">Nichts hier.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}