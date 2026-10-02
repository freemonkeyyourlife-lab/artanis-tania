import React from "react";
import { format, isPast, isToday } from "date-fns";
import { de } from "date-fns/locale";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { planStatusLabel, planTypeLabel } from "@/lib/contentPlan";

// Der Fahrplan: was als Nächstes rausgeht — überfällige Termine stehen rot.
export default function PublishTimeline({ items = [], creators = [] }) {
  return (
    <div className="glass rounded-2xl border border-border p-5">
      <h2 className="font-display text-xl text-foreground mb-1 flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-primary" /> Veröffentlichungs-Fahrplan
      </h2>
      <p className="text-xs text-muted-foreground mb-4">Alles mit Termin, das noch nicht veröffentlicht ist.</p>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Noch keine Termine — setz im Plan ein Datum, dann steht es hier.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => {
            const d = new Date(p.scheduledAt);
            const late = isPast(d) && !isToday(d);
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border">
                <div
                  className={cn(
                    "w-14 flex-shrink-0 text-center rounded-lg py-1.5",
                    late ? "bg-destructive/15 text-destructive" : isToday(d) ? "bg-primary/15 text-primary" : "bg-background text-foreground"
                  )}
                >
                  <p className="text-lg font-display leading-none">{format(d, "d")}</p>
                  <p className="text-[10px] font-bold uppercase">{format(d, "MMM", { locale: de })}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {planTypeLabel(p.type)} · {planStatusLabel(p.status)}
                    {creators.find((c) => c.id === p.creatorId)?.stageName ? ` · ${creators.find((c) => c.id === p.creatorId).stageName}` : ""}
                    {late ? " · überfällig" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}