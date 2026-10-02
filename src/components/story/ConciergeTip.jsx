import React from "react";
import { Loader2, Volume2, VolumeX, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { kindOf } from "@/lib/narratorStyle";
import NarratorStatusCard from "@/components/story/NarratorStatusCard";

// Das Feld, in dem beide Erzählerinnen gleichzeitig stehen — jede mit Bild und
// Status — und darunter, was sie zu deinem Fortschritt sagen.
export default function ConciergeTip({
  narrators = [],
  lines = [],
  nudge,
  stageIndex = 0,
  stageCount = 0,
  loading,
  speaking,
  speakingWho = null,
  onSpeak,
  onStop,
}) {
  const list = narrators.slice(0, 2);
  const statusOf = (i) => (!speaking ? "bereit" : speakingWho === i ? "spricht" : "hört zu");

  return (
    <div className="w-full rounded-3xl glass-strong border-2 border-primary/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <p className="flex-1 text-[11px] font-bold uppercase tracking-wider text-primary truncate">
          {list.length > 1 ? "Die Erzählerinnen" : list[0] ? kindOf(list[0].kind).label : "Dein Concierge"}
        </p>
        <button
          onClick={() => (speaking ? onStop() : onSpeak())}
          disabled={loading || !lines.length}
          className="w-9 h-9 rounded-full glass-btn flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          title={speaking ? "Verstummen" : "Vorlesen"}
        >
          {speaking ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
        </button>
      </div>

      {list.length > 0 && (
        <div className="flex gap-2 mb-3">
          {list.map((n, i) => (
            <NarratorStatusCard key={n.id || i} narrator={n} status={statusOf(i)} />
          ))}
        </div>
      )}

      {stageCount > 0 && (
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Zu Station {stageIndex + 1} von {stageCount}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Sie überlegen …
        </p>
      ) : lines.length ? (
        <div className="space-y-1.5">
          {lines.map((line, i) => {
            const person = list[line.who] || list[0];
            const active = speaking && speakingWho === (line.who ?? 0);
            return (
              <div key={i} className={cn("rounded-xl px-2.5 py-2 transition-colors", active && "bg-primary/10")}>
                {list.length > 1 && (
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-0.5">{person?.name}</p>
                )}
                <p className="text-[14px] font-semibold text-foreground leading-relaxed italic">„{line.text}“</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[13px] font-semibold text-muted-foreground">
          Sie sind da — geh einfach weiter, dann melden sie sich.
        </p>
      )}

      {nudge && !loading && (
        <p className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-[12px] font-bold">
          <Lightbulb className="w-3 h-3" /> {nudge}
        </p>
      )}
    </div>
  );
}