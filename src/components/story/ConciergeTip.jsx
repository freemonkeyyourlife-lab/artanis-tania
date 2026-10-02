import React from "react";
import { Image } from "@/components/ui/image";
import { Loader2, Volume2, VolumeX, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { kindOf } from "@/lib/narratorStyle";

// Der Concierge schaut über die Schulter: was sie sieht, was jetzt dran ist.
export default function ConciergeTip({ narrator, tip, nudge, loading, speaking, onSpeak, onStop }) {
  const kind = narrator ? kindOf(narrator.kind) : null;

  return (
    <div className="w-full sm:w-[330px] rounded-3xl glass-strong border-2 border-primary/30 p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        {narrator?.avatar ? (
          <Image src={narrator.avatar} fittingType="fill" className="w-10 h-10 rounded-full flex-shrink-0" />
        ) : (
          <span className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-primary" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-foreground leading-tight truncate">
            {narrator?.name || "Dein Concierge"}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {kind ? kind.label : "Concierge"}
          </p>
        </div>
        <button
          onClick={() => (speaking ? onStop() : onSpeak())}
          disabled={loading || !tip}
          className="ml-auto w-9 h-9 rounded-full glass-btn flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          title={speaking ? "Verstummen" : "Vorlesen"}
        >
          {speaking ? <VolumeX className="w-4 h-4 text-foreground" /> : <Volume2 className="w-4 h-4 text-foreground" />}
        </button>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Sie überlegt …
        </p>
      ) : tip ? (
        <p className="text-[14px] font-semibold text-foreground leading-relaxed italic">„{tip}“</p>
      ) : (
        <p className="text-[13px] font-semibold text-muted-foreground">
          Sie ist da — geh einfach weiter, dann meldet sie sich.
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