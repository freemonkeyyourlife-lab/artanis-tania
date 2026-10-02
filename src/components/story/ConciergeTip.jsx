import React from "react";
import { Image } from "@/components/ui/image";
import { Loader2, Volume2, VolumeX, Lightbulb } from "lucide-react";
import { kindOf } from "@/lib/narratorStyle";

// Der Concierge schaut über die Schulter: was sie sieht, was jetzt dran ist.
// Zu zweit stehen beide mit Bild und Namen über ihren Zeilen.
export default function ConciergeTip({ narrators = [], lines = [], nudge, loading, speaking, onSpeak, onStop }) {
  const two = narrators.length > 1;

  return (
    <div className="w-full sm:w-[340px] rounded-3xl glass-strong border-2 border-primary/30 p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="flex -space-x-2.5 flex-shrink-0">
          {(narrators.length ? narrators : [null]).map((n, i) =>
            n?.avatar ? (
              <Image key={i} src={n.avatar} fittingType="fill" className="w-10 h-10 rounded-full ring-2 ring-background" />
            ) : (
              <span key={i} className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center ring-2 ring-background">
                <Lightbulb className="w-5 h-5 text-primary" />
              </span>
            )
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-foreground leading-tight truncate">
            {two ? narrators.map((n) => n.name).join(" & ") : narrators[0]?.name || "Dein Concierge"}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {two ? "Die Erzählerinnen" : narrators[0] ? kindOf(narrators[0].kind).label : "Concierge"}
          </p>
        </div>
        <button
          onClick={() => (speaking ? onStop() : onSpeak())}
          disabled={loading || !lines.length}
          className="ml-auto w-9 h-9 rounded-full glass-btn flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          title={speaking ? "Verstummen" : "Vorlesen"}
        >
          {speaking ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
        </button>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Sie überlegen …
        </p>
      ) : lines.length ? (
        <div className="space-y-2.5">
          {lines.map((line, i) => {
            const person = narrators[line.who] || narrators[0];
            return (
              <div key={i}>
                {two && (
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